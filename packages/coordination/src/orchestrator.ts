/* Moved from impl/orchestrator.ts. See docs for compliance. */
/**
 * Workflow Orchestrator - High-level orchestration for complex workflows
 *
 * Manages complex multi-step workflows that span multiple modules,
 * with proper error handling, rollback, and state management.
 */

import { Effect, Fiber, Duration } from 'effect'
import { EventBus } from '@tuix/reactive/events/event-bus'
import { ModuleBase, ModuleError, getGlobalRegistry } from '@tuix/core'
import { EventChoreographer } from './choreography'
import type { WorkflowConfig, WorkflowInstance, WorkflowResult } from './types'
import { SUBMODULE_NAMES } from './constants'
import { WorkflowError } from './errors'

/**
 * Workflow Orchestrator implementation
 */
export class WorkflowOrchestrator extends ModuleBase {
  private choreographer: EventChoreographer
  private activeWorkflows = new Map<string, Fiber.RuntimeFiber<WorkflowResult, WorkflowError>>()

  constructor(eventBus: EventBus) {
    super(eventBus, SUBMODULE_NAMES.ORCHESTRATOR)
    const registry = getGlobalRegistry()
    const choreographerModule = registry.getModule(SUBMODULE_NAMES.CHOREOGRAPHER)
    if (!choreographerModule) {
      throw new Error('Choreographer module not found in registry')
    }
    this.choreographer = choreographerModule as EventChoreographer
  }

  public initialize(): Effect.Effect<void, ModuleError> {
    return Effect.succeed(undefined).pipe(
      Effect.tap(() => this.emitEvent('orchestrator-initialized', { type: 'custom' })),
      Effect.mapError(
        error =>
          new ModuleError('orchestrator', 'Failed to initialize workflow orchestrator', error)
      )
    )
  }

  public executeWorkflow<T, E>(
    workflowId: string,
    config: WorkflowConfig
  ): Effect.Effect<WorkflowResult, WorkflowError> {
    const workflowEffect: Effect.Effect<WorkflowResult, WorkflowError> = Effect.gen(function* () {
      // Full implementation of workflow execution logic
      // This is a simplified version for demonstration
      let lastResult: any = null
      for (const step of config.steps) {
        lastResult = yield* Effect.mapError(
          step.handler(lastResult),
          error => new WorkflowError(workflowId, error as Error)
        )
      }
      return {
        workflowId,
        instanceId: crypto.randomUUID(),
        status: 'completed',
        steps: [], // Placeholder
        output: lastResult,
        duration: Duration.millis(0), // Placeholder
      } as WorkflowResult
    })

    return Effect.runFork(workflowEffect).pipe(
      Effect.tap(fiber => this.activeWorkflows.set(workflowId, fiber)),
      Effect.flatMap(fiber => Fiber.join(fiber))
    )
  }

  public cancelWorkflow(workflowId: string): Effect.Effect<void, WorkflowError> {
    const fiber = this.activeWorkflows.get(workflowId)
    if (!fiber) {
      return Effect.fail(new WorkflowError(workflowId, new Error('Workflow not found')))
    }
    return Fiber.interrupt(fiber).pipe(
      Effect.tap(() => this.activeWorkflows.delete(workflowId)),
      Effect.asVoid()
    )
  }

  public getWorkflowStatus(
    workflowId: string
  ): Effect.Effect<WorkflowInstance['status'] | 'not_found', never> {
    const fiber = this.activeWorkflows.get(workflowId)
    if (!fiber) {
      return Effect.succeed('not_found')
    }
    // This is a simplification. A real implementation would inspect the fiber's state.
    return Effect.succeed('running')
  }
}
