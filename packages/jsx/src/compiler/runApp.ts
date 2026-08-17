/**
 * JSX runApp — compile JSX to MVU, convert trees to View, run Effect runtime.
 * CLI routing: argv → scopes → fallback/help when no command / --help.
 */

import { Effect } from 'effect'
import { runApp as mvuRunApp } from '@tuix/runtime'
import { createDefaultReactiveHooks } from '@tuix/reactive'
import type { JSXComponent } from './jsx-to-component'
import { compileToComponent, detectInteractive, toView } from './jsx-to-component'
import { text } from '@tuix/view'

export type { JSXComponent }

export interface JSXRunConfig {
  debug?: boolean
  interactive?: boolean
  extractState?: boolean
  fps?: number
  enableMouse?: boolean
}

type MatchedScope = {
  executable?: boolean
  path?: string[]
  handler?: () => unknown
  metadata?: { component?: () => unknown; interactive?: boolean }
  component?: () => unknown
}

/**
 * Run a JSX component as a TUIX application.
 */
export async function runApp(jsxComponent: JSXComponent, config: JSXRunConfig = {}): Promise<void> {
  const { LiveServices } = await import('@tuix/core/services/live')
  const { activeRouteStore } = await import('../scope/stores')
  const { scopeManager } = await import('../scope/manager')

  // Reset scopes between runs (important for tests / repeated CLI)
  try {
    scopeManager.clear?.()
  } catch {
    /* optional API */
  }

  activeRouteStore.initFromArgv()
  const route = activeRouteStore.get()

  const helpOrOneShot =
    route.helpRequested || process.argv.includes('--help') || process.argv.includes('-h')

  // Evaluate + fully render JSX tree once so function components (Command/Scope)
  // run and register scopes. Descriptors alone do not invoke components.
  const rootTree = jsxComponent()
  try {
    void toView(rootTree)
    scopeManager.fixScopePaths?.()
  } catch (e) {
    if (config.debug) console.warn('scope registration render:', e)
  }

  const buildHelp = (): string => {
    try {
      const allScopes = scopeManager.getAllScopes?.() ?? []
      const rootScopes = allScopes.filter(
        (s: {
          executable?: boolean
          path?: string[]
          metadata?: { hidden?: boolean }
          name?: string
          description?: string
        }) => s.executable && Array.isArray(s.path) && s.path.length === 1 && !s.metadata?.hidden
      )
      if (rootScopes.length === 0) {
        return 'tuix — Terminal UI framework\n\nUsage: tuix <command> [--help]\n'
      }
      const lines = [
        'tuix — Terminal UI framework',
        '',
        'Available commands:',
        ...rootScopes.map((s: { name: string; description?: string }) => {
          const desc = s.description ? ` — ${s.description}` : ''
          return `  ${s.name}${desc}`
        }),
        '',
        'Run: tuix <command> [--help]',
        '',
      ]
      return lines.join('\n')
    } catch {
      return 'tuix — Terminal UI framework\n\nUsage: tuix <command> [--help]\n'
    }
  }

  const noCommand = route.path.length === 0
  const showHelp = helpOrOneShot || noCommand

  const findMatched = (): MatchedScope | undefined => {
    try {
      return scopeManager
        .getAllScopes?.()
        ?.find(
          (s: MatchedScope) =>
            s.executable &&
            Array.isArray(s.path) &&
            s.path.length === route.path.length &&
            s.path.every((p: string, i: number) => p === route.path[i])
        ) as MatchedScope | undefined
    } catch {
      return undefined
    }
  }

  const matched = !noCommand ? findMatched() : undefined

  // Prefer Fallback when registered and no path (and not pure --help)
  let fallbackComponent: (() => unknown) | null = null
  let fallbackView: unknown = null
  if (noCommand && !route.helpRequested) {
    try {
      const fb = scopeManager.getFallback?.()
      if (fb?.component) {
        fallbackComponent = fb.component
        fallbackView = fb.component()
      }
    } catch {
      /* none */
    }
  }

  // Interactivity from the *active surface*, not the root shell name.
  // Bare *App names must not force fullscreen (hangs one-shot CLI).
  let isInteractive: boolean
  if (config.interactive !== undefined) {
    isInteractive = config.interactive
  } else if (helpOrOneShot && !fallbackView) {
    isInteractive = false
  } else if (matched) {
    const cmd =
      (typeof matched.handler === 'function' && matched.handler) ||
      (typeof matched.metadata?.component === 'function' && matched.metadata.component) ||
      (typeof matched.component === 'function' && matched.component) ||
      null
    if (matched.metadata?.interactive === true) {
      isInteractive = true
    } else if (matched.metadata?.interactive === false) {
      isInteractive = false
    } else if (cmd && typeof cmd === 'function') {
      isInteractive = detectInteractive(cmd as JSXComponent)
    } else {
      isInteractive = false
    }
  } else if (fallbackComponent) {
    isInteractive = detectInteractive(fallbackComponent as JSXComponent)
  } else if (noCommand) {
    isInteractive = false
  } else {
    isInteractive = detectInteractive(jsxComponent)
  }

  if (config.debug) {
    console.log('Active route:', {
      path: route.path,
      args: route.args,
      flags: route.flags,
      helpRequested: route.helpRequested,
    })
    console.log('Interactive mode:', isInteractive)
  }

  const wrapper: JSXComponent = () => {
    if (showHelp && !fallbackView) {
      return text(buildHelp())
    }
    if (fallbackView) {
      return fallbackView
    }
    try {
      const m = findMatched()
      if (m?.handler && typeof m.handler === 'function') {
        return m.handler()
      }
      if (m?.metadata?.component && typeof m.metadata.component === 'function') {
        return m.metadata.component()
      }
    } catch {
      /* fall through */
    }
    if (noCommand) return text(buildHelp())
    return rootTree
  }

  const component = compileToComponent(wrapper, {
    extractState: config.extractState ?? true,
    interactive: isInteractive,
    debug: config.debug,
  })

  const originalView = component.view
  component.view = async (model: any) => toView(await originalView(model))

  let hooks
  try {
    hooks = createDefaultReactiveHooks()
  } catch {
    hooks = undefined
  }

  return Effect.runPromise(
    mvuRunApp(component, {
      fps: config.fps ?? 60,
      enableMouse: config.enableMouse ?? false,
      fullscreen: isInteractive,
      exitAfterRender: !isInteractive,
      hooks,
      debug: config.debug ?? false,
    }).pipe(Effect.provide(LiveServices))
  )
}
