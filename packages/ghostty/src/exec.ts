/** Injectable exec helpers (tests substitute fakes). */
import { execSync as nodeExecSync, spawn as nodeSpawn, type ChildProcess } from 'node:child_process'

export type ExecSyncOverride = (cmd: string) => string

export function execSyncText(cmd: string, opts: { cwd?: string } = {}): string {
  return nodeExecSync(cmd, { encoding: 'utf8', ...opts }) as string
}

export function spawnDetached(
  bin: string,
  args: string[],
  opts: { cwd?: string; outFile?: string } = {}
): ChildProcess {
  return nodeSpawn(bin, args, {
    cwd: opts.cwd,
    stdio: ['ignore', 'ignore', 'ignore'],
    detached: false,
  })
}
