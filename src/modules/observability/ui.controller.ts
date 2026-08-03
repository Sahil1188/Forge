import { Controller, Get, Header } from '@nestjs/common';

const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Forge — AI Workforce</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; background: #0b0e14; color: #e6e6e6; }
  header { padding: 16px 24px; border-bottom: 1px solid #1e2430; display: flex; gap: 12px; align-items: center; }
  header h1 { font-size: 18px; margin: 0; }
  main { padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card { background: #121722; border: 1px solid #1e2430; border-radius: 10px; padding: 16px; }
  .card h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .05em; color: #8aa0b6; margin: 0 0 12px; }
  input, button { background: #0b0e14; color: #e6e6e6; border: 1px solid #2a3346; border-radius: 8px; padding: 8px 10px; font-size: 13px; }
  button { cursor: pointer; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #1a2130; }
  .badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; }
  .idle { background:#1c2b1c; color:#8fd18f; } .working { background:#2b271c; color:#e0c07a; }
  .error { background:#2b1c1c; color:#e08a8a; } .row { cursor: pointer; }
  .muted { color: #6b7c90; } code { color:#9ecbff; }
</style>
</head>
<body>
<header><h1>🔨 Forge</h1><span class="muted">Autonomous AI Workforce</span></header>
<div style="padding:16px 24px; display:flex; gap:8px; align-items:center;">
  <input id="companyId" placeholder="company id" style="width:340px" />
  <button onclick="loadOverview()">Load company</button>
</div>
<main>
  <section class="card">
    <h2>Employees</h2>
    <table><thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Model</th><th>Last run</th></tr></thead>
    <tbody id="employees"><tr><td colspan="5" class="muted">Enter a company id and load.</td></tr></tbody></table>
  </section>
  <section class="card">
    <h2>Employee profile</h2>
    <div id="profile" class="muted">Click an employee to see reputation, specialization and skills.</div>
  </section>
</main>
<script>
  const api = (p) => fetch(p).then(r => r.ok ? r.json() : Promise.reject(r.status));
  function badge(s){ const c = s==='idle'?'idle':(s==='working'?'working':(s==='error'?'error':'')); return '<span class="badge '+c+'">'+s+'</span>'; }
  async function loadOverview(){
    const id = document.getElementById('companyId').value.trim();
    if(!id) return;
    try {
      const data = await api('/companies/'+id+'/overview');
      document.getElementById('employees').innerHTML = data.employees.map(e =>
        '<tr class="row" onclick="loadProfile(\\''+e.id+'\\')"><td>'+e.name+'</td><td>'+e.role+'</td><td>'+badge(e.status)+
        '</td><td><code>'+(e.defaultModel||'—')+'</code></td><td class="muted">'+
        (e.latestRun ? (e.latestRun.status+' · $'+(e.latestRun.estimatedCostUsd||0).toFixed(4)) : '—')+'</td></tr>'
      ).join('') || '<tr><td colspan="5" class="muted">No employees.</td></tr>';
    } catch(err){ document.getElementById('employees').innerHTML = '<tr><td colspan="5" class="error">Error: '+err+'</td></tr>'; }
  }
  async function loadProfile(id){
    try {
      const p = await api('/employees/'+id+'/profile');
      const skills = (p.employee.skills||[]).map(s => s.skillKey+' '+s.level).join(' · ') || '—';
      const specs = (p.specializations||[]).map(s => s.taskType+' ('+s.reputation+')').join(', ') || '—';
      document.getElementById('profile').innerHTML =
        '<div style="font-size:16px;font-weight:600">'+p.employee.name+' — '+p.employee.role+'</div>'+
        '<p>Reputation: <b>'+(p.reputation.overall ?? 'n/a')+'</b> <span class="muted">('+p.reputation.samples+' samples)</span></p>'+
        '<p>Specialization: '+specs+'</p>'+
        '<p>Skills: <span class="muted">'+skills+'</span></p>'+
        '<p>Recent work: '+(p.recentPerformance||[]).length+' evaluated item(s)</p>';
    } catch(err){ document.getElementById('profile').innerHTML = '<span class="error">Error: '+err+'</span>'; }
  }
</script>
</body>
</html>`;

@Controller()
export class UiController {
  @Get('ui')
  @Header('Content-Type', 'text/html; charset=utf-8')
  dashboard(): string {
    return DASHBOARD_HTML;
  }
}
