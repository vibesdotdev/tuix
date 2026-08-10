/**
 * Test Dashboard Command - Interactive test runner
 */

import { vstack, text, box, hstack, bold, dim, green, red, yellow } from '@tuix/view'
import type { Component, Cmd } from '@tuix/core/types'
import { Effect } from 'effect'
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Dashboard model
 */
interface DashboardModel {
  testFiles: string[]
  selectedIndex: number
  testResults: Map<string, TestResult>
  running: boolean
  error?: string
}

/**
 * Test result
 */
interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip' | 'running'
  duration: number
  error?: string
}

/**
 * Dashboard messages
 */
type DashboardMsg =
  | { _tag: 'SelectNext' }
  | { _tag: 'SelectPrev' }
  | { _tag: 'RunTests' }
  | { _tag: 'RunSelected' }
  | { _tag: 'TestComplete'; file: string; result: TestResult }
  | { _tag: 'Quit' }

/**
 * Discover test files in the project
 */
function discoverTestFiles(dir: string = process.cwd()): string[] {
  const testFiles: string[] = []

  function scan(currentDir: string) {
    try {
      const entries = readdirSync(currentDir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name)

        // Skip node_modules and hidden directories
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue
        }

        if (entry.isDirectory()) {
          scan(fullPath)
        } else if (entry.isFile() && /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          testFiles.push(relative(dir, fullPath))
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  scan(dir)
  return testFiles.sort()
}

/**
 * Test Dashboard Component
 */
export const TestDashboard: Component<DashboardModel, DashboardMsg> = {
  init: Effect.gen(function* (_) {
    const testFiles = discoverTestFiles()

    return [
      {
        testFiles,
        selectedIndex: 0,
        testResults: new Map(),
        running: false,
      },
      [],
    ]
  }),

  update: (msg, model) =>
    Effect.gen(function* (_) {
      switch (msg._tag) {
        case 'SelectNext':
          return [
            {
              ...model,
              selectedIndex: Math.min(model.selectedIndex + 1, model.testFiles.length - 1),
            },
            [],
          ]

        case 'SelectPrev':
          return [
            {
              ...model,
              selectedIndex: Math.max(model.selectedIndex - 1, 0),
            },
            [],
          ]

        case 'RunSelected': {
          const file = model.testFiles[model.selectedIndex]
          if (!file) return [model, []]

          // Mark as running
          const newResults = new Map(model.testResults)
          newResults.set(file, {
            name: file,
            status: 'running',
            duration: 0,
          })

          return [{ ...model, running: true, testResults: newResults }, [runTestFile(file)]]
        }

        case 'RunTests':
          return [{ ...model, running: true }, []]

        case 'TestComplete': {
          const newResults = new Map(model.testResults)
          newResults.set(msg.file, msg.result)
          return [{ ...model, testResults: newResults, running: false }, []]
        }

        case 'Quit':
          return [model, []]

        default:
          return [model, []]
      }
    }),

  view: model => {
    const header = box(
      vstack(
        bold(text('🧪 TUIX Test Dashboard')),
        dim(text('Press ↑/↓ to navigate, Enter to run, A to run all, Q to quit'))
      )
    )

    if (model.testFiles.length === 0) {
      return vstack(
        header,
        text(''),
        dim(text('No test files found. Test files should match **/*.test.ts or **/*.spec.ts'))
      )
    }

    const testList = vstack(
      bold(text(`Test Files (${model.testFiles.length}):`)),
      text(''),
      ...model.testFiles.slice(0, 20).map((file, i) => {
        const isSelected = i === model.selectedIndex
        const result = model.testResults.get(file)

        let statusIcon = '○'
        let statusColor = dim

        if (result) {
          switch (result.status) {
            case 'pass':
              statusIcon = '✓'
              statusColor = green
              break
            case 'fail':
              statusIcon = '✗'
              statusColor = red
              break
            case 'running':
              statusIcon = '⟳'
              statusColor = yellow
              break
            case 'skip':
              statusIcon = '○'
              statusColor = dim
              break
          }
        }

        const line = hstack(
          text(isSelected ? '▸ ' : '  '),
          statusColor(text(statusIcon)),
          text(' '),
          text(file),
          result && result.duration > 0 ? dim(text(` (${result.duration}ms)`)) : text('')
        )

        return isSelected ? bold(line) : line
      })
    )

    if (model.testFiles.length > 20) {
      testList.children.push(dim(text(`... and ${model.testFiles.length - 20} more`)))
    }

    const passCount = Array.from(model.testResults.values()).filter(r => r.status === 'pass').length
    const failCount = Array.from(model.testResults.values()).filter(r => r.status === 'fail').length
    const totalCount = model.testResults.size

    const summary =
      totalCount > 0
        ? box(
            vstack(
              bold(text('Summary:')),
              text(''),
              green(text(`✓ Passed: ${passCount}`)),
              failCount > 0 ? red(text(`✗ Failed: ${failCount}`)) : text(''),
              dim(text(`Total: ${totalCount}/${model.testFiles.length}`))
            )
          )
        : text('')

    return vstack(header, text(''), testList, text(''), summary)
  },

  subscriptions: model =>
    Effect.succeed([
      // TODO: Add keyboard subscriptions when input system is integrated
    ]),
}

/**
 * Run a test file and return the result
 */
function runTestFile(file: string): Cmd<DashboardMsg> {
  return Effect.gen(function* (_) {
    const startTime = performance.now()

    try {
      // Run the test file using Bun
      const proc = Bun.spawn(['bun', 'test', file], {
        stdout: 'pipe',
        stderr: 'pipe',
      })

      const exitCode = yield* Effect.promise(() => proc.exited)
      const duration = performance.now() - startTime

      const result: TestResult = {
        name: file,
        status: exitCode === 0 ? 'pass' : 'fail',
        duration: Math.round(duration),
        error: exitCode !== 0 ? 'Test failed' : undefined,
      }

      return { _tag: 'TestComplete' as const, file, result }
    } catch (error) {
      const duration = performance.now() - startTime

      return {
        _tag: 'TestComplete' as const,
        file,
        result: {
          name: file,
          status: 'fail',
          duration: Math.round(duration),
          error: String(error),
        },
      }
    }
  })
}

export default TestDashboard
