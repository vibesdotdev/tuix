/**
 * Residual polish closed: guides, schema single-source, exports.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const root = join(import.meta.dir, '..')

describe('docs/guides', () => {
  test('contains install, quickstart, architecture guides with content', () => {
    const dir = join(root, 'docs/guides')
    expect(existsSync(dir)).toBe(true)
    const files = readdirSync(dir).filter(f => f.endsWith('.md'))
    expect(files).toContain('install.md')
    expect(files).toContain('quickstart.md')
    expect(files).toContain('architecture.md')
    for (const f of ['install.md', 'quickstart.md', 'architecture.md']) {
      const body = readFileSync(join(dir, f), 'utf8')
      expect(body.trim().length).toBeGreaterThan(100)
    }
  })
})

describe('TerminalCapabilities schema single source', () => {
  test('common.ts re-exports from schemas; no duplicate z.object definition', () => {
    const common = readFileSync(join(root, 'packages/core/src/types/common.ts'), 'utf8')
    const schemas = readFileSync(join(root, 'packages/core/src/types/schemas.ts'), 'utf8')
    expect(schemas).toMatch(/export const TerminalCapabilitiesSchema = z\.object/)
    // common must re-export, not redefine z.object for TerminalCapabilities
    expect(common).toMatch(/TerminalCapabilitiesSchema/)
    expect(common).toMatch(/from ['\"]\.\/schemas['\"]/)
    const dup =
      common.includes('export const TerminalCapabilitiesSchema = z.object') ||
      common.includes('TerminalCapabilitiesSchema = z.object({')
    expect(dup).toBe(false)
  })

  test('detect + live terminal import type from schemas path', () => {
    const detect = readFileSync(
      join(root, 'packages/core/src/services/capabilities/detect.ts'),
      'utf8'
    )
    const live = readFileSync(join(root, 'packages/core/src/services/live/terminal.ts'), 'utf8')
    expect(detect).toMatch(/types\/schemas/)
    expect(live).toMatch(/types\/schemas/)
  })
})
