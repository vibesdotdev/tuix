/**
 * Scope Manager
 *
 * Central manager for all scope operations.
 * Handles registration, activation, status tracking, and hierarchy management.
 */

import { Effect } from 'effect'
import {
  ScopeDef,
  ScopeState,
  ScopeStatus,
  ScopeError,
  ScopeNotFoundError,
  ScopeExistsError,
} from './types'
import { getGlobalEventBus } from '@tuix/reactive/events/event-bus'
import { getGlobalRegistry } from '@tuix/core'
import { scopeDebug } from '@tuix/debug'

export class ScopeManager {
  private scopes = new Map<string, ScopeState>()
  private activeScopes = new Set<string>()
  private jsxModule: JSXModule | null = null
  private fallback: { component: () => any; metadata: Record<string, unknown> } | null = null

  constructor() {
    // Try to get JSX module for event emission
    this.initializeJSXModule()
  }

  private initializeJSXModule() {
    try {
      const registry = getGlobalRegistry()
      this.jsxModule = registry.getModule<JSXModule>('jsx') || null
    } catch {
      // Module system not initialized yet, will try again on first use
    }
  }

  /**
   * Register a new scope
   * Handles flexible parent/child order - child can be registered before parent
   */
  registerScope(def: ScopeDef): Effect.Effect<void, ScopeError> {
    return Effect.gen(
      function* () {
        scopeDebug.debug(`Registering scope: ${def.type}:${def.name} (${def.id})`, {
          path: def.path,
        })

        // Check if already exists
        if (this.scopes.has(def.id)) {
          // If it's the same definition, just update and return success
          const existing = this.scopes.get(def.id)!
          if (
            existing.def.name === def.name &&
            existing.def.type === def.type &&
            existing.def.path.join('/') === def.path.join('/')
          ) {
            // Update the definition in case metadata changed
            existing.def = def
            return
          }
          // Otherwise it's a real conflict
          return yield* Effect.fail(new ScopeExistsError(def.id))
        }

        // Create initial state
        const state: ScopeState = {
          def,
          status: 'unmounted',
          isActive: false,
          context: {},
          transient: {},
          childIds: [],
        }

        // Check if parent ID was stored in metadata (preferred method)
        const parentId = def.metadata?._parentScopeId as string | undefined
        if (parentId) {
          const parent = this.scopes.get(parentId)
          if (parent) {
            state.parentId = parentId
            parent.childIds.push(def.id)
            scopeDebug.debug(`Linked child ${def.name} to parent ${parent.def.name} (via metadata)`, {
              childId: def.id,
              parentId,
            })
          } else {
            scopeDebug.warn(`Parent ID in metadata not found: ${parentId}`, {
              childName: def.name,
            })
          }
        } else {
          // Fallback: try to find parent by path (legacy behavior)
          if (def.path.length > 1) {
            const parentPath = def.path.slice(0, -1)
            const parent = this.findScopeByPath(parentPath)
            if (parent) {
              state.parentId = parent.def.id
              parent.childIds.push(def.id)
              scopeDebug.debug(`Linked child ${def.name} to parent ${parent.def.name} (via path)`, {
                childPath: def.path,
                parentPath: parent.def.path,
              })
            }
          }
        }

        // Check if any existing scopes should be our children
        for (const [id, existingState] of this.scopes) {
          const existingPath = existingState.def.path
          if (
            existingPath.length === def.path.length + 1 &&
            existingPath.slice(0, -1).join('/') === def.path.join('/')
          ) {
            state.childIds.push(id)
            existingState.parentId = def.id
            scopeDebug.debug(
              `Found existing child ${existingState.def.name} for new parent ${def.name}`,
              {
                childPath: existingPath,
                parentPath: def.path,
              }
            )
          }
        }

        this.scopes.set(def.id, state)
      }.bind(this)
    )
  }

  /**
   * Activate a scope by ID
   */
  activateScope(id: string): Effect.Effect<void, ScopeError> {
    return Effect.gen(
      function* () {
        const state = this.scopes.get(id)
        if (!state) {
          return yield* Effect.fail(new ScopeNotFoundError(id))
        }

        this.activeScopes.add(id)
        state.isActive = true

        // Activate parent chain
        let parentId = state.parentId
        while (parentId) {
          const parent = this.scopes.get(parentId)
          if (parent) {
            this.activeScopes.add(parentId)
            parent.isActive = true
            parentId = parent.parentId
          } else {
            break
          }
        }
      }.bind(this)
    )
  }

  /**
   * Deactivate a scope and its children
   */
  deactivateScope(id: string): Effect.Effect<void, ScopeError> {
    return Effect.gen(
      function* () {
        const state = this.scopes.get(id)
        if (!state) {
          return yield* Effect.fail(new ScopeNotFoundError(id))
        }

        // Deactivate this scope
        this.activeScopes.delete(id)
        state.isActive = false

        // Deactivate all children
        for (const childId of state.childIds) {
          yield* this.deactivateScope(childId)
        }
      }.bind(this)
    )
  }

  /**
   * Check if a scope is active (self or any children)
   */
  isScopeActive(id: string): boolean {
    const state = this.scopes.get(id)
    if (!state) return false

    // Check self
    if (state.isActive) return true

    // Check children recursively
    for (const childId of state.childIds) {
      if (this.isScopeActive(childId)) return true
    }

    return false
  }

  /**
   * Set scope status
   */
  setScopeStatus(id: string, status: ScopeStatus): Effect.Effect<void, ScopeError> {
    return Effect.gen(
      function* () {
        const state = this.scopes.get(id)
        if (!state) {
          return yield* Effect.fail(new ScopeNotFoundError(id))
        }

        state.status = status
      }.bind(this)
    )
  }

  /**
   * Get scope status
   */
  getScopeStatus(id: string): ScopeStatus | null {
    const state = this.scopes.get(id)
    return state ? state.status : null
  }

  /**
   * Set scope context data
   */
  setScopeContext(id: string, data: Record<string, unknown>): Effect.Effect<void, ScopeError> {
    return Effect.gen(
      function* () {
        const state = this.scopes.get(id)
        if (!state) {
          return yield* Effect.fail(new ScopeNotFoundError(id))
        }

        state.context = { ...state.context, ...data }
      }.bind(this)
    )
  }

  /**
   * Get scope context data
   */
  getScopeContext(id: string): Record<string, unknown> | null {
    const state = this.scopes.get(id)
    return state ? state.context : null
  }

  /**
   * Set transient state
   */
  setTransientState(id: string, data: Record<string, unknown>): Effect.Effect<void, ScopeError> {
    return Effect.gen(
      function* () {
        const state = this.scopes.get(id)
        if (!state) {
          return yield* Effect.fail(new ScopeNotFoundError(id))
        }

        state.transient = { ...state.transient, ...data }
      }.bind(this)
    )
  }

  /**
   * Reset transient state
   */
  resetTransientState(id: string): Effect.Effect<void, ScopeError> {
    return Effect.gen(
      function* () {
        const state = this.scopes.get(id)
        if (!state) {
          return yield* Effect.fail(new ScopeNotFoundError(id))
        }

        state.transient = {}
      }.bind(this)
    )
  }

  /**
   * Get scope definition by ID
   */
  getScopeDef(id: string): ScopeDef | null {
    const state = this.scopes.get(id)
    return state ? state.def : null
  }

  /**
   * Get child scopes for a given scope ID
   */
  getChildScopes(id?: string): ScopeDef[] {
    if (!id) {
      // Return root scopes
      return Array.from(this.scopes.values())
        .filter(state => !state.parentId)
        .map(state => state.def)
    }

    const state = this.scopes.get(id)
    if (!state) return []

    return state.childIds
      .map(childId => this.scopes.get(childId))
      .filter(Boolean)
      .map(state => state!.def)
  }

  /**
   * Get parent scope
   */
  getParentScope(id: string): ScopeDef | null {
    const state = this.scopes.get(id)
    if (!state || !state.parentId) return null

    const parent = this.scopes.get(state.parentId)
    return parent ? parent.def : null
  }

  /**
   * Find scope by path
   */
  private findScopeByPath(path: string[]): ScopeState | null {
    for (const [_, state] of this.scopes) {
      if (state.def.path.join('/') === path.join('/')) {
        return state
      }
    }
    return null
  }

  /**
   * Remove a scope from the registry
   * Handles cleanup of parent-child relationships
   */
  removeScope(id: string): Effect.Effect<void, ScopeError> {
    return Effect.gen(
      function* () {
        const state = this.scopes.get(id)
        if (!state) {
          return // Already removed, not an error
        }

        // Remove from parent's child list
        if (state.parentId) {
          const parent = this.scopes.get(state.parentId)
          if (parent) {
            parent.childIds = parent.childIds.filter(childId => childId !== id)
          }
        }

        // Reparent children to this scope's parent
        for (const childId of state.childIds) {
          const child = this.scopes.get(childId)
          if (child) {
            child.parentId = state.parentId
            if (state.parentId) {
              const parent = this.scopes.get(state.parentId)
              if (parent && !parent.childIds.includes(childId)) {
                parent.childIds.push(childId)
              }
            }
          }
        }

        // Remove from active scopes
        this.activeScopes.delete(id)

        // Remove from registry
        this.scopes.delete(id)
      }.bind(this)
    )
  }

  /**
   * Clear all scopes (useful for testing)
   */
  clear(): void {
    this.scopes.clear()
    this.activeScopes.clear()
  }

  /**
   * Get all scopes (for debugging)
   */
  getAllScopes(): ScopeDef[] {
    return Array.from(this.scopes.values()).map(state => state.def)
  }

  /**
   * Fix scope paths by rebuilding them from parent relationships
   * Call this after all scopes are registered to correct any path issues
   * caused by registration order
   */
  /**
   * Link orphaned child scopes to their parents using metadata
   * Call this after all scopes are registered to establish relationships
   * that couldn't be made during registration due to timing
   */
  linkOrphanedScopes(): void {
    for (const [childId, childState] of this.scopes) {
      // Skip if already has a parent
      if (childState.parentId) continue

      // Check if metadata has a parent ID reference
      const parentId = childState.def.metadata?._parentScopeId as string | undefined
      if (!parentId) continue

      // Try to find and link to parent
      const parent = this.scopes.get(parentId)
      if (parent) {
        childState.parentId = parentId
        if (!parent.childIds.includes(childId)) {
          parent.childIds.push(childId)
        }
      }
    }
  }

  fixScopePaths(): void {
    // First, link any orphaned scopes
    this.linkOrphanedScopes()

    // Find all root scopes (no parent)
    const roots = Array.from(this.scopes.values()).filter(state => !state.parentId)

    // Recursively fix paths starting from roots
    const fixPath = (state: ScopeState, parentPath: string[] = []): void => {
      // Recompute this scope's path
      const correctPath = [...parentPath, state.def.name]
      state.def.path = correctPath

      // Fix all children
      for (const childId of state.childIds) {
        const child = this.scopes.get(childId)
        if (child) {
          fixPath(child, correctPath)
        }
      }
    }

    // Fix all root scopes and their descendants
    for (const root of roots) {
      fixPath(root, [])
    }
  }

  /**
   * Set scope definition and emit events - idiomatic helper for components
   * This is the main entry point for Scope components to register themselves
   */
  setScopeDef(def: ScopeDef): Effect.Effect<void, ScopeError> {
    return Effect.gen(
      function* () {
        // Register the scope synchronously
        yield* this.registerScope(def)

        // Schedule event emission asynchronously to avoid blocking
        if (def.executable) {
          // Ensure JSX module is available
          if (!this.jsxModule) {
            this.initializeJSXModule()
          }

          if (this.jsxModule) {
            // Convert ScopeDef to ScopeContext for event
            const scopeContext: ScopeContext = {
              id: def.id,
              type: def.type as ScopeContext['type'],
              name: def.name,
              path: def.path,
              children: [],
              metadata: def.metadata || {},
              description: def.description,
              hidden: def.hidden,
              aliases: def.aliases,
              executable: def.executable,
              handler: def.handler,
              args: def.args,
              flags: def.flags,
              options: def.options,
            }

            // Emit event synchronously
            yield* Effect.catchAll(this.jsxModule.emitScopeCreated(scopeContext), error =>
              Effect.sync(() => {
                console.warn('Failed to emit scope created event:', error)
              })
            )
          }
        }
      }.bind(this)
    )
  }

  /**
   * Synchronous version for use in components
   */
  setScopeDefSync(def: ScopeDef): void {
    // Register synchronously
    const result = Effect.runSync(this.registerScope(def))

    // Schedule event emission if needed
    if (def.executable && this.jsxModule) {
      const scopeContext: ScopeContext = {
        id: def.id,
        type: def.type as ScopeContext['type'],
        name: def.name,
        path: def.path,
        children: [],
        metadata: def.metadata || {},
        description: def.description,
        hidden: def.hidden,
        aliases: def.aliases,
        executable: def.executable,
        handler: def.handler,
        args: def.args,
        flags: def.flags,
        options: def.options,
      }

      // Emit event synchronously
      Effect.runSync(
        Effect.catchAll(this.jsxModule.emitScopeCreated(scopeContext), error =>
          Effect.sync(() => {
            console.warn('Failed to emit scope created event:', error)
          })
        )
      )
    }
  }

  /**
   * Mark a scope as having rendered content
   * Used by ScopeContent to indicate that something was displayed
   */
  markScopeRendered(id: string): void {
    const state = this.scopes.get(id)
    if (state) {
      state.status = 'rendered'
      // Also mark all parent scopes as having rendered children
      let parentId = state.parentId
      while (parentId) {
        const parent = this.scopes.get(parentId)
        if (parent && parent.status !== 'rendered') {
          parent.status = 'rendered'
          parentId = parent.parentId
        } else {
          break
        }
      }
    }
  }

  /**
   * Check if a scope or any of its children have rendered content
   */
  hasRenderedContent(id: string): boolean {
    const state = this.scopes.get(id)
    if (!state) return false

    // Check if this scope itself has rendered
    if (state.status === 'rendered') return true

    // Check if any child has rendered
    return state.childIds.some(childId => this.hasRenderedContent(childId))
  }

  /**
   * Set fallback component to render when no command matches
   */
  setFallback(fallback: { component: () => any; metadata: Record<string, unknown> }): void {
    this.fallback = fallback
  }

  /**
   * Get fallback component
   */
  getFallback(): { component: () => any; metadata: Record<string, unknown> } | null {
    return this.fallback
  }

  /**
   * Clear fallback
   */
  clearFallback(): void {
    this.fallback = null
  }
}

/**
 * Scope error types
 */
export class ScopeError extends Error {
  constructor(
    message: string,
    public scopeId?: string,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'ScopeError'
  }
}

// Global scope manager instance
export const scopeManager = new ScopeManager()

// Export idiomatic helpers for components
export const setScopeDef = (def: ScopeDef) => scopeManager.setScopeDefSync(def)
export const markScopeRendered = (id: string) => scopeManager.markScopeRendered(id)
export const hasRenderedContent = (id: string) => scopeManager.hasRenderedContent(id)
