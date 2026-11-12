import { describe, it, expect } from 'vitest';
import { desktopAppLaunch } from './execution.worker';

describe('desktop app guard (agents run unattended)', () => {
  it('blocks commands that would open desktop apps on the operator’s screen', () => {
    for (const command of [
      '"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to png budget.xlsx',
      'libreoffice --calc budget.xlsx',
      'start budget.xlsx',
      'cd out && start "" report.pdf',
      'explorer.exe .',
      'python -c "import os; os.startfile(\'budget.xlsx\')"',
      'Invoke-Item report.docx',
      'xdg-open report.pdf',
    ]) {
      expect(desktopAppLaunch('Bash', { command }), command).not.toBeNull();
    }
  });

  it('allows ordinary work', () => {
    for (const command of [
      'npm test',
      'python generate_budget.py',
      'node -e "require(\'./loan.js\')"',
      'git status',
      'python -m pip install openpyxl',
      'npm run start:dev',
    ]) {
      expect(desktopAppLaunch('Bash', { command }), command).toBeNull();
    }
    expect(desktopAppLaunch('Write', { file_path: 'start.txt' })).toBeNull();
  });
});
