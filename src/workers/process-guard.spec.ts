import { describe, expect, it } from 'vitest';
import { processKillViolation } from './process-guard';

const opts = { protectedPids: [65500, 4242] };
const check = (command: string, tool = 'Bash') => processKillViolation(tool, { command }, opts);

describe('process guard (agents may only stop what they started)', () => {
  it('refuses the command that killed Forge live', () => {
    expect(
      check(
        'powershell -NoProfile -Command "Stop-Process -Id 65500,28492 -Force -ErrorAction SilentlyContinue"',
      ),
    ).toMatch(/Forge itself/);
    expect(check('taskkill /PID 65500 /F')).toMatch(/Forge itself/);
    expect(check('kill -9 4242')).toMatch(/Forge itself/);
  });

  it('refuses killing by name, pattern or query', () => {
    for (const command of [
      'taskkill /F /IM node.exe',
      'Stop-Process -Name node -Force',
      'pkill -f main.js',
      'killall node',
      'npx kill-port 3000',
      'fuser -k 3000/tcp',
      'Get-Process node | Stop-Process -Force',
      'Get-CimInstance Win32_Process -Filter "CommandLine like \'%main.js%\'" | ForEach-Object { $_ } | Stop-Process',
    ]) {
      expect(check(command, 'PowerShell'), command).not.toBeNull();
    }
  });

  it('refuses stopping through a variable, which could hold any PID', () => {
    expect(check('Stop-Process -Id $pid -Force')).not.toBeNull();
    expect(check('kill $SERVER_PID')).not.toBeNull();
  });

  it('allows an agent to stop its own processes', () => {
    for (const command of [
      'kill %1',
      'kill $!',
      'npm run start & sleep 5; curl localhost:4180/api/health; kill $!',
      'Stop-Process -Id 28492 -Force',
      'taskkill /PID 28492 /T /F',
      'kill -9 28492',
    ]) {
      expect(check(command), command).toBeNull();
    }
  });

  it('leaves ordinary commands alone', () => {
    for (const command of [
      'npm test',
      'git status',
      'node server/dist/main.js',
      'echo "skill set"',
      'npm run kill-switch-test',
    ]) {
      expect(check(command), command).toBeNull();
    }
    expect(processKillViolation('Write', { command: 'taskkill /IM node.exe' }, opts)).toBeNull();
  });
});
