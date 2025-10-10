/**
 * New JSX runApp - Uses MVU Runtime
 *
 * This replaces the old direct-rendering runApp with one that:
 * 1. Compiles JSX to Component<Model, Msg>
 * 2. Detects if interactive (CLI vs TUI)
 * 3. Uses MVU runtime with hooks
 * 4. Integrates reactive state
 */

import { Effect } from 'effect'
import { runApp as mvuRunApp } from '@tuix/runtime'
import { createDefaultReactiveHooks } from '@tuix/reactive'
import type { JSXComponent } from './jsx-to-component'
import { compileToComponent, detectInteractive } from './jsx-to-component'

/**
 * Configuration for JSX app
 */
export interface JSXRunConfig {
  /**
   * Enable debug output
   * @default false
   */
  debug?: boolean

  /**
   * Force interactive mode (keeps app running)
   * Auto-detected if not specified
   * @default auto-detect
   */
  interactive?: boolean

  /**
   * Extract reactive state as model
   * @default true
   */
  extractState?: boolean

  /**
   * Target FPS for rendering
   * @default 60
   */
  fps?: number

  /**
   * Enable mouse support
   * @default false
   */
  enableMouse?: boolean
}

/**
 * Run a JSX component as a TUIX application
 *
 * This is the main entry point for JSX-based TUIX apps.
 * It compiles the JSX component to a proper MVU component and runs it
 * with the runtime.
 *
 * @example
 * ```tsx
 * // CLI command - exits after render
 * function ListCommand() {
 *   return <text>Item 1\nItem 2\nItem 3</text>
 * }
 *
 * await runApp(ListCommand)
 *
 * // TUI app - stays open
 * function CounterApp() {
 *   const count = $state(0)
 *   return (
 *     <vstack>
 *       <text>Count: {count()}</text>
 *       <text>Press 'q' to quit</text>
 *     </vstack>
 *   )
 * }
 *
 * await runApp(CounterApp, { interactive: true })
 * ```
 */
export async function runApp(
  jsxComponent: JSXComponent,
  config: JSXRunConfig = {}
): Promise<void> {
  const { LiveServices } = await import('@tuix/core/services/live')
  const { activeRouteStore } = await import('../scope/stores')
  const { scopeManager } = await import('../scope/manager')

  // PHASE 1: Initialize CLI routing
  // Parse command line args and set up active route
  activeRouteStore.initFromArgv()

  if (config.debug) {
    const route = activeRouteStore.get()
    console.log('Active route:', {
      path: route.path,
      args: route.args,
      flags: route.flags,
      helpRequested: route.helpRequested,
    })
  }

  // PHASE 2: Detect if interactive
  // CLI commands exit after render, TUI apps loop
  const isInteractive = config.interactive ?? detectInteractive(jsxComponent)

  if (config.debug) {
    console.log('Interactive mode:', isInteractive)
  }

  // PHASE 3: Compile JSX to MVU Component
  // This extracts state and creates proper Component<Model, Msg>
  const component = compileToComponent(jsxComponent, {
    extractState: config.extractState ?? true,
    interactive: isInteractive,
    debug: config.debug,
  })

  // PHASE 4: Create reactive hooks
  // This syncs MVU model with reactive $state
  const hooks = createDefaultReactiveHooks()

  // PHASE 5: Run with MVU runtime
  // The runtime handles the full MVU loop with hooks
  return Effect.runPromise(
    mvuRunApp(component, {
      fps: config.fps ?? 60,
      enableMouse: config.enableMouse ?? false,
      exitAfterRender: !isInteractive, // CLI exits, TUI loops
      hooks, // Reactive integration
      debug: config.debug ?? false,
    }).pipe(Effect.provide(LiveServices))
  )
}
