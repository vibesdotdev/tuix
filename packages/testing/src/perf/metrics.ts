/**
 * Performance Metrics - Collect and report performance data
 */

/**
 * Performance metrics for a single run
 */
export interface PerformanceMetrics {
  /**
   * Total duration in milliseconds
   */
  duration: number

  /**
   * Frames rendered (if applicable)
   */
  frames?: number

  /**
   * Frames per second (calculated)
   */
  fps?: number

  /**
   * Average frame time in milliseconds
   */
  avgFrameTime?: number

  /**
   * Min frame time in milliseconds
   */
  minFrameTime?: number

  /**
   * Max frame time in milliseconds
   */
  maxFrameTime?: number

  /**
   * Memory used in bytes (if available)
   */
  memoryUsed?: number

  /**
   * Peak memory in bytes (if available)
   */
  peakMemory?: number

  /**
   * Custom metrics
   */
  custom?: Record<string, number>
}

/**
 * Performance statistics across multiple runs
 */
export interface PerformanceStats {
  /**
   * Number of runs
   */
  runs: number

  /**
   * Mean duration
   */
  mean: number

  /**
   * Median duration
   */
  median: number

  /**
   * Minimum duration
   */
  min: number

  /**
   * Maximum duration
   */
  max: number

  /**
   * Standard deviation
   */
  stdDev: number

  /**
   * Variance
   */
  variance: number

  /**
   * 95th percentile
   */
  p95: number

  /**
   * 99th percentile
   */
  p99: number

  /**
   * Individual metrics
   */
  metrics: PerformanceMetrics[]
}

/**
 * Calculate statistics from multiple performance metrics
 */
export function calculateStats(metrics: PerformanceMetrics[]): PerformanceStats {
  if (metrics.length === 0) {
    return {
      runs: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      variance: 0,
      p95: 0,
      p99: 0,
      metrics: [],
    }
  }

  const durations = metrics.map(m => m.duration).sort((a, b) => a - b)
  const sum = durations.reduce((a, b) => a + b, 0)
  const mean = sum / durations.length

  // Calculate variance and standard deviation
  const variance = durations.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / durations.length
  const stdDev = Math.sqrt(variance)

  // Calculate percentiles
  const p95Index = Math.ceil(durations.length * 0.95) - 1
  const p99Index = Math.ceil(durations.length * 0.99) - 1

  return {
    runs: metrics.length,
    mean,
    median: durations[Math.floor(durations.length / 2)],
    min: durations[0],
    max: durations[durations.length - 1],
    stdDev,
    variance,
    p95: durations[p95Index],
    p99: durations[p99Index],
    metrics,
  }
}

/**
 * Format performance metrics for display
 */
export function formatMetrics(metrics: PerformanceMetrics): string {
  const lines: string[] = []

  lines.push(`Duration: ${metrics.duration.toFixed(2)}ms`)

  if (metrics.frames !== undefined) {
    lines.push(`Frames: ${metrics.frames}`)
  }

  if (metrics.fps !== undefined) {
    lines.push(`FPS: ${metrics.fps.toFixed(2)}`)
  }

  if (metrics.avgFrameTime !== undefined) {
    lines.push(`Avg Frame Time: ${metrics.avgFrameTime.toFixed(2)}ms`)
  }

  if (metrics.minFrameTime !== undefined) {
    lines.push(`Min Frame Time: ${metrics.minFrameTime.toFixed(2)}ms`)
  }

  if (metrics.maxFrameTime !== undefined) {
    lines.push(`Max Frame Time: ${metrics.maxFrameTime.toFixed(2)}ms`)
  }

  if (metrics.memoryUsed !== undefined) {
    lines.push(`Memory: ${formatBytes(metrics.memoryUsed)}`)
  }

  if (metrics.peakMemory !== undefined) {
    lines.push(`Peak Memory: ${formatBytes(metrics.peakMemory)}`)
  }

  if (metrics.custom) {
    Object.entries(metrics.custom).forEach(([key, value]) => {
      lines.push(`${key}: ${value}`)
    })
  }

  return lines.join('\n')
}

/**
 * Format performance statistics for display
 */
export function formatStats(stats: PerformanceStats): string {
  const lines: string[] = []

  lines.push(`Runs: ${stats.runs}`)
  lines.push(`Mean: ${stats.mean.toFixed(2)}ms`)
  lines.push(`Median: ${stats.median.toFixed(2)}ms`)
  lines.push(`Min: ${stats.min.toFixed(2)}ms`)
  lines.push(`Max: ${stats.max.toFixed(2)}ms`)
  lines.push(`Std Dev: ${stats.stdDev.toFixed(2)}ms`)
  lines.push(`P95: ${stats.p95.toFixed(2)}ms`)
  lines.push(`P99: ${stats.p99.toFixed(2)}ms`)

  return lines.join('\n')
}

/**
 * Format bytes as human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Compare two performance metrics
 */
export function compareMetrics(
  baseline: PerformanceMetrics,
  current: PerformanceMetrics
): {
  durationChange: number
  durationChangePercent: number
  fpsChange?: number
  fpsChangePercent?: number
  memoryChange?: number
  memoryChangePercent?: number
} {
  const result: ReturnType<typeof compareMetrics> = {
    durationChange: current.duration - baseline.duration,
    durationChangePercent: ((current.duration - baseline.duration) / baseline.duration) * 100,
  }

  if (baseline.fps !== undefined && current.fps !== undefined) {
    result.fpsChange = current.fps - baseline.fps
    result.fpsChangePercent = ((current.fps - baseline.fps) / baseline.fps) * 100
  }

  if (baseline.memoryUsed !== undefined && current.memoryUsed !== undefined) {
    result.memoryChange = current.memoryUsed - baseline.memoryUsed
    result.memoryChangePercent = ((current.memoryUsed - baseline.memoryUsed) / baseline.memoryUsed) * 100
  }

  return result
}

/**
 * Check if performance metrics meet threshold
 */
export function meetsThreshold(
  metrics: PerformanceMetrics,
  thresholds: {
    maxDuration?: number
    minFps?: number
    maxMemory?: number
  }
): { pass: boolean; failures: string[] } {
  const failures: string[] = []

  if (thresholds.maxDuration !== undefined && metrics.duration > thresholds.maxDuration) {
    failures.push(`Duration ${metrics.duration.toFixed(2)}ms exceeds threshold ${thresholds.maxDuration}ms`)
  }

  if (thresholds.minFps !== undefined && metrics.fps !== undefined && metrics.fps < thresholds.minFps) {
    failures.push(`FPS ${metrics.fps.toFixed(2)} below threshold ${thresholds.minFps}`)
  }

  if (
    thresholds.maxMemory !== undefined &&
    metrics.memoryUsed !== undefined &&
    metrics.memoryUsed > thresholds.maxMemory
  ) {
    failures.push(`Memory ${formatBytes(metrics.memoryUsed)} exceeds threshold ${formatBytes(thresholds.maxMemory)}`)
  }

  return {
    pass: failures.length === 0,
    failures,
  }
}
