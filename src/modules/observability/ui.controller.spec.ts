import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { existsSync, readdirSync } from 'node:fs';
import * as path from 'node:path';
import { PUBLIC_DIR, UiController } from './ui.controller';

describe('web console serving', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ controllers: [UiController] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  it('resolves the public folder that ships with the package', () => {
    expect(existsSync(path.join(PUBLIC_DIR, 'index.html'))).toBe(true);
  });

  it('serves the console at / with a strict Content-Security-Policy', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<title>Forge</title>');
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  it('keeps the old /ui address working', async () => {
    const res = await request(app.getHttpServer()).get('/ui').expect(200);
    expect(res.text).toContain('/assets/app.js');
  });

  it('serves every shipped asset with the right content type', async () => {
    const files = readdirSync(path.join(PUBLIC_DIR, 'assets')).filter(
      (f) => /\.(js|css|svg)$/.test(f) && !f.endsWith('.d.ts'),
    );
    expect(files).toEqual(expect.arrayContaining(['app.js', 'app.css', 'lib.js']));
    await request(app.getHttpServer()).get('/assets/lib.d.ts').expect(404); // typings are not served
    for (const f of files) {
      const res = await request(app.getHttpServer()).get(`/assets/${f}`).expect(200);
      expect(res.headers['content-type']).toMatch(f.endsWith('.css') ? /text\/css/ : /javascript/);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    }
  });

  it('refuses traversal, dotfiles, odd extensions and missing files', async () => {
    for (const bad of [
      '..%2Fpackage.json',
      '..%5C..%5Cpackage.json',
      '.env',
      'app.js.map',
      'APP.JS',
      'nope.js',
      '%2E%2E%2Findex.html',
    ]) {
      await request(app.getHttpServer()).get(`/assets/${bad}`).expect(404);
    }
  });

  it('every module imported by the app exists (no broken imports in the shipped console)', async () => {
    const fs = await import('node:fs/promises');
    const dir = path.join(PUBLIC_DIR, 'assets');
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
      const src = await fs.readFile(path.join(dir, f), 'utf8');
      for (const m of src.matchAll(/from '\.\/([\w-]+\.js)'/g)) {
        expect(existsSync(path.join(dir, m[1])), `${f} imports ${m[1]}`).toBe(true);
      }
    }
  });
});
