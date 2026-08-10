import { describe, expect, test } from 'bun:test'

type Violation = {
  file: string
  importPath: string
}

const SOURCE_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx']

function normalizeWorkspaceImport(specifier: string): string | null {
  if (!specifier.startsWith('@tuix/')) return null
  const parts = specifier.split('/')
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null
}

function extractWorkspaceImports(source: string): string[] {
  const imports = new Set<string>()

  const staticImportRegex = /(?:from\s+|import\s+)(['"])(@tuix\/[^'"]+)\1/g
  const dynamicImportRegex = /import\(\s*(['"])(@tuix\/[^'"]+)\1\s*\)/g

  for (const match of source.matchAll(staticImportRegex)) {
    const normalized = normalizeWorkspaceImport(match[2])
    if (normalized) imports.add(normalized)
  }

  for (const match of source.matchAll(dynamicImportRegex)) {
    const normalized = normalizeWorkspaceImport(match[2])
    if (normalized) imports.add(normalized)
  }

  return [...imports]
}

async function collectViolations(
  pkg: string,
  forbidden: ReadonlyArray<string>
): Promise<Violation[]> {
  const violations: Violation[] = []

  for (const ext of SOURCE_EXTENSIONS) {
    const glob = new Bun.Glob(`packages/${pkg}/src/**/*.${ext}`)

    for await (const file of glob.scan('.')) {
      if (file.includes('.test.')) continue

      const text = await Bun.file(file).text()
      const imports = extractWorkspaceImports(text)

      for (const imported of imports) {
        if (forbidden.includes(imported)) {
          violations.push({ file, importPath: imported })
        }
      }
    }
  }

  return violations
}

describe('source import boundaries', () => {
  test('@tuix/view source stays foundation-only (no reactive/authoring/ecosystem)', async () => {
    const forbidden = [
      '@tuix/runtime',
      '@tuix/reactive',
      '@tuix/jsx',
      '@tuix/ui',
      '@tuix/themes',
      '@tuix/app-presets',
      '@tuix/bin',
      '@tuix/config',
      '@tuix/logger',
      '@tuix/process-manager',
      '@tuix/coordination',
      '@tuix/update',
      '@tuix/telemetry',
      '@tuix/debug',
      '@tuix/docs',
      '@tuix/testing',
    ]

    const violations = await collectViolations('view', forbidden)
    expect(violations).toEqual([])
  })

  test('@tuix/runtime source does not import app/plugin-layer packages', async () => {
    const forbidden = [
      '@tuix/app-presets',
      '@tuix/bin',
      '@tuix/config',
      '@tuix/logger',
      '@tuix/process-manager',
      '@tuix/coordination',
      '@tuix/update',
      '@tuix/telemetry',
      '@tuix/debug',
      '@tuix/docs',
      '@tuix/jsx',
      '@tuix/ui',
      '@tuix/themes',
    ]

    const violations = await collectViolations('runtime', forbidden)
    expect(violations).toEqual([])
  })

  test('@tuix/reactive source does not import authoring/ecosystem layers', async () => {
    const forbidden = [
      '@tuix/jsx',
      '@tuix/ui',
      '@tuix/themes',
      '@tuix/app-presets',
      '@tuix/bin',
      '@tuix/config',
      '@tuix/logger',
      '@tuix/process-manager',
      '@tuix/coordination',
      '@tuix/update',
      '@tuix/telemetry',
      '@tuix/debug',
      '@tuix/docs',
      '@tuix/testing',
    ]

    const violations = await collectViolations('reactive', forbidden)
    expect(violations).toEqual([])
  })

  test('@tuix/jsx source does not import ecosystem packages directly', async () => {
    const forbidden = [
      '@tuix/app-presets',
      '@tuix/bin',
      '@tuix/config',
      '@tuix/logger',
      '@tuix/process-manager',
      '@tuix/coordination',
      '@tuix/update',
      '@tuix/telemetry',
      '@tuix/debug',
      '@tuix/docs',
      '@tuix/testing',
    ]

    const violations = await collectViolations('jsx', forbidden)
    expect(violations).toEqual([])
  })

  test('@tuix/core source does not import runtime/authoring/ecosystem layers', async () => {
    const forbidden = [
      '@tuix/runtime',
      '@tuix/jsx',
      '@tuix/ui',
      '@tuix/themes',
      '@tuix/app-presets',
      '@tuix/bin',
      '@tuix/config',
      '@tuix/logger',
      '@tuix/process-manager',
      '@tuix/coordination',
      '@tuix/update',
      '@tuix/telemetry',
      '@tuix/debug',
      '@tuix/docs',
    ]

    const violations = await collectViolations('core', forbidden)
    expect(violations).toEqual([])
  })
})
