/**
 * Bootstrap - Application initialization with module registration
 *
 * Runtime owns only runtime-layer defaults. Higher-level modules should be
 * injected via `additionalModules` to avoid layer inversion.
 */

import { Effect } from 'effect'
import {
  getGlobalEventBus,
  type EventBus,
  type ModuleBase,
  type ModuleRegistry,
  getGlobalRegistry,
} from '@tuix/core'
import { ReactivityModule } from '@tuix/reactive'
import { ServiceModule } from '@tuix/core/services'

/**
 * Factory for optional modules registered during bootstrap.
 */
export type BootstrapModuleFactory = (eventBus: EventBus) => ModuleBase

/**
 * Bootstrap configuration
 */
export interface BootstrapConfig {
  readonly enableServices?: boolean
  readonly configPath?: string
  readonly forceError?: boolean

  /**
   * Additional modules to register. Use this for config/logger/process-manager,
   * CLI presets, and other app-level integrations.
   */
  readonly additionalModules?: ReadonlyArray<BootstrapModuleFactory>
}

function canLoadConfig(module: ModuleBase | undefined): module is ModuleBase & {
  loadConfig: (path: string) => Effect.Effect<unknown, unknown>
} {
  return typeof (module as { loadConfig?: unknown } | undefined)?.loadConfig === 'function'
}

/**
 * Bootstrap the application with runtime defaults plus optional injected modules.
 */
export function bootstrap(config: BootstrapConfig = {}): Effect.Effect<ModuleRegistry, Error> {
  return Effect.gen(function* () {
    if (config.forceError) {
      yield* Effect.fail(new Error('Forced bootstrap error for testing'))
    }

    const eventBus = getGlobalEventBus()
    const registry = getGlobalRegistry()

    // Runtime-layer defaults
    const reactivityModule = new ReactivityModule(eventBus)
    yield* registry.register(reactivityModule)

    if (config.enableServices !== false) {
      const serviceModule = new ServiceModule(eventBus)
      yield* registry.register(serviceModule)
    }

    // App/ecosystem modules are injected by higher layers.
    for (const createModule of config.additionalModules ?? []) {
      yield* registry.register(createModule(eventBus))
    }

    yield* registry.initialize()

    // Optional config loading when a compatible module is provided.
    if (config.configPath) {
      const configModule = registry.getModule<ModuleBase>('config')
      if (canLoadConfig(configModule)) {
        yield* configModule.loadConfig(config.configPath)
      }
    }

    return registry
  })
}

/**
 * Create a minimal bootstrap for testing.
 */
export function bootstrapMinimal(): Effect.Effect<ModuleRegistry, Error> {
  return bootstrap({ enableServices: false })
}

/**
 * Create a full bootstrap of runtime-owned modules.
 * Additional application modules should be provided through `additionalModules`.
 */
export function bootstrapFull(): Effect.Effect<ModuleRegistry, Error> {
  return bootstrap({ enableServices: true })
}

/**
 * Bootstrap result with typed module access
 */
export interface BootstrapResult {
  readonly registry: ModuleRegistry
  readonly status: 'initialized' | 'partial' | 'failed'
  readonly modules: {
    readonly reactivity?: ReactivityModule
    readonly services?: ServiceModule

    // Compatibility aliases for older integrations/tests.
    readonly jsx?: ModuleBase
    readonly cli?: ModuleBase
    readonly config?: ModuleBase
    readonly processManager?: ModuleBase
    readonly logger?: ModuleBase
    readonly coordination?: ModuleBase
  }
}

/**
 * Bootstrap with typed module access.
 */
export function bootstrapWithModules(
  config: BootstrapConfig = {}
): Effect.Effect<BootstrapResult, Error> {
  return Effect.gen(function* () {
    const registryResult = yield* bootstrap(config).pipe(Effect.either)

    if (registryResult._tag === 'Left') {
      return {
        registry: getGlobalRegistry(),
        status: 'failed' as const,
        modules: {
          reactivity: undefined,
          services: undefined,
          jsx: undefined,
          cli: undefined,
          config: undefined,
          processManager: undefined,
          logger: undefined,
          coordination: undefined,
        },
      }
    }

    const registry = registryResult.right
    const status = registry.hasModule('reactivity') ? 'initialized' : 'partial'

    return {
      registry,
      status,
      modules: {
        reactivity: registry.getModule<ReactivityModule>('reactivity'),
        services: registry.getModule<ServiceModule>('services'),
        jsx: registry.getModule<ModuleBase>('jsx'),
        cli: registry.getModule<ModuleBase>('cli'),
        config: registry.getModule<ModuleBase>('config'),
        processManager: registry.getModule<ModuleBase>('process-manager'),
        logger: registry.getModule<ModuleBase>('logger'),
        coordination: registry.getModule<ModuleBase>('coordination'),
      },
    }
  })
}
