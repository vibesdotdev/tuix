/**
 * Package-level typecheck for delivery packages.
 * Prefer this over monorepo root tsc when the full project stack-overflows.
 */
import { $ } from 'bun'

const packages = ['core', 'jsx', 'reactive', 'runtime', 'platform', 'process-manager', 'view']

let failed = 0
for (const name of packages) {
  const cwd = `packages/${name}`
  const pkg = await Bun.file(`${cwd}/package.json`)
    .json()
    .catch(() => null)
  if (!pkg?.scripts?.typecheck) {
    // Fall back to tsc if present
    const r = await $`cd ${cwd} && bunx tsc --noEmit --pretty false`.nothrow().quiet()
    if (r.exitCode !== 0) {
      console.error(`FAIL ${name}`, r.stderr.toString().slice(0, 500))
      failed++
    } else {
      console.log(`ok ${name}`)
    }
    continue
  }
  const r = await $`cd ${cwd} && bun run typecheck`.nothrow().quiet()
  if (r.exitCode !== 0) {
    console.error(`FAIL ${name}`)
    console.error(r.stderr.toString().slice(-800) || r.stdout.toString().slice(-800))
    failed++
  } else {
    console.log(`ok ${name}`)
  }
}

if (failed > 0) {
  console.error(`typecheck-packages: ${failed} failed`)
  process.exit(1)
}
console.log('typecheck-packages: all delivery packages ok')
