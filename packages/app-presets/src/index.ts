import type { ModuleBase } from '@tuix/core'
import type { EventBus } from '@tuix/core/events'
import { ConfigModule } from '@tuix/config'
import { LoggerModule } from '@tuix/logger'
import { ProcessManagerModule } from '@tuix/process-manager'
import { CoordinationModule } from '@tuix/coordination'

export type ModuleFactory = (eventBus: EventBus) => ModuleBase

export interface StandardPresetOptions {
  readonly config?: boolean
  readonly logger?: boolean
  readonly processManager?: boolean
  readonly coordination?: boolean
}

/**
 * Runtime-safe injection helpers for app/plugin modules.
 * Use with @tuix/runtime bootstrap `additionalModules`.
 */
export const presets = {
  config: (): ModuleFactory => eventBus => new ConfigModule(eventBus),
  logger: (): ModuleFactory => eventBus => new LoggerModule(eventBus),
  processManager: (): ModuleFactory => eventBus => new ProcessManagerModule(eventBus),
  coordination: (): ModuleFactory => eventBus => new CoordinationModule(eventBus),

  standard: (options: StandardPresetOptions = {}): ReadonlyArray<ModuleFactory> => {
    const { config = true, logger = true, processManager = false, coordination = false } = options

    const factories: ModuleFactory[] = []
    if (config) factories.push(presets.config())
    if (logger) factories.push(presets.logger())
    if (processManager) factories.push(presets.processManager())
    if (coordination) factories.push(presets.coordination())
    return factories
  },
}
