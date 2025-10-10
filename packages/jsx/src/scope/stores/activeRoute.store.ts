/**
 * Active Route Store
 *
 * Manages the currently active command route parsed from Bun.argv or changed programmatically.
 * This is the "URL" equivalent for CLI routing - starts from argv, can be changed reactively.
 */

import { $state, type StateRune } from '@tuix/reactive/runes'

export interface ActiveRoute {
  /** Command path segments (e.g., ['foo', 'bar'] for "foo bar") */
  path: string[]

  /** Raw arguments passed to the command */
  args: string[]

  /** Parsed flags (e.g., { verbose: true, output: 'json' }) */
  flags: Record<string, string | boolean | number>

  /** Whether help was requested (--help, -h) */
  helpRequested: boolean
}

class ActiveRouteStore {
  private route: StateRune<ActiveRoute> = $state<ActiveRoute>({
    path: [],
    args: [],
    flags: {},
    helpRequested: false,
  })

  /**
   * Initialize route from Bun.argv
   * Parses command-line arguments into path, args, and flags
   */
  initFromArgv(): void {
    // Bun.argv = ['/path/to/bun', '/path/to/script.ts', ...userArgs]
    const userArgs = Bun.argv.slice(2)

    const parsed = this.parseArguments(userArgs)
    this.route.$set(parsed)
  }

  /**
   * Parse raw arguments into structured route
   */
  private parseArguments(args: string[]): ActiveRoute {
    const path: string[] = []
    const positionalArgs: string[] = []
    const flags: Record<string, string | boolean | number> = {}
    let helpRequested = false

    let i = 0
    let foundFlags = false

    while (i < args.length) {
      const arg = args[i]!

      // Check for help flag
      if (arg === '--help' || arg === '-h') {
        helpRequested = true
        i++
        continue
      }

      // Flag: --flag or --flag=value
      if (arg.startsWith('--')) {
        foundFlags = true
        const flagStr = arg.slice(2)
        const eqIndex = flagStr.indexOf('=')

        if (eqIndex > 0) {
          // --flag=value
          const name = flagStr.slice(0, eqIndex)
          const value = flagStr.slice(eqIndex + 1)
          flags[name] = this.coerceValue(value)
        } else {
          // --flag (boolean or has next value)
          const nextArg = args[i + 1]
          if (nextArg && !nextArg.startsWith('-')) {
            // --flag value
            flags[flagStr] = this.coerceValue(nextArg)
            i++ // Skip next arg
          } else {
            // --flag (boolean)
            flags[flagStr] = true
          }
        }
        i++
        continue
      }

      // Short flag: -f or -f value
      if (arg.startsWith('-') && arg.length > 1) {
        foundFlags = true
        const flagChar = arg[1]!

        if (arg.length > 2) {
          // -fvalue
          flags[flagChar] = this.coerceValue(arg.slice(2))
        } else {
          // -f or -f value
          const nextArg = args[i + 1]
          if (nextArg && !nextArg.startsWith('-')) {
            // -f value
            flags[flagChar] = this.coerceValue(nextArg)
            i++ // Skip next arg
          } else {
            // -f (boolean)
            flags[flagChar] = true
          }
        }
        i++
        continue
      }

      // Not a flag - it's either a command segment or positional arg
      if (!foundFlags) {
        // Before we've seen any flags, this is part of the command path
        path.push(arg)
      } else {
        // After flags, these are positional arguments
        positionalArgs.push(arg)
      }

      i++
    }

    return {
      path,
      args: positionalArgs,
      flags,
      helpRequested,
    }
  }

  /**
   * Coerce string value to appropriate type
   */
  private coerceValue(value: string): string | boolean | number {
    // Boolean
    if (value === 'true') return true
    if (value === 'false') return false

    // Number
    const num = Number(value)
    if (!isNaN(num) && value.trim() !== '') return num

    // String
    return value
  }

  /**
   * Get current route
   */
  get(): ActiveRoute {
    return this.route()
  }

  /**
   * Set route programmatically (for interactive navigation)
   */
  set(route: Partial<ActiveRoute>): void {
    const current = this.route()
    this.route.$set({
      ...current,
      ...route,
    })
  }

  /**
   * Navigate to a new command path (keeping existing flags/args)
   */
  navigate(path: string[]): void {
    const current = this.route()
    this.route.$set({
      ...current,
      path,
    })
  }

  /**
   * Check if a scope path matches the current route
   *
   * Examples:
   * - Route: ['foo', 'bar'] matches Scope path: ['foo', 'bar'] (exact)
   * - Route: ['foo', 'bar', 'baz'] matches Scope path: ['foo', 'bar'] (prefix)
   * - Route: ['foo'] does NOT match Scope path: ['foo', 'bar'] (incomplete)
   */
  matches(scopePath: string[]): boolean {
    const route = this.route()

    // Empty route (no command) matches nothing
    if (route.path.length === 0) return false

    // Scope path must be a prefix of route path
    if (scopePath.length > route.path.length) return false

    // Check if all scope path segments match route
    return scopePath.every((segment, i) => segment === route.path[i])
  }

  /**
   * Check if a scope path is an exact match for the route
   */
  isExactMatch(scopePath: string[]): boolean {
    const route = this.route()

    if (route.path.length !== scopePath.length) return false

    return scopePath.every((segment, i) => segment === route.path[i])
  }

  /**
   * Check if help was requested or if route is empty
   */
  shouldShowHelp(): boolean {
    const route = this.route()
    return route.helpRequested || route.path.length === 0
  }

  /**
   * Subscribe to route changes
   */
  subscribe(callback: (route: ActiveRoute) => void): () => void {
    // In a real implementation, this would set up a subscription
    // For now, we'll rely on the reactive system
    return () => {}
  }
}

// Export singleton instance
export const activeRouteStore = new ActiveRouteStore()

/**
 * Helper to get active route in components
 */
export function useActiveRoute(): ActiveRoute {
  return activeRouteStore.get()
}

/**
 * Helper to check if current scope matches active route
 */
export function useRouteMatch(scopePath: string[]): boolean {
  return activeRouteStore.matches(scopePath)
}

/**
 * Helper to navigate to a new route
 */
export function useNavigate(): (path: string[]) => void {
  return (path: string[]) => activeRouteStore.navigate(path)
}
