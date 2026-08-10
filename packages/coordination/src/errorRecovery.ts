/* Moved from impl/errorRecovery.ts. See docs for compliance. */
/**
 * Error Recovery Manager - Advanced error handling and recovery
 *
 * Implements cross-module error detection, pattern matching, recovery
 * strategies, and circuit breakers for resilient system operation.
 */

import { Effect } from 'effect'
import { EventBus } from '@tuix/core/events'
import { ModuleBase, ModuleError } from '@tuix/runtime'
import type {
  ErrorPattern,
  RecoveryStrategy,
  ErrorStatistics,
  CircuitBreaker,
  ErrorIndicator,
} from './types'
import type { BaseEvent } from '@tuix/core/events'

export class ErrorRecoveryManager extends ModuleBase {
  private errorPatterns = new Map<string, ErrorPattern>()
  private recoveryStrategies = new Map<string, RecoveryStrategy>()
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private errorStats = {
    totalErrors: 0,
    totalEvents: 0,
    errorsByType: new Map<string, number>(),
    errorsByModule: new Map<string, number>(),
    errorsBySeverity: new Map<string, number>(),
    recentErrors: [] as ErrorIndicator[],
    recoveryAttempts: 0,
    recoverySuccesses: 0,
  }

  constructor(eventBus: EventBus) {
    super(eventBus, 'error-recovery')
  }

  initialize(): Effect.Effect<void, ModuleError> {
    return Effect.succeed(undefined).pipe(
      Effect.tap(() => this.emitEvent('error-recovery-initialized', { type: 'custom' })),
      Effect.mapError(
        error =>
          new ModuleError('error-recovery', 'Failed to initialize error recovery manager', error)
      )
    )
  }

  /**
   * Register an error pattern
   */
  registerErrorPattern(pattern: ErrorPattern): Effect.Effect<void, never> {
    return Effect.sync(() => {
      this.errorPatterns.set(pattern.id, pattern)
    })
  }

  /**
   * Register a recovery strategy
   */
  registerRecoveryStrategy(strategy: RecoveryStrategy): Effect.Effect<void, never> {
    return Effect.sync(() => {
      this.recoveryStrategies.set(strategy.id, strategy)
    })
  }

  /**
   * Detect the first registered pattern matching the error.
   */
  detectErrorPattern(error: Error): Effect.Effect<ErrorPattern | undefined, never> {
    return Effect.sync(() => {
      for (const pattern of this.errorPatterns.values()) {
        try {
          if (pattern.condition(error)) return pattern
        } catch {
          /* ignore pattern errors */
        }
      }
      return undefined
    })
  }

  /**
   * Execute a named recovery strategy against an error.
   */
  executeRecoveryStrategy(
    strategyId: string,
    error: Error
  ): Effect.Effect<{ success: boolean; message?: string }, Error> {
    return Effect.gen(this, function* () {
      const strategy = this.recoveryStrategies.get(strategyId)
      if (!strategy) {
        return yield* Effect.fail(new Error(`Recovery strategy not found: ${strategyId}`))
      }
      this.errorStats.recoveryAttempts++
      const result = yield* strategy.execute(error)
      this.errorStats.recoverySuccesses++
      return result as { success: boolean; message?: string }
    })
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): Effect.Effect<ErrorStatistics, never> {
    return Effect.sync(() => ({
      totalErrors: this.errorStats.totalErrors,
      totalEvents: this.errorStats.totalEvents,
      errorsByType: this.errorStats.errorsByType,
      errorsByModule: this.errorStats.errorsByModule,
      errorsBySeverity: this.errorStats.errorsBySeverity,
      recentErrors: this.errorStats.recentErrors,
      circuitBreakers: this.circuitBreakers,
      recoverySuccessRate:
        this.errorStats.recoveryAttempts > 0
          ? (this.errorStats.recoverySuccesses / this.errorStats.recoveryAttempts) * 100
          : 0,
    }))
  }

  /**
   * Reset error statistics
   */
  resetStatistics(): Effect.Effect<void, never> {
    return Effect.sync(() => {
      this.errorStats = {
        totalErrors: 0,
        totalEvents: 0,
        errorsByType: new Map<string, number>(),
        errorsByModule: new Map<string, number>(),
        errorsBySeverity: new Map<string, number>(),
        recentErrors: [] as ErrorIndicator[],
        recoveryAttempts: 0,
        recoverySuccesses: 0,
      }
    })
  }
}
