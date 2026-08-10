import { describe, expect, test } from 'bun:test'

type PackageJson = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

async function getDependencies(pkg: string): Promise<Set<string>> {
  const json = (await Bun.file(`packages/${pkg}/package.json`).json()) as PackageJson
  return new Set(Object.keys(json.dependencies ?? {}))
}

describe('dependency boundaries', () => {
  test('core does not depend on runtime/authoring/ecosystem layers', async () => {
    const deps = await getDependencies('core')
    const forbidden = [
      '@tuix/runtime',
      '@tuix/jsx',
      '@tuix/ui',
      '@tuix/themes',
      '@tuix/bin',
      '@tuix/config',
      '@tuix/logger',
      '@tuix/process-manager',
      '@tuix/coordination',
      '@tuix/update',
      '@tuix/telemetry',
      '@tuix/debug',
      '@tuix/docs',
      '@tuix/app-presets',
    ]

    for (const name of forbidden) {
      expect(deps.has(name)).toBe(false)
    }
  })

  test('view does not depend on runtime/reactive/authoring/ecosystem layers', async () => {
    const deps = await getDependencies('view')
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

    for (const name of forbidden) {
      expect(deps.has(name)).toBe(false)
    }
  })

  test('runtime does not depend on app/plugin packages directly', async () => {
    const deps = await getDependencies('runtime')
    const forbidden = [
      '@tuix/bin',
      '@tuix/config',
      '@tuix/logger',
      '@tuix/process-manager',
      '@tuix/coordination',
      '@tuix/update',
      '@tuix/telemetry',
      '@tuix/debug',
      '@tuix/app-presets',
    ]

    for (const name of forbidden) {
      expect(deps.has(name)).toBe(false)
    }
  })

  test('reactive does not depend on authoring/ecosystem packages', async () => {
    const deps = await getDependencies('reactive')
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

    for (const name of forbidden) {
      expect(deps.has(name)).toBe(false)
    }
  })

  test('jsx does not depend on ecosystem packages directly', async () => {
    const deps = await getDependencies('jsx')
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

    for (const name of forbidden) {
      expect(deps.has(name)).toBe(false)
    }
  })
})
