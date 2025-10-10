/**
 * Context Extension for Config
 *
 * Extends the runtime context to include config API
 */

import { Effect } from 'effect'
import { Config } from '../types'

/**
 * Config context extension
 *
 * Provides easy access to config within components
 */
export interface ConfigContext {
  config: {
    /**
     * Get a config value
     */
    get<T>(key: string, defaultValue?: T): Promise<T>

    /**
     * Get all config values
     */
    getAll(): Promise<Record<string, any>>

    /**
     * Set a config value
     */
    set(key: string, value: any): Promise<void>

    /**
     * Check if a config key exists
     */
    has(key: string): Promise<boolean>
  }
}

/**
 * Create config context from Config service
 */
export function createConfigContext(configService: Config): ConfigContext['config'] {
  return {
    get<T>(key: string, defaultValue?: T): Promise<T> {
      return Effect.runPromise(configService.get(key, defaultValue))
    },

    getAll(): Promise<Record<string, any>> {
      return Effect.runPromise(configService.getAll())
    },

    set(key: string, value: any): Promise<void> {
      return Effect.runPromise(configService.set(key, value))
    },

    has(key: string): Promise<boolean> {
      return Effect.runPromise(configService.has(key))
    },
  }
}

/**
 * Usage in components:
 *
 * ```tsx
 * function MyCommand() {
 *   const port = await context.config.get('server.port', 3000)
 *   await context.config.set('server.host', 'localhost')
 *
 *   return <text>Server running on port {port}</text>
 * }
 * ```
 */
