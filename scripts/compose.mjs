// Cross-platform launcher for the docker-* scripts. Runs identically on
// Windows (cmd/PowerShell), macOS, and Linux — unlike a POSIX `${VAR:-default}`
// in package.json, which breaks under cmd.exe.
//
// Default runner is `docker compose`. Override for podman/others:
//   COMPOSE_CMD=podman-compose pnpm docker-db
import { spawnSync } from 'node:child_process'

const runner = (process.env.COMPOSE_CMD || 'docker compose').trim()
const [bin, ...runnerArgs] = runner.split(/\s+/)
const args = [...runnerArgs, ...process.argv.slice(2)]

const result = spawnSync(bin, args, {
  stdio: 'inherit',
  // On Windows, resolving `docker`/`podman-compose` via PATHEXT needs a shell.
  shell: process.platform === 'win32',
})

if (result.error) {
  console.error(`Failed to run "${runner}": ${result.error.message}`)
  process.exit(1)
}
process.exit(result.status ?? 1)
