/**
 * Scope Component
 *
 * Core component that manages scope lifecycle and determines what to render
 */

import { Effect } from 'effect'
import { jsx } from '@tuix/jsx'
import { onMount, onDestroy } from '@tuix/reactive/jsx-lifecycle'
import { $state } from '@tuix/reactive/runes'
import { scopeManager, setScopeDef, hasRenderedContent } from '../manager'
import type { ScopeDef } from '../types'
import { currentScopeStore, parentScopeStore, activeRouteStore } from '../stores'
import type { JSX } from '@tuix/jsx'

export interface ScopeProps {
  // Scope definition
  id?: string
  type: ScopeDef['type']
  name: string
  path?: string[]
  description?: string
  executable?: boolean
  handler?: any
  args?: Record<string, any>
  flags?: Record<string, any>
  aliases?: string[]
  metadata?: Record<string, any>

  // Content and layout
  children?: JSX.Element | JSX.Element[]
  defaultContent?: JSX.Element
  layout?: (content: JSX.Element) => JSX.Element
}

export function Scope(props: ScopeProps): JSX.Element {
  const scopeId =
    props.id ||
    `scope_${props.type}_${props.name}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  // Track if content will render
  const willRenderContent = $state(false)
  const hasRenderedChildren = $state(false)

  // Create scope definition
  const scopeDef: ScopeDef = {
    id: scopeId,
    type: props.type,
    name: props.name,
    path: props.path || [],
    description: props.description,
    executable: props.executable ?? (props.type === 'command' || props.type === 'plugin'),
    handler: props.handler,
    args: props.args,
    flags: props.flags,
    aliases: props.aliases,
    metadata: props.metadata || {},
    children: [],
  }

  // Compute path - just use name for now, will be fixed in Phase 2
  if (scopeDef.path.length === 0) {
    scopeDef.path = [props.name]
  }

  // Register this scope FIRST (so it's in the registration order)
  currentScopeStore.register(scopeDef)

  // THEN get all children that were registered BEFORE this scope
  // In JSX, children evaluate before parents
  const childScopes = currentScopeStore.getChildren(scopeDef)

  // Only link if we're a Plugin (type='plugin') - Plugins can have child Commands
  // Commands don't link to other Commands (they're siblings)
  const isPlugin = props.type === 'plugin'
  if (scopeDef.executable && isPlugin && childScopes.length > 0) {
    // Link all unlinked children to this plugin
    for (const child of childScopes) {
      if (!child.metadata._parentScopeId) {
        child.metadata._parentScopeId = scopeDef.id
      }
    }
    // Mark ourselves as having children so we don't become a potential child when we register
    scopeDef.metadata._hasChildren = true
  }

  // Register with scope manager and emit events using the idiomatic helper
  setScopeDef(scopeDef)

  // Try to use lifecycle hooks if available, but don't block during registration
  try {
    onMount(() => {
      // Mark as mounted (async, non-blocking)
      Effect.runSync(scopeManager.setScopeStatus(scopeId, 'mounted'))

      // Cleanup on unmount - restore previous scope
      return () => {
        currentScopeStore.set(previousScope)
      }
    })
  } catch (error) {
    // We're outside a component context - skip lifecycle during registration
    // This is normal during initial JSX processing for CLI command detection
  }

  // Process children
  const { children, defaultContent, layout } = props

  // Normalize children to array
  const childArray = Array.isArray(children) ? children : children ? [children] : []

  // Determine what content we have
  const hasChildren = childArray.length > 0
  const hasContent = hasChildren || defaultContent

  // Build the content (will be conditionally rendered based on route)
  let content: JSX.Element

  if (hasContent) {
    content = defaultContent || <>{children}</>
  } else if (props.executable) {
    // No content and executable - show help
    content = <ScopeFallback scopeId={scopeId} />
  } else {
    // No content and not executable - empty
    content = jsx('text', { children: '' })
  }

  // Apply layout if provided
  if (layout) {
    content = layout(content)
  }

  // For executable scopes, wrap in route-aware render
  // Non-executable scopes (layout) always render
  if (props.executable) {
    return {
      render: () =>
        Effect.gen(function* () {
          const routeMatches = activeRouteStore.matches(scopeDef.path)
          if (!routeMatches) {
            return ''
          }

          // Convert JSX descriptor / View / function result into renderable content
          const { render: renderJsx } = yield* Effect.promise(() => import('../../jsx-runtime'))
          const view =
            content && typeof (content as { render?: unknown }).render === 'function'
              ? (content as { render: () => Effect.Effect<unknown> })
              : renderJsx(content as any)

          const rendered = yield* view.render()
          if (typeof rendered === 'string') return rendered
          if (rendered && typeof rendered === 'object' && 'content' in rendered) {
            return (rendered as { content: string }).content
          }
          return String(rendered ?? '')
        }),
      width: 0,
      height: 0,
    } as unknown as JSX.Element
  }

  // Non-executable scopes always render (ensure View)
  if (content && typeof (content as { render?: unknown }).render === 'function') {
    return content
  }
  // Lazy View wrapper so JSX children convert at render time
  return {
    render: () =>
      Effect.gen(function* () {
        const { render: renderJsx } = yield* Effect.promise(() => import('../../jsx-runtime'))
        const view = renderJsx(content as any)
        const rendered = yield* view.render()
        if (typeof rendered === 'string') return rendered
        if (rendered && typeof rendered === 'object' && 'content' in rendered) {
          return (rendered as { content: string }).content
        }
        return String(rendered ?? '')
      }),
    width: 0,
    height: 0,
  } as unknown as JSX.Element
}

// Import ScopeFallback to avoid circular dependency
import { ScopeFallback } from './ScopeFallback'
