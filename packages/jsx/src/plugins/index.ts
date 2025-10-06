/**
 * Plugin Store for JSX Runtime
 *
 * Centralized management of declarative plugins and command registrations.
 */

import { Effect, Context } from 'effect'

// Define the plugin registry interface
export interface PluginRegistry {
  /**
   * Register a declarative plugin
   */
  registerDeclarativePlugin: (name: string, plugin: any) => Effect.Effect<void>

  /**
   * Unregister a declarative plugin
   */
  unregisterDeclarativePlugin: (name: string) => Effect.Effect<void>

  /**
   * Get a registered declarative plugin
   */
  getDeclarativePlugin: (name: string) => Effect.Effect<any, Error>

  /**
   * List all registered declarative plugins
   */
  listDeclarativePlugins: () => Effect.Effect<string[]>

  /**
   * Register a command
   */
  registerCommand: (name: string, handler: any) => Effect.Effect<void>

  /**
   * Unregister a command
   */
  unregisterCommand: (name: string) => Effect.Effect<void>

  /**
   * Execute a registered command
   */
  executeCommand: (name: string, args?: any[]) => Effect.Effect<any>
}

// Create the plugin store context
export const PluginStore = Context.Tag<PluginRegistry>('PluginStore')

/**
 * Default implementation of the plugin registry
 */
class DefaultPluginRegistry implements PluginRegistry {
  private plugins: Map<string, any> = new Map()
  private commands: Map<string, any> = new Map()

  registerDeclarativePlugin(name: string, plugin: any): Effect.Effect<void> {
    this.plugins.set(name, plugin)
    return Effect.succeed(undefined)
  }

  unregisterDeclarativePlugin(name: string): Effect.Effect<void> {
    this.plugins.delete(name)
    return Effect.succeed(undefined)
  }

  getDeclarativePlugin(name: string): Effect.Effect<any, Error> {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      return Effect.fail(new Error(`Plugin "${name}" not found`))
    }
    return Effect.succeed(plugin)
  }

  listDeclarativePlugins(): Effect.Effect<string[]> {
    return Effect.succeed(Array.from(this.plugins.keys()))
  }

  registerCommand(name: string, handler: any): Effect.Effect<void> {
    this.commands.set(name, handler)
    return Effect.succeed(undefined)
  }

  unregisterCommand(name: string): Effect.Effect<void> {
    this.commands.delete(name)
    return Effect.succeed(undefined)
  }

  executeCommand(name: string, args?: any[]): Effect.Effect<any> {
    const command = this.commands.get(name)
    if (!command) {
      return Effect.fail(new Error(`Command "${name}" not found`))
    }
    try {
      return Effect.succeed(command(...args))
    } catch (error) {
      return Effect.fail(error as Error)
    }
  }
}

// Create default instance
export const pluginStore = new DefaultPluginRegistry()
