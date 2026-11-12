import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

/** The slice of the HTTP response this controller uses (keeps us free of express typings). */
interface Response {
  status(code: number): this;
  setHeader(name: string, value: string): this;
  send(body: Buffer | string): this;
}

/** The web console lives in /public (plain ES modules, no build step) and ships with the package. */
export const PUBLIC_DIR = path.resolve(__dirname, '..', '..', '..', 'public');
const ASSET_NAME = /^[a-z0-9][a-z0-9-]*\.(js|css|svg|woff2)$/;
const TYPES: Record<string, string> = {
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  svg: 'image/svg+xml',
  woff2: 'font/woff2',
};
// Everything is same-origin; inline styles are used for small layout tweaks, never inline scripts.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'";

@Controller()
export class UiController {
  @Get()
  index(@Res() res: Response) {
    return this.sendIndex(res);
  }

  /** Old dashboard URL — now the same console. */
  @Get('ui')
  legacy(@Res() res: Response) {
    return this.sendIndex(res);
  }

  @Get('assets/:file')
  async asset(@Param('file') file: string, @Res() res: Response) {
    // Flat, whitelisted names only: no paths, no traversal, no dotfiles.
    if (!ASSET_NAME.test(file)) throw new NotFoundException();
    const ext = file.split('.').pop() as string;
    let body: Buffer;
    try {
      body = await readFile(path.join(PUBLIC_DIR, 'assets', file));
    } catch {
      throw new NotFoundException();
    }
    res
      .status(200)
      .setHeader('Content-Type', TYPES[ext])
      .setHeader('Cache-Control', 'no-cache')
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(body);
  }

  private async sendIndex(res: Response) {
    const html = await readFile(path.join(PUBLIC_DIR, 'index.html'));
    res
      .status(200)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'no-cache')
      .setHeader('Content-Security-Policy', CSP)
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(html);
  }
}
