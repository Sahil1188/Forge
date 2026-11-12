# Security policy

## Reporting a vulnerability

Please report security issues **privately**, not in public issues or pull requests.

- Use GitHub's **"Report a vulnerability"** button on this repository's Security tab (private
  vulnerability reporting), or
- email the maintainer at the address on their GitHub profile.

Include what you found, how to reproduce it, the version or commit, and the impact you expect. You will
get an acknowledgement within 7 days. Fixes for confirmed issues are released as soon as they are
ready, and you will be credited unless you ask not to be.

## Supported versions

Forge is pre-1.0. Only the latest release on `main` receives security fixes.

## Threat model

Forge runs AI agents that write and execute code **on the machine it runs on**. Anyone who can call
its API can cause code to run there. The design assumes a single trusted operator, or a small team of
trusted people with accounts, on a machine they control.

### What Forge defends against

| Threat | Defence |
| --- | --- |
| Another device on the network calling the API | Listens on `127.0.0.1` only; refuses to start on any other address without `FORGE_API_TOKEN` (24+ characters). |
| A malicious web page driving the local API | Host allowlist (DNS rebinding), same-origin JSON-only writes (CSRF), no CORS, security headers. |
| A signed-in user exceeding their role | Accounts with per-company roles (viewer, member, admin, owner), checked on every request. |
| An agent reading Forge's own secrets | Agents and their commands get an allowlisted environment: no `DATABASE_URL`, no `FORGE_API_TOKEN`, no fallback key, no API keys. |
| An agent writing outside its workspace | File tools are confined to the run's workspace, with symlinks resolved. |
| An agent using a dangerous tool | Per-employee allow, deny and approval rules; approvals are single use and bound to the exact call. |
| Secrets leaking into stored logs | Secret-shaped text is redacted from transcripts, logs and check output before storage. |
| Runaway cost or loops | Platform-enforced limits on budget, run time, tool calls and turns. |
| Accidental per-token billing | `ANTHROPIC_API_KEY` is removed from every process Forge starts. |
| Browsing files outside a project | The console serves only files git tracks in a project's `main`. |

### What Forge does not defend against

- **Agents' shell commands on native Windows run as your user.** Claude Code cannot sandbox its shell
  commands on native Windows. An agent can read and change anything your user can. Use Linux, macOS or
  WSL2 with `FORGE_AGENT_SANDBOX=required`, and `FORGE_SANDBOX=docker` for custom-runtime workers.
- **Untrusted operators.** Anyone with an admin account can configure employees, approve tool calls and
  run acceptance commands. Only give accounts to people you would let run code on the machine.
- **Prompt injection through project content.** Agents read code, documents and web pages they are
  given; content can try to steer them. The permission rules, workspace confinement and limits reduce
  the damage, but don't point Forge at content you don't trust on a machine with data you can't lose.
- **Exposure to the internet.** Forge is not designed to face the public internet. If you must reach
  it remotely, put it behind a VPN or an authenticating reverse proxy with TLS, set `FORGE_API_TOKEN`,
  `FORGE_ALLOWED_HOSTS` and `FORGE_SECURE_COOKIES=1`.

## Hardening checklist

- Keep `FORGE_HOST=127.0.0.1` unless you need remote access.
- Create the first account (Settings in the console) so every request needs a session.
- Run on Linux, macOS or WSL2 with `FORGE_AGENT_SANDBOX=required` and `FORGE_SANDBOX=docker`.
- Set budgets per employee.
- Require approval for tools you consider sensitive (for example `Bash`) on employees that don't need
  them unattended.
- Change the PostgreSQL password from the default (`POSTGRES_PASSWORD` and `DATABASE_URL`).
- Never put `ANTHROPIC_API_KEY` in Forge's environment.
