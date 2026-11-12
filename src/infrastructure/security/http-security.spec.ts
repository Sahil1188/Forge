import { describe, it, expect } from 'vitest';
import {
  assertSafeToListen,
  securityMiddleware,
  securityOptionsFromEnv,
  SecurityOptions,
} from './http-security';

const TOKEN = 'a'.repeat(32);

function call(
  opts: SecurityOptions,
  req: { method?: string; url?: string; headers?: Record<string, string>; ip?: string },
) {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    body: '',
    setHeader: (k: string, v: string) => void (headers[k.toLowerCase()] = v),
    end: (b?: string) => void (res.body = b ?? ''),
  };
  let passed = false;
  securityMiddleware(opts)(
    {
      method: req.method ?? 'GET',
      url: req.url ?? '/companies',
      headers: { host: 'localhost:3000', ...req.headers },
      socket: { remoteAddress: req.ip ?? '127.0.0.1' },
    },
    res,
    () => void (passed = true),
  );
  return { passed, status: res.statusCode, headers, body: res.body };
}

const local = securityOptionsFromEnv({} as NodeJS.ProcessEnv);
const withToken = securityOptionsFromEnv({ FORGE_API_TOKEN: TOKEN } as NodeJS.ProcessEnv);

describe('listen safety', () => {
  it('defaults to loopback and refuses a network address without a token', () => {
    expect(local.host).toBe('127.0.0.1');
    expect(() => assertSafeToListen(local)).not.toThrow();
    expect(() =>
      assertSafeToListen(securityOptionsFromEnv({ FORGE_HOST: '0.0.0.0' } as NodeJS.ProcessEnv)),
    ).toThrow(/FORGE_API_TOKEN/);
    expect(() =>
      assertSafeToListen(
        securityOptionsFromEnv({
          FORGE_HOST: '0.0.0.0',
          FORGE_API_TOKEN: 'short',
        } as NodeJS.ProcessEnv),
      ),
    ).toThrow(/24/);
    expect(() =>
      assertSafeToListen(
        securityOptionsFromEnv({
          FORGE_HOST: '0.0.0.0',
          FORGE_API_TOKEN: TOKEN,
        } as NodeJS.ProcessEnv),
      ),
    ).not.toThrow();
  });
});

describe('request checks', () => {
  it('passes a normal local request and sets security headers', () => {
    const r = call(local, {});
    expect(r.passed).toBe(true);
    expect(r.headers['x-frame-options']).toBe('DENY');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['referrer-policy']).toBe('no-referrer');
  });

  it('blocks DNS rebinding (unknown Host header)', () => {
    expect(call(local, { headers: { host: 'attacker.example:3000' } }).status).toBe(421);
    expect(call(local, { headers: { host: '127.0.0.1:3000' } }).passed).toBe(true);
    expect(call(local, { headers: { host: '[::1]:3000' } }).passed).toBe(true);
    const named = securityOptionsFromEnv({ FORGE_ALLOWED_HOSTS: 'forge.lan' } as NodeJS.ProcessEnv);
    expect(call(named, { headers: { host: 'forge.lan' } }).passed).toBe(true);
  });

  it('blocks cross-site writes (CSRF) but allows same-origin ones', () => {
    const json = { 'content-type': 'application/json', 'content-length': '10' };
    expect(
      call(local, { method: 'POST', headers: { ...json, origin: 'https://evil.example' } }).status,
    ).toBe(403);
    expect(call(local, { method: 'POST', headers: { ...json, origin: 'null' } }).status).toBe(403);
    expect(
      call(local, { method: 'POST', headers: { ...json, origin: 'http://localhost:3000' } }).passed,
    ).toBe(true);
    expect(call(local, { method: 'POST', headers: json }).passed).toBe(true); // CLI / curl: no Origin
  });

  it('refuses form, multipart and text bodies on writes (simple cross-site requests)', () => {
    for (const type of [
      'application/x-www-form-urlencoded',
      'multipart/form-data; boundary=x',
      'text/plain',
    ]) {
      expect(
        call(local, { method: 'POST', headers: { 'content-type': type, 'content-length': '5' } })
          .status,
      ).toBe(415);
    }
    expect(call(local, { method: 'POST', headers: { 'content-length': '0' } }).passed).toBe(true); // empty POST (start, retry)
  });

  it('rate-limits writes per client', () => {
    const opts = { ...local, writeLimitPerMinute: 3 };
    const mw = securityMiddleware(opts, () => 1000);
    const statuses: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const res = { statusCode: 200, setHeader: () => undefined, end: () => undefined };
      mw(
        {
          method: 'POST',
          url: '/x',
          headers: { host: 'localhost' },
          socket: { remoteAddress: '1.2.3.4' },
        },
        res,
        () => undefined,
      );
      statuses.push(res.statusCode);
    }
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
  });

  it('with a token: API needs bearer or cookie; console shell and health stay reachable', () => {
    expect(call(withToken, { url: '/companies' }).status).toBe(401);
    expect(
      call(withToken, { url: '/companies', headers: { authorization: `Bearer ${TOKEN}` } }).passed,
    ).toBe(true);
    expect(
      call(withToken, { url: '/companies', headers: { authorization: 'Bearer wrong' } }).status,
    ).toBe(401);
    expect(
      call(withToken, { url: '/companies', headers: { cookie: `x=1; forge_token=${TOKEN}` } })
        .passed,
    ).toBe(true);
    for (const url of ['/', '/ui', '/assets/app.js', '/health'])
      expect(call(withToken, { url }).passed).toBe(true);
  });

  it('token login sets an HttpOnly SameSite cookie and redirects; a wrong token is refused', () => {
    const ok = call(withToken, { url: `/?token=${TOKEN}` });
    expect(ok.status).toBe(303);
    expect(ok.headers['set-cookie']).toMatch(/forge_token=.*HttpOnly; SameSite=Strict/);
    expect(ok.headers.location).toBe('/');
    expect(call(withToken, { url: '/?token=nope' }).status).toBe(401);
  });
});
