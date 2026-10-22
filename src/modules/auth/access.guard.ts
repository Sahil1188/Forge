import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import { AuthService, SESSION_COOKIE, SessionUser } from './auth.service';
import { atLeast, isPublic, requiredRole, resourceOf } from './access-policy';

export interface ForgeRequest {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  forge?: { user?: SessionUser; service?: boolean };
}

export function readCookie(req: ForgeRequest, name: string): string | undefined {
  const raw = req.headers.cookie;
  const header = Array.isArray(raw) ? raw.join(';') : raw;
  for (const part of (header ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

const digest = (s: string) => createHash('sha256').update(s).digest();

/**
 * Who may do what (global guard). With no accounts, Forge is a single-operator local app and
 * everything is allowed (the HTTP layer still protects it). Once accounts exist, every request
 * needs a session (or the service token) and the right role in the company it touches.
 */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ForgeRequest>();
    const { method, path } = req;
    if (isPublic(method, path)) return true;
    if (!(await this.auth.accountsEnabled())) return true;

    // Automation with the service token acts with full access.
    const token = process.env.FORGE_API_TOKEN?.trim();
    const auth = req.headers.authorization;
    const bearer = typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : undefined;
    if (token && bearer && timingSafeEqual(digest(token), digest(bearer))) {
      req.forge = { service: true };
      return true;
    }

    const user = await this.auth.userForToken(readCookie(req, SESSION_COOKIE));
    if (!user) throw new UnauthorizedException('Sign in to continue.');
    req.forge = { user };

    // Company-less routes: what can run here, and the company list (filtered) / creating a company.
    if (path === '/system' || path === '/companies') return true;

    const resource = resourceOf(path);
    if (!resource) throw new ForbiddenException('You don’t have access to this.');
    const companyId = await this.auth.companyOf(resource.kind, resource.id);
    if (!companyId) return true; // unknown record: the handler answers 404
    const role = await this.auth.roleIn(user.id, companyId);
    if (!role) throw new ForbiddenException('You don’t have access to this company.');
    const need = requiredRole(method, path);
    if (!atLeast(role, need)) throw new ForbiddenException(`This needs the ${need} role; you are a ${role} here.`);
    return true;
  }
}
