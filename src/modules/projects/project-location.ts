import { existsSync, readdirSync, statSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Where Forge puts the projects it creates.
 *
 *   <root>/<company>/<project>-<id8>      root = FORGE_PROJECTS_DIR or ~/Forge Projects
 *
 * A company can choose its own folder (projects go straight inside it), and a single goal can
 * name the exact folder for its project.
 */

export function defaultProjectsRoot(env: NodeJS.ProcessEnv = process.env): string {
  return path.resolve(env.FORGE_PROJECTS_DIR?.trim() || path.join(os.homedir(), 'Forge Projects'));
}

export function slug(text: string, fallback = 'project'): string {
  const s = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // drop accents: "Café" → "Cafe", not "Cafe-"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '');
  return s || fallback;
}

export function resolveRepoPath(input: {
  location?: string | null;
  companyDir?: string | null;
  companyName: string;
  projectName: string;
  projectId: string;
  env?: NodeJS.ProcessEnv;
}): string {
  if (input.location) return path.resolve(input.location);
  const parent = input.companyDir
    ? path.resolve(input.companyDir)
    : path.join(defaultProjectsRoot(input.env), slug(input.companyName, 'company'));
  return path.join(parent, `${slug(input.projectName)}-${input.projectId.slice(0, 8)}`);
}

/** Why a folder cannot hold Forge projects, or null when it is fine. */
export function folderProblem(dir: string, opts: { mustBeEmpty: boolean }): string | null {
  if (!path.isAbsolute(dir)) return 'Use a full path, for example C:\\Users\\you\\Projects\\my-app.';
  const resolved = path.resolve(dir);
  if (path.parse(resolved).root === resolved) return 'Choose a folder, not the root of a drive.';
  if (resolved.toLowerCase() === path.resolve(os.homedir()).toLowerCase()) return 'Choose a folder inside your home folder, not the home folder itself.';
  if (!existsSync(resolved)) return null;
  if (!statSync(resolved).isDirectory()) return 'That path is a file. Choose a folder.';
  if (opts.mustBeEmpty && readdirSync(resolved).length > 0) {
    return 'That folder is not empty. Choose a new or empty folder so nothing of yours is overwritten.';
  }
  return null;
}
