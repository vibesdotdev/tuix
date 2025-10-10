/**
 * Performance Benchmark - Measure and compare performance
 */

import type { PerformanceMetrics, PerformanceStats } from './metrics'
import { calculateStats } from './metrics'

/**
 * Benchmark options
 */
export interface BenchmarkOptions {
  /**
   * Number of times to run the benchmark
   */
  iterations?: number

  /**
   * Number of warmup runs before measuring
   */
  warmup?: number

  /**
   * Minimum duration to run benchmark (in ms)
   */
  minDuration?: number

  /**
   * Maximum duration to run benchmark (in ms)
   */
  maxDuration?: number

  /**
   * Setup function to run before each iteration
   */
  setup?: () => void | Promise<void>

  /**
   * Teardown function to run after each iteration
   */
  teardown?: () => void | Promise<void>

  /**
   * Before all runs
   */
  beforeAll?: () => void | Promise<void>

  /**
   * After all runs
   */
  afterAll?: () => void | Promise<void>
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  /**
   * Benchmark name
   */
  name: string

  /**
   * Performance statistics
   */
  stats: PerformanceStats

  /**
   * Individual metrics
   */
  metrics: PerformanceMetrics[]
}

/**
 * Run a performance benchmark
 */
export async function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 10,
    warmup = 2,
    minDuration = 0,
    maxDuration = 30000,
    setup,
    teardown,
    beforeAll,
    afterAll,
  } = options

  const metrics: PerformanceMetrics[] = []

  // Run beforeAll hook
  if (beforeAll) {
    await beforeAll()
  }

  try {
    // Warmup runs
    for (let i = 0; i < warmup; i++) {
      if (setup) await setup()
      await fn()
      if (teardown) await teardown()
    }

    // Measured runs
    const startTime = performance.now()
    let totalDuration = 0

    for (let i = 0; i < iterations && totalDuration < maxDuration; i++) {
      // Setup
      if (setup) await setup()

      // Measure
      const iterationStart = performance.now()
      const memoryBefore = getMemoryUsage()

      await fn()

      const iterationEnd = performance.now()
      const memoryAfter = getMemoryUsage()

      // Teardown
      if (teardown) await teardown()

      // Record metrics
      const duration = iterationEnd - iterationStart
      totalDuration = iterationEnd - startTime

      metrics.push({
        duration,
        memoryUsed: memoryAfter.used - memoryBefore.used,
        peakMemory: Math.max(memoryAfter.used, memoryBefore.used),
      })

      // Check minimum duration
      if (totalDuration < minDuration && i === iterations - 1) {
        // Need more iterations
        continue
      }
    }

    // Calculate statistics
    const stats = calculateStats(metrics)

    return {
      name,
      stats,
      metrics,
    }
  } finally {
    // Run afterAll hook
    if (afterAll) {
      await afterAll()
    }
  }
}

/**
 * Benchmark a synchronous function
 */
export async function benchmarkSync(
  name: string,
  fn: () => void,
  options?: BenchmarkOptions
): Promise<BenchmarkResult> {
  return benchmark(name, fn, options)
}

/**
 * Benchmark an async function
 */
export async function benchmarkAsync(
  name: string,
  fn: () => Promise<void>,
  options?: BenchmarkOptions
): Promise<BenchmarkResult> {
  return benchmark(name, fn, options)
}

/**
 * Benchmark multiple functions and compare
 */
export async function benchmarkCompare(
  benchmarks: Array<{
    name: string
    fn: () => void | Promise<void>
    options?: BenchmarkOptions
  }>
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = []

  for (const { name, fn, options } of benchmarks) {
    const result = await benchmark(name, fn, options)
    results.push(result)
  }

  return results
}

/**
 * Benchmark a TUI component render
 */
export async function benchmarkRender(
  name: string,
  renderFn: () => Promise<string>,
  options?: BenchmarkOptions
): Promise<BenchmarkResult> {
  let frameCount = 0
  const frameTimes: number[] = []

  const wrappedFn = async () => {
    const frameStart = performance.now()
    await renderFn()
    const frameEnd = performance.now()

    frameCount++
    frameTimes.push(frameEnd - frameStart)
  }

  const result = await benchmark(name, wrappedFn, options)

  // Add frame-specific metrics
  const totalTime = result.stats.mean * result.stats.runs
  const fps = frameCount > 0 ? (frameCount / totalTime) * 1000 : 0

  result.metrics = result.metrics.map((metric, i) => ({
    ...metric,
    frames: 1,
    fps: frameTimes[i] > 0 ? 1000 / frameTimes[i] : 0,
    avgFrameTime: frameTimes[i],
    minFrameTime: frameTimes[i],
    maxFrameTime: frameTimes[i],
  }))

  return result
}

/**
 * Get memory usage (Bun-specific)
 */
function getMemoryUsage(): { used: number; total: number } {
  if (typeof Bun !== 'undefined' && Bun.gc) {
    // Trigger GC for more accurate measurement
    Bun.gc(false)
  }

  const usage = process.memoryUsage()
  return {
    used: usage.heapUsed,
    total: usage.heapTotal,
  }
}

/**
 * Compare two benchmark results
 */
export function compareBenchmarks(
  baseline: BenchmarkResult,
  current: BenchmarkResult
): {
  name: string
  faster: boolean
  speedup: number
  percentDiff: number
} {
  const baselineMean = baseline.stats.mean
  const currentMean = current.stats.mean

  const speedup = baselineMean / currentMean
  const percentDiff = ((currentMean - baselineMean) / baselineMean) * 100

  return {
    name: current.name,
    faster: currentMean < baselineMean,
    speedup,
    percentDiff,
  }
}

/**
 * Format benchmark results for display
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  const lines: string[] = []

  lines.push(`Benchmark: ${result.name}`)
  lines.push(`Runs: ${result.stats.runs}`)
  lines.push(`Mean: ${result.stats.mean.toFixed(2)}ms`)
  lines.push(`Median: ${result.stats.median.toFixed(2)}ms`)
  lines.push(`Min: ${result.stats.min.toFixed(2)}ms`)
  lines.push(`Max: ${result.stats.max.toFixed(2)}ms`)
  lines.push(`Std Dev: ${result.stats.stdDev.toFixed(2)}ms`)
  lines.push(`P95: ${result.stats.p95.toFixed(2)}ms`)
  lines.push(`P99: ${result.stats.p99.toFixed(2)}ms`)

  return lines.join('\n')
}
