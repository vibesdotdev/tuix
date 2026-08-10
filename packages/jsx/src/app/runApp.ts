/**
 * JSX Runtime Wrapper
 *
 * Provides a simple runApp function that wraps JSX components
 * into the MVU Component interface expected by the runtime.
 */

import { Effect } from 'effect'
import { TerminalService } from '@tuix/core/services'
import { text } from '@tuix/view'

/**
 * JSX Component - a simple function that returns a View
 */
export type JSXComponent = () => any

/**
 * Configuration for JSX app
 */
export interface JSXRunConfig {
  /** Enable debug output */
  debug?: boolean
  /** Keep app running (don't auto-exit after render) */
  interactive?: boolean
}

/**
 * Run a JSX component as a TUIX application
 *
 * By default, renders the component once and exits. Set `interactive: true`
 * to keep the app running (useful for components with input handlers).
 *
 * @example
 * ```tsx
 * import { runApp } from '@tuix/jsx'
 *
 * function App() {
 *   return (
 *     <vstack>
 *       <text>Hello World</text>
 *     </vstack>
 *   )
 * }
 *
 * await runApp(App) // Renders and exits
 * await runApp(InteractiveApp, { interactive: true }) // Stays open
 * ```
 */
export const runApp = async (component: JSXComponent, config: JSXRunConfig = {}): Promise<void> => {
  const { LiveServices } = await import('@tuix/core/services/live')
  const { activeRouteStore } = await import('../scope/stores')
  const { scopeManager } = await import('../scope/manager')
  const { context, app } = await import('@tuix/reactive/state')

  // Initialize route from Bun.argv BEFORE rendering
  activeRouteStore.initFromArgv()

  // Sync global context state with the parsed route
  const route = activeRouteStore.get()
  context.scope.$set(route.path)
  context.args.$set(route.args)
  context.flags.$set(route.flags)
  context.helpRequested.$set(route.helpRequested)

  if (config.debug) {
    console.log('Active route:', {
      path: route.path,
      args: route.args,
      flags: route.flags,
      helpRequested: route.helpRequested,
    })
  }

  return Effect.runPromise(
    Effect.gen(function* () {
      const terminal = yield* TerminalService

      try {
        // Set up terminal
        yield* terminal.setAlternateScreen(true)
        yield* terminal.hideCursor
        yield* terminal.clear

        // PHASE 1: Construct JSX tree (registers all scopes bottom-up)
        const result = component()

        // PHASE 2: Finalize scope tree (establish relationships, fix paths)
        scopeManager.fixScopePaths()

        // Sync app.scopes with scopeManager
        const allScopes = scopeManager.getAllScopes()
        const scopesMap = new Map(allScopes.map(s => [s.id, s]))
        app.scopes.$set(scopesMap)

        // Find the matching command and extract positional args from extra path segments
        // E.g., if route.path is ["config", "get", "api.key"] and the matched command is ["config", "get"]
        // then "api.key" should be a positional argument
        const currentRoute = activeRouteStore.get()
        const matchedCommand = allScopes.find(
          s => s.executable && activeRouteStore.isExactMatch(s.path)
        )

        if (!matchedCommand) {
          // Try to find a command that matches as a prefix (route is longer than command path)
          const prefixMatch = allScopes
            .filter(s => s.executable && activeRouteStore.matches(s.path))
            .sort((a, b) => b.path.length - a.path.length)[0] // Longest match wins

          if (prefixMatch) {
            // Extract extra path segments as positional args
            const extraSegments = currentRoute.path.slice(prefixMatch.path.length)
            const allArgs = [...extraSegments, ...currentRoute.args]
            context.args.$set(allArgs)
          }
        }

        if (config.debug) {
          console.log('All scopes after finalization:')
          allScopes.forEach(scope => {
            console.log(`  ${scope.type}:${scope.name} -> path: ${scope.path.join('/')}`)
          })
          console.log('Context after arg extraction:', {
            scope: context.scope(),
            args: context.args(),
            flags: context.flags(),
          })
        }

        // PHASE 3: Render (top-down, conditional based on route)
        let rendered = yield* result.render()

        // Extract the actual string content if render() returns an object
        let content =
          typeof rendered === 'string' ? rendered : rendered?.content || String(rendered)

        // Check if we should show fallback or help
        const route = activeRouteStore.get()
        const noCommandSpecified = route.path.length === 0
        const noCommandMatched = route.path.length > 0 && (!content || content.trim().length === 0)
        const shouldShowFallback = noCommandSpecified || route.helpRequested || noCommandMatched

        if (shouldShowFallback) {
          // Check if a Fallback component was registered
          const fallback = scopeManager.getFallback()

          if (fallback && noCommandSpecified) {
            // Only show custom fallback when no command specified (not for invalid commands)
            const fallbackView = fallback.component()
            if (fallbackView && typeof fallbackView.render === 'function') {
              const fallbackRendered = yield* fallbackView.render()
              content =
                typeof fallbackRendered === 'string'
                  ? fallbackRendered
                  : fallbackRendered?.content || String(fallbackRendered)
            }
          } else {
            // No fallback provided - show auto-generated help
            const allScopes = scopeManager.getAllScopes()
            const rootScopes = allScopes.filter(
              s => s.executable && s.path.length === 1 && !s.metadata.hidden
            )

            if (rootScopes.length > 0) {
              const helpLines = [
                '',
                'Available commands:',
                ...rootScopes.map(s => {
                  const desc = s.description ? ` - ${s.description}` : ''
                  return `  ${s.name}${desc}`
                }),
                '',
                'Run with --help for more information',
                '',
              ]
              content = helpLines.join('\n')
            }
          }
        }

        if (config.debug) {
          console.log('Rendered:', { content, width: result.width, height: result.height })
        }

        // Write to terminal
        yield* terminal.write(content)

        // If not interactive, exit after rendering
        if (!config.interactive) {
          return
        }

        // If interactive, wait indefinitely (user must Ctrl+C to exit)
        yield* Effect.never
      } finally {
        // Cleanup
        yield* terminal.showCursor
        yield* terminal.setAlternateScreen(false)
      }
    }).pipe(Effect.provide(LiveServices))
  ).then(() => {
    // If not interactive, force exit
    if (!config.interactive) {
      process.exit(0)
    }
  })
}
