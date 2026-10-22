import { Injectable } from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import * as path from 'node:path';

export interface DiscoveredScript {
  name: string;
  command: string;
}

/**
 * Discovers a repo's actual verification commands (spec §12) rather than
 * assuming a fixed toolchain. V1 reads package.json scripts; the interface lets
 * other toolchains (Maven, Cargo, …) be added later.
 */
@Injectable()
export class ScriptDiscovery {
  private readonly order = ['build', 'test', 'lint'];

  async discover(rootPath: string): Promise<DiscoveredScript[]> {
    const pkgPath = path.join(rootPath, 'package.json');
    let scripts: Record<string, string> = {};
    try {
      const raw = await readFile(pkgPath, 'utf8');
      const pkg = JSON.parse(raw) as { scripts?: Record<string, string> };
      scripts = pkg.scripts ?? {};
    } catch {
      return this.discoverPython(rootPath);
    }
    return this.order
      .filter((name) => typeof scripts[name] === 'string' && scripts[name].length > 0)
      .map((name) => ({ name, command: `npm --silent run ${name}` }));
  }

  /**
   * Python projects (scripts generating workbooks, data pipelines, models): run their tests with
   * the standard library's unittest when there are test files, so no extra install is needed.
   */
  private async discoverPython(rootPath: string): Promise<DiscoveredScript[]> {
    const files = await readdir(rootPath).catch(() => [] as string[]);
    const testsDir = await readdir(path.join(rootPath, 'tests')).catch(() => [] as string[]);
    const hasTests = [...files, ...testsDir].some((f) => /^test_.*\.py$|^.*_test\.py$/.test(f));
    if (!hasTests) return [];
    return [{ name: 'test', command: 'python -m unittest discover -q -s . -p "test*.py"' }];
  }
}
