/**
 * Benchmark Command - Run performance benchmarks
 */

import { vstack, text, box, bold, dim, green, red, yellow } from '@tuix/view'
import type { Component, Cmd } from '@tuix/core/types'
import { Effect } from 'effect'
import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { BenchmarkResult } from '../../perf/benchmark'

/**
 * Benchmark command props
 */
export interface BenchmarkProps {
  pattern?: string
  iterations?: number
  warmup?: number
}

/**
 * Benchmark model
 */
interface BenchmarkModel {
  props: BenchmarkProps
  files: string[]
  results: BenchmarkResult[]
  currentFile?: string
  status: 'idle' | 'discovering' | 'running' | 'complete' | 'error'
  error?: string
}

/**
 * Benchmark messages
 */
type BenchmarkMsg =
  | { _tag: 'Discover' }
  | { _tag: 'FilesDiscovered'; files: string[] }
  | { _tag: 'Start' }
  | { _tag: 'FileStarted'; file: string }
  | { _tag: 'FileComplete'; file: string; results: BenchmarkResult[] }
  | { _tag: 'Complete'; results: BenchmarkResult[] }
  | { _tag: 'Error'; error: string }

/**
 * Discover benchmark files
 */
function discoverBenchmarkFiles(pattern: string, cwd: string = process.cwd()): string[] {
  const files: string[] = []

  // For now, scan for .bench.ts files
  function scan(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)

        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue
        }

        if (entry.isDirectory()) {
          scan(fullPath)
        } else if (entry.isFile() && /\.bench\.(ts|js)$/.test(entry.name)) {
          files.push(relative(cwd, fullPath))
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  scan(cwd)
  return files.sort()
}

/**
 * Benchmark Component
 */
export const Benchmark: Component<BenchmarkModel, BenchmarkMsg> = {
  init: Effect.gen(function* (_) {
    const args = process.argv.slice(3)
    const pattern = args[0] || '**/*.bench.ts'
    const iterations = parseInt(args[1] || '10')
    const warmup = parseInt(args[2] || '2')

    return [
      {
        props: { pattern, iterations, warmup },
        files: [],
        results: [],
        status: 'idle',
      },
      [discoverFiles(pattern)],
    ]
  }),

  update: (msg, model) =>
    Effect.gen(function* (_) {
      switch (msg._tag) {
        case 'Discover':
          return [{ ...model, status: 'discovering' }, [discoverFiles(model.props.pattern!)]]

        case 'FilesDiscovered':
          if (msg.files.length === 0) {
            return [
              {
                ...model,
                status: 'error',
                error: 'No benchmark files found',
                files: [],
              },
              [],
            ]
          }
          return [
            {
              ...model,
              status: 'idle',
              files: msg.files,
            },
            [{ _tag: 'Start' }],
          ]

        case 'Start':
          if (model.files.length === 0) {
            return [{ ...model, status: 'error', error: 'No files to run' }, []]
          }

          return [
            { ...model, status: 'running' },
            model.files.map(file => runBenchmarkFile(file, model.props)),
          ]

        case 'FileStarted':
          return [{ ...model, currentFile: msg.file }, []]

        case 'FileComplete': {
          const allResults = [...model.results, ...msg.results]
          return [
            {
              ...model,
              results: allResults,
              currentFile: undefined,
            },
            [],
          ]
        }

        case 'Complete':
          return [
            {
              ...model,
              status: 'complete',
              results: msg.results,
            },
            [],
          ]

        case 'Error':
          return [
            {
              ...model,
              status: 'error',
              error: msg.error,
            },
            [],
          ]

        default:
          return [model, []]
      }
    }),

  view: model => {
    const header = box(
      vstack(
        bold(text('🏃 TUIX Benchmark Runner')),
        dim(text(`Pattern: ${model.props.pattern}`)),
        dim(text(`Iterations: ${model.props.iterations}, Warmup: ${model.props.warmup}`))
      )
    )

    let content
    switch (model.status) {
      case 'idle':
        content = dim(text('Ready to run benchmarks...'))
        break

      case 'discovering':
        content = yellow(text('Discovering benchmark files...'))
        break

      case 'running':
        content = vstack(
          yellow(
            text(`Running benchmarks... (${model.results.length}/${model.files.length} complete)`)
          ),
          model.currentFile ? dim(text(`Current: ${model.currentFile}`)) : text('')
        )
        break

      case 'complete':
        if (model.results.length === 0) {
          content = dim(text('No benchmarks run'))
        } else {
          content = vstack(
            green(bold(text('✓ Benchmarks Complete'))),
            text(''),
            ...model.results.map(result =>
              vstack(
                bold(text(result.name)),
                text(`  Runs: ${result.stats.runs}`),
                text(`  Mean: ${result.stats.mean.toFixed(3)}ms`),
                text(`  Median: ${result.stats.median.toFixed(3)}ms`),
                text(`  Min: ${result.stats.min.toFixed(3)}ms`),
                text(`  Max: ${result.stats.max.toFixed(3)}ms`),
                text(`  P95: ${result.stats.p95.toFixed(3)}ms`),
                text(`  P99: ${result.stats.p99.toFixed(3)}ms`),
                text(`  Std Dev: ±${result.stats.stdDev.toFixed(3)}ms`),
                text('')
              )
            )
          )
        }
        break

      case 'error':
        content = red(text(`Error: ${model.error}`))
        break
    }

    return vstack(header, text(''), content)
  },

  subscriptions: model => Effect.succeed([]),
}

/**
 * Discover benchmark files command
 */
function discoverFiles(pattern: string): Cmd<BenchmarkMsg> {
  return Effect.gen(function* (_) {
    const files = discoverBenchmarkFiles(pattern)
    return { _tag: 'FilesDiscovered' as const, files }
  })
}

/**
 * Run a benchmark file
 */
function runBenchmarkFile(file: string, props: BenchmarkProps): Cmd<BenchmarkMsg> {
  return Effect.gen(function* (_) {
    yield* Effect.sync(() => ({ _tag: 'FileStarted' as const, file }))

    try {
      // Import the benchmark file
      const benchmarkModule = yield* Effect.promise(() => import(join(process.cwd(), file)))

      // Run the default export or all exported benchmark functions
      const results: BenchmarkResult[] = []

      if (typeof benchmarkModule.default === 'function') {
        const result = yield* Effect.promise(() => benchmarkModule.default(props))
        results.push(result)
      } else {
        // Run all exported benchmark functions
        for (const [name, fn] of Object.entries(benchmarkModule)) {
          if (typeof fn === 'function' && name !== 'default') {
            const result = yield* Effect.promise(() => (fn as any)(props))
            results.push(result)
          }
        }
      }

      return { _tag: 'FileComplete' as const, file, results }
    } catch (error) {
      return {
        _tag: 'Error' as const,
        error: `Failed to run ${file}: ${error}`,
      }
    }
  })
}

export default Benchmark
