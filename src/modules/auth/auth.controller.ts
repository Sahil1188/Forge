import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req, Res } from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService, SESSION_COOKIE } from './auth.service';
import { ForgeRequest, readCookie } from './access.guard';
import { Role, ROLES } from './auth.schema';

class SetupDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  password!: string;
}

class LoginDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsString()
  @MaxLength(200)
  password!: string;
}

class AddMemberDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  password?: string;

  @IsIn(ROLES)
  role!: Role;
}

class RoleDto {
  @IsIn(ROLES)
  role!: Role;
}

interface CookieResponse {
  setHeader(name: string, value: string): void;
}

function sessionCookie(token: string, maxAgeSeconds: number): string {
  const secure = process.env.FORGE_SECURE_COOKIES === '1' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}${secure}`;
}

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Whether accounts are on, who is signed in, and their companies. */
  @Get('auth/status')
  async status(@Req() req: ForgeRequest) {
    const accounts = await this.auth.accountsEnabled();
    const user = accounts ? await this.auth.userForToken(readCookie(req, SESSION_COOKIE)) : null;
    return { accounts, user, companies: user ? await this.auth.companiesOf(user.id) : [] };
  }

  /** Turns accounts on: the first person becomes owner of every company and is signed in. */
  @Post('auth/setup')
  async setup(@Body() dto: SetupDto, @Res({ passthrough: true }) res: CookieResponse) {
    await this.auth.setup(dto);
    const s = await this.auth.login(dto.email, dto.password);
    res.setHeader('Set-Cookie', sessionCookie(s.token, Math.floor((s.expiresAt.getTime() - Date.now()) / 1000)));
    return { user: s.user };
  }

  @Post('auth/login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: CookieResponse) {
    const s = await this.auth.login(dto.email, dto.password);
    res.setHeader('Set-Cookie', sessionCookie(s.token, Math.floor((s.expiresAt.getTime() - Date.now()) / 1000)));
    return { user: s.user };
  }

  @Post('auth/logout')
  @HttpCode(200)
  async logout(@Req() req: ForgeRequest, @Res({ passthrough: true }) res: CookieResponse) {
    await this.auth.logout(readCookie(req, SESSION_COOKIE));
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    return { signedOut: true };
  }

  /* ---------- people and access (owners; enforced by the guard) ---------- */

  @Get('companies/:id/members')
  members(@Param('id', ParseUUIDPipe) id: string) {
    return this.auth.members(id);
  }

  @Post('companies/:id/members')
  addMember(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddMemberDto) {
    return this.auth.addMember(id, dto);
  }

  @Patch('companies/:id/members/:userId')
  changeRole(@Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string, @Body() dto: RoleDto) {
    return this.auth.changeRole(id, userId, dto.role);
  }

  @Delete('companies/:id/members/:userId')
  removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.auth.removeMember(id, userId);
  }
}
