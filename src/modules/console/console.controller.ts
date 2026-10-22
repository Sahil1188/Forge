import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Res, StreamableFile } from '@nestjs/common';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ConsoleService } from './console.service';

class StarterTeamDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsIn(['full', 'minimal'])
  template?: 'full' | 'minimal';
}

class ChangeRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  feedback!: string;

  @IsOptional()
  @IsUUID()
  workItemId?: string;
}

/** The slice of the HTTP response the download handler uses (keeps us free of express typings). */
interface DownloadResponse {
  setHeader(name: string, value: string): void;
}

/** Endpoints shaped for the web console (each screen = one request). */
@Controller()
export class ConsoleController {
  constructor(private readonly console: ConsoleService) {}

  @Get('system')
  system() {
    return this.console.system();
  }

  @Get('companies/:id/dashboard')
  dashboard(@Param('id', ParseUUIDPipe) id: string) {
    return this.console.dashboard(id);
  }

  @Get('companies/:id/team')
  team(@Param('id', ParseUUIDPipe) id: string) {
    return this.console.team(id);
  }

  @Get('companies/:id/approvals')
  approvals(@Param('id', ParseUUIDPipe) id: string, @Query('status') status?: string) {
    return this.console.approvals(id, status === 'decided' ? 'decided' : 'pending');
  }

  @Get('companies/:id/runs')
  runs(@Param('id', ParseUUIDPipe) id: string) {
    return this.console.runs(id);
  }

  @Get('companies/:id/projects')
  projects(@Param('id', ParseUUIDPipe) id: string) {
    return this.console.projects(id);
  }

  @Get('employees/:id/runs')
  employeeRuns(@Param('id', ParseUUIDPipe) id: string) {
    return this.console.employeeRuns(id);
  }

  @Post('companies/:id/starter-team')
  starterTeam(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StarterTeamDto) {
    return this.console.starterTeam(id, dto.model, dto.template);
  }

  @Get('goals/:id/board')
  board(@Param('id', ParseUUIDPipe) id: string) {
    return this.console.board(id);
  }

  @Get('agent-runs/:id/transcript')
  transcript(@Param('id', ParseUUIDPipe) id: string) {
    return this.console.transcript(id);
  }

  @Get('projects/:id/files')
  files(@Param('id', ParseUUIDPipe) id: string) {
    return this.console.files(id);
  }

  @Get('projects/:id/file')
  file(@Param('id', ParseUUIDPipe) id: string, @Query('path') filePath: string) {
    return this.console.file(id, String(filePath ?? ''));
  }

  /** Download a deliverable file as an attachment (never rendered inline, so it can't run in the console's origin). */
  @Get('projects/:id/download')
  async download(@Param('id', ParseUUIDPipe) id: string, @Query('path') filePath: string, @Res({ passthrough: true }) res: DownloadResponse) {
    const file = await this.console.download(id, String(filePath ?? ''));
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name.replace(/[^\w.\- ]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader('Content-Length', String(file.size));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(file.body);
  }

  /** Feedback on delivered work → one targeted change on the same project, regression-checked. */
  @Post('goals/:id/changes')
  requestChanges(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeRequestDto) {
    return this.console.requestChanges(id, dto);
  }

  @Post('work-items/:id/retry')
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.console.retry(id);
  }
}
