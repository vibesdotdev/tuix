/**
 * Performance Profiler - Profile component rendering and execution
 */

import { Effect } from 'effect'
import type { Component, View } from '@tuix/core/types'

/**
 * Profiling data for a single event
 */
export interface ProfileEvent {
  /**
   * Event name
   */
  name: string

  /**
   * Event type
   */
  type: 'init' | 'update' | 'view' | 'render' | 'subscription' | 'custom'

  /**
   * Start time (performance.now())
   */
  startTime: number

  /**
   * End time (performance.now())
   */
  endTime: number

  /**
   * Duration in milliseconds
   */
  duration: number

  /**
   * Memory before event
   */
  memoryBefore?: number

  /**
   * Memory after event
   */
  memoryAfter?: number

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>
}

/**
 * Profiling session
 */
export interface ProfileSession {
  /**
   * Session ID
   */
  id: string

  /**
   * Session start time
   */
  startTime: number

  /**
   * Session end time
   */
  endTime?: number

  /**
   * All profiling events
   */
  events: ProfileEvent[]

  /**
   * Total duration
   */
  duration?: number
}

/**
 * Profiler class
 */
export class Profiler {
  private sessions = new Map<string, ProfileSession>()
  private currentSession: ProfileSession | null = null
  private eventStack: Array<{ name: string; startTime: number; memoryBefore?: number }> = []

  /**
   * Start a profiling session
   */
  startSession(id?: string): ProfileSession {
    const sessionId = id || `session-${Date.now()}`

    const session: ProfileSession = {
      id: sessionId,
      startTime: performance.now(),
      events: [],
    }

    this.sessions.set(sessionId, session)
    this.currentSession = session

    return session
  }

  /**
   * End current profiling session
   */
  endSession(): ProfileSession | null {
    if (!this.currentSession) {
      return null
    }

    this.currentSession.endTime = performance.now()
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime

    const session = this.currentSession
    this.currentSession = null

    return session
  }

  /**
   * Start a profiling event
   */
  start(name: string, type: ProfileEvent['type'] = 'custom'): void {
    if (!this.currentSession) {
      return
    }

    const startTime = performance.now()
    const memoryBefore = this.getMemoryUsage()

    this.eventStack.push({ name, startTime, memoryBefore })
  }

  /**
   * End current profiling event
   */
  end(metadata?: Record<string, unknown>): void {
    if (!this.currentSession || this.eventStack.length === 0) {
      return
    }

    const endTime = performance.now()
    const memoryAfter = this.getMemoryUsage()
    const event = this.eventStack.pop()!

    this.currentSession.events.push({
      name: event.name,
      type: 'custom',
      startTime: event.startTime,
      endTime,
      duration: endTime - event.startTime,
      memoryBefore: event.memoryBefore,
      memoryAfter,
      metadata,
    })
  }

  /**
   * Profile a function
   */
  async profile<T>(
    name: string,
    type: ProfileEvent['type'],
    fn: () => T | Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.start(name, type)

    try {
      const result = await fn()
      this.end(metadata)
      return result
    } catch (error) {
      this.end({ ...metadata, error: String(error) })
      throw error
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): ProfileSession | null {
    return this.currentSession
  }

  /**
   * Get session by ID
   */
  getSession(id: string): ProfileSession | undefined {
    return this.sessions.get(id)
  }

  /**
   * Get all sessions
   */
  getAllSessions(): ProfileSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Clear all sessions
   */
  clearSessions(): void {
    this.sessions.clear()
    this.currentSession = null
    this.eventStack = []
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    return process.memoryUsage().heapUsed
  }
}

/**
 * Global profiler instance
 */
export const globalProfiler = new Profiler()

/**
 * Profile a component's lifecycle
 */
export async function profileComponent<Model, Msg>(
  component: Component<Model, Msg>,
  options: {
    sessionId?: string
    includeInit?: boolean
    includeUpdates?: Array<Msg>
    includeView?: boolean
  } = {}
): Promise<ProfileSession> {
  const profiler = globalProfiler
  const session = profiler.startSession(options.sessionId)

  try {
    let model: Model
    let cmd: ReadonlyArray<unknown>

    // Profile init
    if (options.includeInit !== false) {
      const initResult = await profiler.profile('component.init', 'init', async () => {
        return await Effect.runPromise(component.init)
      })
      ;[model, cmd] = initResult
    } else {
      ;[model, cmd] = await Effect.runPromise(component.init)
    }

    // Profile updates
    if (options.includeUpdates) {
      for (const msg of options.includeUpdates) {
        const updateResult = await profiler.profile('component.update', 'update', async () => {
          return await Effect.runPromise(component.update(msg, model))
        }, { msg: String(msg) })
        ;[model, cmd] = updateResult
      }
    }

    // Profile view
    if (options.includeView !== false) {
      await profiler.profile('component.view', 'view', async () => {
        const view = await component.view(model)
        return view
      })
    }

    return profiler.endSession()!
  } catch (error) {
    profiler.endSession()
    throw error
  }
}

/**
 * Profile a view render
 */
export async function profileRender(view: View): Promise<{ duration: number; output: string }> {
  const startTime = performance.now()
  const output = await Effect.runPromise(view.render())
  const endTime = performance.now()

  return {
    duration: endTime - startTime,
    output,
  }
}

/**
 * Analyze profiling session for performance issues
 */
export function analyzeSession(session: ProfileSession): {
  totalDuration: number
  eventCount: number
  slowestEvents: ProfileEvent[]
  eventsByType: Record<string, ProfileEvent[]>
  memoryGrowth: number
  warnings: string[]
} {
  const warnings: string[] = []
  const eventsByType: Record<string, ProfileEvent[]> = {}

  // Group events by type
  for (const event of session.events) {
    if (!eventsByType[event.type]) {
      eventsByType[event.type] = []
    }
    eventsByType[event.type].push(event)
  }

  // Find slowest events
  const sortedEvents = [...session.events].sort((a, b) => b.duration - a.duration)
  const slowestEvents = sortedEvents.slice(0, 5)

  // Calculate memory growth
  const firstEvent = session.events[0]
  const lastEvent = session.events[session.events.length - 1]
  const memoryGrowth =
    firstEvent?.memoryBefore && lastEvent?.memoryAfter
      ? lastEvent.memoryAfter - firstEvent.memoryBefore
      : 0

  // Generate warnings
  for (const event of session.events) {
    if (event.duration > 16.67) {
      // Slower than 60fps
      warnings.push(`Event "${event.name}" took ${event.duration.toFixed(2)}ms (>16.67ms)`)
    }
  }

  if (memoryGrowth > 10 * 1024 * 1024) {
    // 10MB growth
    warnings.push(`Memory grew by ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`)
  }

  return {
    totalDuration: session.duration || 0,
    eventCount: session.events.length,
    slowestEvents,
    eventsByType,
    memoryGrowth,
    warnings,
  }
}

/**
 * Format profiling session for display
 */
export function formatSession(session: ProfileSession): string {
  const lines: string[] = []

  lines.push(`Session: ${session.id}`)
  lines.push(`Duration: ${session.duration?.toFixed(2) || 'N/A'}ms`)
  lines.push(`Events: ${session.events.length}`)
  lines.push('')

  // Group events by type
  const eventsByType: Record<string, ProfileEvent[]> = {}
  for (const event of session.events) {
    if (!eventsByType[event.type]) {
      eventsByType[event.type] = []
    }
    eventsByType[event.type].push(event)
  }

  // Show events by type
  for (const [type, events] of Object.entries(eventsByType)) {
    const totalDuration = events.reduce((sum, e) => sum + e.duration, 0)
    lines.push(`${type}: ${events.length} events, ${totalDuration.toFixed(2)}ms total`)

    for (const event of events) {
      lines.push(`  - ${event.name}: ${event.duration.toFixed(2)}ms`)
    }
  }

  return lines.join('\n')
}
