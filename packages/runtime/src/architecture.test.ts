import { describe, expect, test } from 'bun:test'
import runtimePackageJson from '../package.json'

const FORBIDDEN_RUNTIME_DEPS = [
  '@tuix/bin',
  '@tuix/config',
  '@tuix/logger',
  '@tuix/process-manager',
  '@tuix/coordination',
  '@tuix/update',
  '@tuix/telemetry',
  '@tuix/debug',
]

describe('@tuix/runtime architecture boundaries', () => {
  test('does not depend on app/plugin layer packages', () => {
    const deps = new Set(Object.keys(runtimePackageJson.dependencies ?? {}))

    for (const forbidden of FORBIDDEN_RUNTIME_DEPS) {
      expect(deps.has(forbidden)).toBe(false)
    }
  })
})
