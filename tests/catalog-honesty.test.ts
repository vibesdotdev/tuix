/**
 * Catalog completeness: every package is Complete; former stubs must work.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Effect } from 'effect'

const root = join(import.meta.dir, '..')
const catalog = readFileSync(join(root, 'spec/20-catalog/MODULE_CATALOG.md'), 'utf8')

function statusOf(packageName: string): string {
  const re = new RegExp(
    `\\|\\s*MOD-[^|]+\\|\\s*${packageName}\\s*\\|[^|]+\\|\\s*(Complete|Partial|Shell)\\s*\\|`,
    'i'
  )
  const m = catalog.match(re)
  return m?.[1] ?? 'missing'
}

describe('MODULE_CATALOG all Complete', () => {
  const packages = [
    'ansi',
    'app-presets',
    'bin',
    'config',
    'coordination',
    'core',
    'debug',
    'docs',
    'input',
    'jsx',
    'logger',
    'platform',
    'process-manager',
    'reactive',
    'runtime',
    'storage',
    'telemetry',
    'testing',
    'themes',
    'ui',
    'update',
    'view',
  ]

  test('every package is Complete', () => {
    for (const pkg of packages) {
      expect(statusOf(pkg)).toBe('Complete')
    }
  })

  test('useStorage works (no throw)', async () => {
    const { useStorage, __resetStoragePluginForTests } = await import(
      '../packages/storage/src/plugin/index.tsx'
    )
    __resetStoragePluginForTests()
    const s = useStorage()
    await s.set('v1', 42)
    expect(await s.get('v1')).toBe(42)
  })

  test('YAML and TOML parse/serialize work', async () => {
    const { parseYAML, serializeYAML, parseTOML, serializeTOML } = await import(
      '../packages/config/src/storage/formats.ts'
    )
    const y = await Effect.runPromise(serializeYAML({ a: 1, b: { c: true } }))
    const yp = await Effect.runPromise(parseYAML(y))
    expect(yp.a).toBe(1)
    const t = await Effect.runPromise(serializeTOML({ title: 'x', nest: { n: 2 } }))
    const tp = await Effect.runPromise(parseTOML(t))
    expect(tp.title).toBe('x')
    expect((tp.nest as { n: number }).n).toBe(2)
  })

  test('testing exports e2e harness surface', async () => {
    const testing = await import('../packages/testing/src/index.ts')
    // e2eHarness exports Test harness types/impl
    expect(
      'createTestHarness' in testing ||
        'TestHarness' in testing ||
        Object.keys(testing).some(k => /harness|e2e|TestSession/i.test(k))
    ).toBe(true)
  })
})
