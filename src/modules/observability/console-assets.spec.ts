import { readdirSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { PUBLIC_DIR } from './ui.controller';

// The console is plain ES modules with no build step, so nothing else would catch a syntax error
// before a browser does (observed live: one broken string left the whole console blank).
describe('console scripts', () => {
  const dir = path.join(PUBLIC_DIR, 'assets');
  const scripts = readdirSync(dir).filter((f) => f.endsWith('.js'));

  it('has scripts to check', () => {
    expect(scripts.length).toBeGreaterThan(5);
  });

  for (const file of scripts) {
    it(`${file} parses as an ES module`, () => {
      const source = readFileSync(path.join(dir, file), 'utf8');
      const out = ts.transpileModule(source, {
        fileName: file,
        reportDiagnostics: true,
        compilerOptions: {
          allowJs: true,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      });
      const errors = (out.diagnostics ?? []).map((d) => {
        const at =
          d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : null;
        return `${file}${at ? `:${at.line + 1}:${at.character + 1}` : ''} ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`;
      });
      expect(errors).toEqual([]);
    });
  }
});
