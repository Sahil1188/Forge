import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { and, eq, gt, sql } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { companies, users } from '../companies/companies.schema';
import { goals } from '../goals/goals.schema';
import { employees } from '../employees/employees.schema';
import { workItems } from '../work/work.schema';
import { projects } from '../projects/projects.schema';
import { agentRuns } from '../runtimes/agent-runs.schema';
import { approvals } from '../approvals/approvals.schema';
import { evaluations } from '../evaluation/evaluation.schema';
import { memberships, Role, sessions } from './auth.schema';
import { ResourceKind } from './access-policy';

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const SESSION_DAYS = 14;
export const SESSION_COOKIE = 'forge_session';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** People, their access to companies, and sign-in sessions. */
@Injectable()
export class AuthService {
  private userCount: number | null = null;

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  static async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    return `${salt.toString('hex')}:${(await scrypt(password, salt, 64)).toString('hex')}`;
  }

  static async verifyPassword(password: string, stored: string | null): Promise<boolean> {
    if (!stored || !stored.includes(':')) return false;
    const [salt, hash] = stored.split(':');
    const actual = await scrypt(password, Buffer.from(salt, 'hex'), 64);
    const expected = Buffer.from(hash, 'hex');
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  }

  /** Accounts are on once anyone can sign in; until then Forge is a single-operator local app. */
  async accountsEnabled(): Promise<boolean> {
    if (this.userCount === null) {
      const [row] = await this.db.select({ n: sql<number>`count(*)::int` }).from(users).where(sql`${users.passwordHash} is not null`);
      this.userCount = row?.n ?? 0;
    }
    return this.userCount > 0;
  }

  /** The first account: owner of every existing company. Only allowed while no account exists. */
  async setup(input: { email: string; name: string; password: string }): Promise<SessionUser> {
    if (await this.accountsEnabled()) throw new ConflictException('Accounts are already set up. Sign in instead.');
    const user = await this.createUser(input);
    const all = await this.db.select({ id: companies.id }).from(companies);
    if (all.length) {
      await this.db
        .insert(memberships)
        .values(all.map((c) => ({ companyId: c.id, userId: user.id, role: 'owner' as const })))
        .onConflictDoNothing();
    }
    this.userCount = null;
    return user;
  }

  async login(email: string, password: string): Promise<{ user: SessionUser; token: string; expiresAt: Date }> {
    const [u] = await this.db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
    if (!u || !(await AuthService.verifyPassword(password, u.passwordHash))) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
    await this.db.insert(sessions).values({ id: sha256(token), userId: u.id, expiresAt });
    return { user: { id: u.id, email: u.email, name: u.name }, token, expiresAt };
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) await this.db.delete(sessions).where(eq(sessions.id, sha256(token)));
  }

  async userForToken(token: string | undefined): Promise<SessionUser | null> {
    if (!token) return null;
    const [row] = await this.db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())));
    return row ?? null;
  }

  async roleIn(userId: string, companyId: string): Promise<Role | null> {
    const [m] = await this.db.select({ role: memberships.role }).from(memberships).where(and(eq(memberships.userId, userId), eq(memberships.companyId, companyId)));
    return m?.role ?? null;
  }

  async companiesOf(userId: string): Promise<Array<{ companyId: string; role: Role }>> {
    return this.db.select({ companyId: memberships.companyId, role: memberships.role }).from(memberships).where(eq(memberships.userId, userId));
  }

  async grant(companyId: string, userId: string, role: Role): Promise<void> {
    await this.db
      .insert(memberships)
      .values({ companyId, userId, role })
      .onConflictDoUpdate({ target: [memberships.companyId, memberships.userId], set: { role } });
  }

  /** The company a record belongs to (null when the record doesn't exist). */
  async companyOf(kind: ResourceKind, id: string): Promise<string | null> {
    const one = async (q: Promise<Array<{ c: string | null }>>) => (await q)[0]?.c ?? null;
    switch (kind) {
      case 'company':
        return one(this.db.select({ c: companies.id }).from(companies).where(eq(companies.id, id)));
      case 'goal':
        return one(this.db.select({ c: goals.companyId }).from(goals).where(eq(goals.id, id)));
      case 'employee':
        return one(this.db.select({ c: employees.companyId }).from(employees).where(eq(employees.id, id)));
      case 'work_item':
        return one(this.db.select({ c: workItems.companyId }).from(workItems).where(eq(workItems.id, id)));
      case 'project':
        return one(this.db.select({ c: projects.companyId }).from(projects).where(eq(projects.id, id)));
      case 'agent_run':
        return one(this.db.select({ c: employees.companyId }).from(agentRuns).innerJoin(employees, eq(employees.id, agentRuns.employeeId)).where(eq(agentRuns.id, id)));
      case 'approval':
        return one(this.db.select({ c: employees.companyId }).from(approvals).innerJoin(employees, eq(employees.id, approvals.employeeId)).where(eq(approvals.id, id)));
      case 'evaluation':
        return one(this.db.select({ c: workItems.companyId }).from(evaluations).innerJoin(workItems, eq(workItems.id, evaluations.workItemId)).where(eq(evaluations.id, id)));
    }
  }

  /* ---------- people management (owners) ---------- */

  async members(companyId: string) {
    return this.db
      .select({ userId: users.id, email: users.email, name: users.name, role: memberships.role, since: memberships.createdAt })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.companyId, companyId));
  }

  /** Adds someone to a company; creates their account if they don't have one yet. */
  async addMember(companyId: string, input: { email: string; name: string; password?: string; role: Role }) {
    const email = input.email.trim().toLowerCase();
    let [u] = await this.db.select().from(users).where(eq(users.email, email));
    if (!u || !u.passwordHash) {
      if (!input.password) throw new BadRequestException('Set a password for this new person (at least 10 characters).');
      const created = await this.createUser({ email, name: input.name, password: input.password });
      [u] = await this.db.select().from(users).where(eq(users.id, created.id));
    }
    await this.grant(companyId, u.id, input.role);
    return { userId: u.id, email: u.email, name: u.name, role: input.role };
  }

  async changeRole(companyId: string, userId: string, role: Role) {
    if ((await this.roleIn(userId, companyId)) === null) throw new NotFoundException('That person is not in this company.');
    if (role !== 'owner') await this.keepAnOwner(companyId, userId);
    await this.grant(companyId, userId, role);
    return { userId, role };
  }

  async removeMember(companyId: string, userId: string) {
    await this.keepAnOwner(companyId, userId);
    await this.db.delete(memberships).where(and(eq(memberships.companyId, companyId), eq(memberships.userId, userId)));
    return { removed: true };
  }

  private async keepAnOwner(companyId: string, leavingUserId: string) {
    const owners = (await this.members(companyId)).filter((m) => m.role === 'owner');
    if (owners.length === 1 && owners[0].userId === leavingUserId) {
      throw new BadRequestException('A company needs at least one owner. Make someone else owner first.');
    }
  }

  private async createUser(input: { email: string; name: string; password: string }): Promise<SessionUser> {
    if (input.password.length < 10) throw new BadRequestException('Use a password of at least 10 characters.');
    const email = input.email.trim().toLowerCase();
    const [exists] = await this.db.select({ id: users.id, passwordHash: users.passwordHash }).from(users).where(eq(users.email, email));
    if (exists?.passwordHash) throw new ConflictException('Someone with that email already has an account.');
    if (exists) {
      // A known person without a sign-in (e.g. recorded as a goal's creator) gets one.
      const [u] = await this.db
        .update(users)
        .set({ name: input.name.trim(), passwordHash: await AuthService.hashPassword(input.password) })
        .where(eq(users.id, exists.id))
        .returning();
      this.userCount = null;
      return { id: u.id, email: u.email, name: u.name };
    }
    const [u] = await this.db
      .insert(users)
      .values({ email, name: input.name.trim(), passwordHash: await AuthService.hashPassword(input.password) })
      .returning();
    this.userCount = null;
    return { id: u.id, email: u.email, name: u.name };
  }
}
