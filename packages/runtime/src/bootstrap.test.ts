import { beforeEach, describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import {
  ModuleBase,
  ModuleError,
  getGlobalEventBus,
  resetGlobalEventBus,
  resetGlobalRegistry,
  type EventBus,
} from '@tuix/core'
import { bootstrap, bootstrapWithModules } from './bootstrap'

class TestModule extends ModuleBase {
  constructor(eventBus: EventBus, name = 'test-module') {
    super(eventBus, name)
  }

  initialize(): Effect.Effect<void, ModuleError> {
    return this.setReady()
  }
}

class TestConfigModule extends TestModule {
  public loadedPath: string | null = null

  constructor(eventBus: EventBus) {
    super(eventBus, 'config')
  }

  loadConfig(path: string): Effect.Effect<void> {
    return Effect.sync(() => {
      this.loadedPath = path
    })
  }
}

describe('runtime bootstrap', () => {
  beforeEach(async () => {
    await Effect.runPromise(resetGlobalRegistry())
    await Effect.runPromise(resetGlobalEventBus())
  })

  test('registers additional modules without runtime-level direct imports', async () => {
    const registry = await Effect.runPromise(
      bootstrap({
        additionalModules: [eventBus => new TestModule(eventBus)],
      })
    )

    expect(registry.hasModule('reactivity')).toBe(true)
    expect(registry.hasModule('services')).toBe(true)
    expect(registry.hasModule('test-module')).toBe(true)
  })

  test('loads config when injected module exposes loadConfig', async () => {
    const configModule = new TestConfigModule(getGlobalEventBus())

    const result = await Effect.runPromise(
      bootstrapWithModules({
        configPath: '/tmp/tuix.config.json',
        additionalModules: [() => configModule],
      })
    )

    expect(result.status).toBe('initialized')
    expect(configModule.loadedPath).toBe('/tmp/tuix.config.json')
  })
})
