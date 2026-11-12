import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * HTTP hardening for the Forge server (no extra dependencies).
 *
 * Forge's API can start agents and run acceptance commands, so anyone who can call it can run
 * code on this machine. The defaults therefore assume a single operator on localhost:
 *  - listen on 127.0.0.1 unless FORGE_HOST says otherwise; any other address requires FORGE_API_TOKEN
 *  - Host allowlist: blocks DNS rebinding (a web page re-pointing its own name at 127.0.0.1)
 *  - state-changing requests must be JSON and same-origin: blocks CSRF from any open web page
 *  - optional bearer/cookie token (FORGE_API_TOKEN), compared in constant time
 *  - security headers, no X-Powered-By, a per-client rate limit on writes
 */

export interface SecurityOptions {
  host: string;
  port: number;
  token?: string;
  allowedHosts: string[];
  writeLimitPerMinute: number;
}

interface Req {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}
interface Res {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}
type Next = () => void;

const LOOPBACK = ['127.0.0.1', '::1', 'localhost'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const PUBLIC_PATHS = [/^\/$/, /^\/ui$/, /^\/assets\/[^/]+$/, /^\/health(\/.*)?$/];
export const TOKEN_COOKIE = 'forge_token';

export function isLoopback(host: string): boolean {
  return LOOPBACK.includes(host.replace(/^\[|\]$/g, '').toLowerCase());
}

/** Reads the hardening settings from the environment (FORGE_HOST, FORGE_API_TOKEN, ...). */
export function securityOptionsFromEnv(env: NodeJS.ProcessEnv = process.env): SecurityOptions {
  const host = env.FORGE_HOST?.trim() || '127.0.0.1';
  const port = env.PORT ? Number(env.PORT) : 3000;
  const token = env.FORGE_API_TOKEN?.trim() || undefined;
  const extra = (env.FORGE_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return {
    host,
    port,
    token,
    allowedHosts: [
      ...LOOPBACK,
      ...(isLoopback(host) || host === '0.0.0.0' || host === '::' ? [] : [host.toLowerCase()]),
      ...extra,
    ],
    writeLimitPerMinute: Number(env.FORGE_WRITE_LIMIT_PER_MINUTE ?? 120),
  };
}

/** Refuses configurations that would expose an unauthenticated code-execution API to a network. */
export function assertSafeToListen(opts: SecurityOptions): void {
  if (!isLoopback(opts.host) && !opts.token) {
    throw new Error(
      `Refusing to listen on ${opts.host} without FORGE_API_TOKEN. Forge can run code on this machine; ` +
        'set FORGE_API_TOKEN to a long random value, or keep FORGE_HOST=127.0.0.1.',
    );
  }
  if (opts.token && opts.token.length < 24) {
    throw new Error(
      'FORGE_API_TOKEN must be at least 24 characters. Generate one with: openssl rand -hex 32',
    );
  }
}

function header(req: Req, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}

function hostOnly(value: string): string {
  // "example.com:3000" → "example.com"; "[::1]:3000" → "::1"
  const v = value.trim().toLowerCase();
  if (v.startsWith('[')) return v.slice(1, v.indexOf(']'));
  return v.split(':')[0];
}

function digest(s: string): Buffer {
  return createHash('sha256').update(s).digest();
}

function tokenMatches(expected: string, given: string | undefined): boolean {
  return given !== undefined && timingSafeEqual(digest(expected), digest(given));
}

function cookie(req: Req, name: string): string | undefined {
  const raw = header(req, 'cookie');
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

function deny(res: Res, status: number, message: string): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ statusCode: status, message }));
}

/** Express-compatible middleware implementing all request-level checks. */
export function securityMiddleware(opts: SecurityOptions, now: () => number = Date.now) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return (req: Req, res: Res, next: Next): void => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    const path = req.url.split('?')[0];
    const hostHeader = header(req, 'host');
    if (!hostHeader || !opts.allowedHosts.includes(hostOnly(hostHeader))) {
      return deny(
        res,
        421,
        'Unknown host. Add it to FORGE_ALLOWED_HOSTS if this address is intended.',
      );
    }

    // Token login for the browser: /?token=... sets an HttpOnly cookie, then drops the token from the URL.
    if (opts.token && req.method === 'GET' && path === '/' && req.url.includes('token=')) {
      const given = new URLSearchParams(req.url.split('?')[1] ?? '').get('token') ?? undefined;
      if (tokenMatches(opts.token, given)) {
        res.setHeader(
          'Set-Cookie',
          `${TOKEN_COOKIE}=${encodeURIComponent(given!)}; HttpOnly; SameSite=Strict; Path=/`,
        );
        res.statusCode = 303;
        res.setHeader('Location', '/');
        return res.end();
      }
      return deny(res, 401, 'Invalid token.');
    }

    const unsafe = !SAFE_METHODS.has(req.method);
    if (unsafe) {
      const origin = header(req, 'origin');
      if (origin) {
        let originHost = '';
        try {
          originHost = new URL(origin).host.toLowerCase();
        } catch {
          /* "null" or garbage */
        }
        if (originHost !== hostHeader.toLowerCase())
          return deny(res, 403, 'Cross-site request refused.');
      }
      const length = Number(header(req, 'content-length') ?? 0);
      const chunked = Boolean(header(req, 'transfer-encoding'));
      const type = (header(req, 'content-type') ?? '').toLowerCase();
      if ((length > 0 || chunked) && !type.startsWith('application/json')) {
        return deny(res, 415, 'Send JSON (Content-Type: application/json).');
      }

      const client = req.socket?.remoteAddress ?? 'unknown';
      const t = now();
      const b = buckets.get(client);
      if (!b || t >= b.resetAt) buckets.set(client, { count: 1, resetAt: t + 60_000 });
      else if (++b.count > opts.writeLimitPerMinute)
        return deny(res, 429, 'Too many changes. Wait a minute and try again.');
    }

    if (opts.token && !PUBLIC_PATHS.some((re) => re.test(path))) {
      const auth = header(req, 'authorization');
      const bearer = auth?.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : undefined;
      // A signed-in person's session is checked by the access guard; the token is for automation.
      const hasSession = Boolean(cookie(req, 'forge_session'));
      if (
        !hasSession &&
        !path.startsWith('/auth/') &&
        !tokenMatches(opts.token, bearer) &&
        !tokenMatches(opts.token, cookie(req, TOKEN_COOKIE))
      ) {
        return deny(
          res,
          401,
          'Sign in: open /?token=<FORGE_API_TOKEN> in the browser, or send Authorization: Bearer <token>.',
        );
      }
    }
    next();
  };
}
