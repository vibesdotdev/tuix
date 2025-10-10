/**
 * Scope Stack Store
 *
 * Maintains a stack of scopes during JSX evaluation to correctly establish
 * parent-child relationships despite children being evaluated before parents
 */

import type { ScopeDef } from '../types'

class ScopeStackStore {
  private stack: ScopeDef[] = []

  /**
   * Push a scope onto the stack (called when Scope component starts)
   */
  push(scope: ScopeDef): void {
    this.stack.push(scope)
    if (process.env.DEBUG_SCOPE) {
      console.log(`[ScopeStack] Pushed ${scope.name}, stack depth: ${this.stack.length}`)
    }
  }

  /**
   * Pop a scope from the stack (called when Scope component finishes)
   */
  pop(): ScopeDef | null {
    const popped = this.stack.pop() || null
    if (process.env.DEBUG_SCOPE) {
      console.log(`[ScopeStack] Popped ${popped?.name || 'null'}, stack depth: ${this.stack.length}`)
    }
    return popped
  }

  /**
   * Peek at the top of the stack without removing
   */
  peek(): ScopeDef | null {
    return this.stack[this.stack.length - 1] || null
  }

  /**
   * Get the current parent (the scope that will be parent to the next pushed scope)
   * This is the LAST scope on the stack that was pushed but hasn't popped yet
   */
  getParent(): ScopeDef | null {
    // The parent is actually the scope BEFORE the current one
    // Because when we're evaluating a child, the parent hasn't been pushed yet!
    // This is tricky: children evaluate first, so when child.Scope() runs,
    // the stack is empty or contains siblings/ancestors
    return this.stack[this.stack.length - 1] || null
  }

  /**
   * Clear the stack (for testing)
   */
  clear(): void {
    this.stack = []
  }

  /**
   * Get current stack depth (for debugging)
   */
  depth(): number {
    return this.stack.length
  }
}

// Export singleton instance
export const scopeStackStore = new ScopeStackStore()
