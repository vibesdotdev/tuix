/**
 * Core Event Bus
 *
 * Foundation-level typed event bus used by modules and runtime integration.
 */

import { Effect } from 'effect'

export interface BaseEvent {
  readonly type: string
  readonly timestamp: Date
  readonly source: string
  readonly id: string
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export type EventHandler<T extends BaseEvent> = (event: T) => Effect.Effect<void, never>

export class EventBus {
  private handlers: Map<string, Set<EventHandler<BaseEvent>>> = new Map()

  publish<T extends BaseEvent>(channel: string, event: T): Effect.Effect<void, never> {
    return Effect.gen(
      function* () {
        const channelHandlers = this.handlers.get(channel)
        if (!channelHandlers) return

        yield* Effect.all(
          Array.from(channelHandlers).map(handler =>
            handler(event).pipe(Effect.catchAll(() => Effect.void))
          )
        )
      }.bind(this)
    )
  }

  emit<T extends BaseEvent>(channel: string, event: T): Effect.Effect<void, never> {
    return this.publish(channel, event)
  }

  subscribe<T extends BaseEvent>(
    channel: string,
    handler: EventHandler<T>
  ): Effect.Effect<() => Effect.Effect<void, never>, never> {
    return Effect.sync(() => {
      let channelHandlers = this.handlers.get(channel)
      if (!channelHandlers) {
        channelHandlers = new Set()
        this.handlers.set(channel, channelHandlers)
      }

      channelHandlers.add(handler as EventHandler<BaseEvent>)

      return () =>
        Effect.sync(() => {
          const handlers = this.handlers.get(channel)
          if (!handlers) return
          handlers.delete(handler as EventHandler<BaseEvent>)
          if (handlers.size === 0) {
            this.handlers.delete(channel)
          }
        })
    })
  }

  shutdown(): Effect.Effect<void, never> {
    return Effect.sync(() => {
      this.handlers.clear()
    })
  }
}

let globalEventBus: EventBus | null = null

export function getGlobalEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus()
  }
  return globalEventBus
}

export function resetGlobalEventBus(): Effect.Effect<void, never> {
  if (!globalEventBus) return Effect.void

  return globalEventBus.shutdown().pipe(
    Effect.tap(() => {
      globalEventBus = null
    })
  )
}
