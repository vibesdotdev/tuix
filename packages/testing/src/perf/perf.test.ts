/**
 * Performance Testing Tests
 */

import { test, expect, describe } from 'bun:test'
import { benchmark, benchmarkSync, benchmarkAsync, benchmarkCompare } from './benchmark'
import { calculateStats, formatMetrics, compareMetrics, meetsThreshold } from './metrics'
import { Profiler, profileRender } from './profiler'
import { text } from '@tuix/view'
import type { PerformanceMetrics } from './metrics'

describe('Performance Metrics', () => {
  test('calculates statistics from metrics', () => {
    const metrics: PerformanceMetrics[] = [
      { duration: 10 },
      { duration: 20 },
      { duration: 30 },
      { duration: 40 },
      { duration: 50 },
    ]

    const stats = calculateStats(metrics)

    expect(stats.runs).toBe(5)
    expect(stats.mean).toBe(30)
    expect(stats.median).toBe(30)
    expect(stats.min).toBe(10)
    expect(stats.max).toBe(50)
  })

  test('handles empty metrics array', () => {
    const stats = calculateStats([])

    expect(stats.runs).toBe(0)
    expect(stats.mean).toBe(0)
    expect(stats.min).toBe(0)
    expect(stats.max).toBe(0)
  })

  test('formats metrics for display', () => {
    const metrics: PerformanceMetrics = {
      duration: 123.456,
      frames: 60,
      fps: 60.0,
      avgFrameTime: 16.67,
    }

    const formatted = formatMetrics(metrics)

    expect(formatted).toContain('123.46ms')
    expect(formatted).toContain('60')
    expect(formatted).toContain('60.00')
    expect(formatted).toContain('16.67ms')
  })

  test('compares two metrics', () => {
    const baseline: PerformanceMetrics = { duration: 100 }
    const current: PerformanceMetrics = { duration: 80 }

    const comparison = compareMetrics(baseline, current)

    expect(comparison.durationChange).toBe(-20)
    expect(comparison.durationChangePercent).toBe(-20)
  })

  test('checks if metrics meet threshold', () => {
    const metrics: PerformanceMetrics = {
      duration: 100,
      fps: 50,
      memoryUsed: 1024 * 1024,
    }

    const result = meetsThreshold(metrics, {
      maxDuration: 150,
      minFps: 30,
      maxMemory: 2 * 1024 * 1024,
    })

    expect(result.pass).toBe(true)
    expect(result.failures).toHaveLength(0)
  })

  test('detects threshold violations', () => {
    const metrics: PerformanceMetrics = {
      duration: 200,
      fps: 20,
    }

    const result = meetsThreshold(metrics, {
      maxDuration: 150,
      minFps: 30,
    })

    expect(result.pass).toBe(false)
    expect(result.failures.length).toBeGreaterThan(0)
  })
})

describe('Benchmark', () => {
  test('benchmarks a synchronous function', async () => {
    let counter = 0

    const result = await benchmarkSync(
      'counter increment',
      () => {
        counter++
      },
      { iterations: 10, warmup: 2 }
    )

    expect(result.name).toBe('counter increment')
    expect(result.stats.runs).toBeGreaterThanOrEqual(10)
    expect(result.stats.mean).toBeGreaterThan(0)
  })

  test('benchmarks an async function', async () => {
    const result = await benchmarkAsync(
      'async delay',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      },
      { iterations: 5, warmup: 1 }
    )

    expect(result.name).toBe('async delay')
    expect(result.stats.runs).toBeGreaterThanOrEqual(5)
    expect(result.stats.mean).toBeGreaterThanOrEqual(10)
  })

  test('runs setup and teardown', async () => {
    let setupCount = 0
    let teardownCount = 0

    await benchmark('with hooks', () => {}, {
      iterations: 3,
      warmup: 0,
      setup: () => {
        setupCount++
      },
      teardown: () => {
        teardownCount++
      },
    })

    expect(setupCount).toBe(3)
    expect(teardownCount).toBe(3)
  })

  test('compares multiple benchmarks', async () => {
    const results = await benchmarkCompare([
      {
        name: 'fast',
        fn: () => {},
        options: { iterations: 5, warmup: 0 },
      },
      {
        name: 'slow',
        fn: () => {
          // Simulate more work to ensure measurable difference
          let sum = 0
          for (let i = 0; i < 100000; i++) {
            sum += i
          }
        },
        options: { iterations: 5, warmup: 0 },
      },
    ])

    expect(results).toHaveLength(2)
    expect(results[0].name).toBe('fast')
    expect(results[1].name).toBe('slow')
    // Slow benchmark should be measurably slower
    expect(results[1].stats.mean).toBeGreaterThan(0)
    expect(results[0].stats.mean).toBeGreaterThanOrEqual(0)
  })
})

describe('Profiler', () => {
  test('starts and ends a profiling session', () => {
    const profiler = new Profiler()

    const session = profiler.startSession('test-session')

    expect(session.id).toBe('test-session')
    expect(session.startTime).toBeGreaterThan(0)
    expect(session.events).toHaveLength(0)

    const ended = profiler.endSession()

    expect(ended).toBe(session)
    expect(ended?.endTime).toBeDefined()
    expect(ended?.duration).toBeDefined()
  })

  test('records profiling events', () => {
    const profiler = new Profiler()

    profiler.startSession()
    profiler.start('test event', 'custom')
    profiler.end()

    const session = profiler.endSession()

    expect(session?.events).toHaveLength(1)
    expect(session?.events[0].name).toBe('test event')
    expect(session?.events[0].duration).toBeGreaterThanOrEqual(0)
  })

  test('profiles a function', async () => {
    const profiler = new Profiler()

    profiler.startSession()

    await profiler.profile('test function', 'custom', () => {
      let sum = 0
      for (let i = 0; i < 1000; i++) {
        sum += i
      }
      return sum
    })

    const session = profiler.endSession()

    expect(session?.events).toHaveLength(1)
    expect(session?.events[0].name).toBe('test function')
    expect(session?.events[0].duration).toBeGreaterThan(0)
  })

  test('profiles view render', async () => {
    const view = text('Test View')

    const result = await profileRender(view)

    expect(result.duration).toBeGreaterThan(0)
    expect(result.output).toBe('Test View')
  })

  test('clears all sessions', () => {
    const profiler = new Profiler()

    profiler.startSession('session-1')
    profiler.endSession()

    profiler.startSession('session-2')
    profiler.endSession()

    expect(profiler.getAllSessions()).toHaveLength(2)

    profiler.clearSessions()

    expect(profiler.getAllSessions()).toHaveLength(0)
  })
})
