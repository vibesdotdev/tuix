/**
 * Delivery type gate for Bun-first monorepo.
 * 1) Import-load critical modules (runtime correctness under Bun)
 * 2) bun build entrypoints (transpile + dependency graph)
 *
 * Full monorepo/package tsc may stack-overflow (Effect Context.Tag cycles);
 * capture with `bun run typecheck:root` when diagnosing.
 */
import { $ } from 'bun'
import { mkdirSync } from 'fs'
import { join } from 'path'

const scratch = join(import.meta.dir, '../.tuix-typecheck-out')
mkdirSync(scratch, { recursive: true })

const modules = [
  '../packages/core/src/services/capabilities/index.ts',
  '../packages/core/src/services/capabilities/da.ts',
  '../packages/core/src/services/graphics/index.ts',
  '../packages/core/src/services/input/paste.ts',
  '../packages/core/src/services/live/terminal.ts',
  '../packages/platform/src/index.ts',
  '../packages/process-manager/src/pty/pty.ts',
  '../packages/process-manager/src/manager.ts',
  '../packages/jsx/src/compiler/jsx-to-component.ts',
  '../packages/jsx/src/compiler/runApp.ts',
  '../packages/jsx/src/jsx-runtime.ts',
  '../packages/reactive/src/runes/runes.ts',
  '../packages/runtime/src/mvu/runtime/core.ts',
  '../packages/runtime/src/hooks/types.ts',
  '../packages/view/src/primitives/view.ts',
  // bin entry executes runApp at import — load app surface only
  '../packages/bin/src/app.tsx',
  '../packages/ansi/src/render/index.ts',
]

let failed = 0
for (const m of modules) {
  try {
    await import(m)
    console.log('load ok', m.replace('../packages/', ''))
  } catch (e) {
    failed++
    console.error('load FAIL', m, e)
  }
}

const builds = [
  'packages/core/src/services/graphics/index.ts',
  'packages/core/src/services/capabilities/index.ts',
  'packages/core/src/services/capabilities/da.ts',
  'packages/jsx/src/compiler/jsx-to-component.ts',
  'packages/jsx/src/compiler/runApp.ts',
  'packages/jsx/src/jsx-runtime.ts',
  'packages/platform/src/index.ts',
  'packages/process-manager/src/pty/pty.ts',
  'packages/reactive/src/runes/runes.ts',
  'packages/runtime/src/mvu/runtime/core.ts',
  'packages/ansi/src/render/index.ts',
]

for (const entry of builds) {
  const outdir = join(scratch, entry.replace(/[\/.]/g, '_'))
  mkdirSync(outdir, { recursive: true })
  const r = await $`bun build ${entry} --target=bun --outdir=${outdir}`.nothrow().quiet()
  if (r.exitCode !== 0) {
    failed++
    console.error('build FAIL', entry, r.stderr.toString().slice(0, 400))
  } else {
    console.log('build ok', entry)
  }
}

if (failed > 0) {
  console.error(`typecheck-v1: ${failed} failed`)
  process.exit(1)
}
console.log('typecheck-v1: load+build delivery entries ok')
