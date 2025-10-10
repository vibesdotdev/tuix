/**
 * Profile Command - Profile component performance
 */

import { vstack, text, box, bold, dim, green, red, yellow } from '@tuix/view'
import type { Component, Cmd } from '@tuix/core/types'
import { Effect } from 'effect'
import { join } from 'node:path'
import { profileComponent, analyzeSession, formatSession, type ProfileSession } from '../../perf/profiler'
import { writeFileSync } from 'node:fs'

/**
 * Profile command props
 */
export interface ProfileProps {
  component?: string
  duration?: number
  output?: string
}

/**
 * Profile model
 */
interface ProfileModel {
  props: ProfileProps
  session: ProfileSession | null
  status: 'idle' | 'loading' | 'profiling' | 'complete' | 'error'
  error?: string
}

/**
 * Profile messages
 */
type ProfileMsg =
  | { _tag: 'Load' }
  | { _tag: 'Start' }
  | { _tag: 'Complete'; session: ProfileSession }
  | { _tag: 'Error'; error: string }

/**
 * Profile Component
 */
export const Profile: Component<ProfileModel, ProfileMsg> = {
  init: Effect.gen(function* (_) {
    const args = process.argv.slice(3)
    const component = args[0]
    const duration = parseInt(args[1] || '5000')
    const output = args[2]

    if (!component) {
      return [
        {
          props: { duration, output },
          session: null,
          status: 'error',
          error: 'Component path is required. Usage: tuix test profile <component-path>',
        },
        [],
      ]
    }

    return [
      {
        props: { component, duration, output },
        session: null,
        status: 'idle',
      },
      [{ _tag: 'Start' }],
    ]
  }),

  update: (msg, model) =>
    Effect.gen(function* (_) {
      switch (msg._tag) {
        case 'Load':
          return [{ ...model, status: 'loading' }, [{ _tag: 'Start' }]]

        case 'Start':
          if (!model.props.component) {
            return [
              {
                ...model,
                status: 'error',
                error: 'No component specified',
              },
              [],
            ]
          }

          return [
            { ...model, status: 'profiling' },
            [runProfile(model.props)],
          ]

        case 'Complete':
          // Save to file if output path specified
          if (model.props.output) {
            try {
              const formatted = formatSession(msg.session)
              writeFileSync(model.props.output, formatted, 'utf-8')
            } catch (error) {
              // Continue even if file save fails
            }
          }

          return [
            {
              ...model,
              status: 'complete',
              session: msg.session,
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
        bold(text('📊 TUIX Performance Profiler')),
        model.props.component ? dim(text(`Component: ${model.props.component}`)) : text(''),
        dim(text(`Duration: ${model.props.duration}ms`))
      )
    )

    let content
    switch (model.status) {
      case 'idle':
        content = dim(text('Ready to profile...'))
        break

      case 'loading':
        content = yellow(text('Loading component...'))
        break

      case 'profiling':
        content = yellow(text('Profiling component performance...'))
        break

      case 'complete':
        if (model.session) {
          const analysis = analyzeSession(model.session)

          const slowEvents = analysis.slowestEvents.slice(0, 10)

          content = vstack(
            green(bold(text('✓ Profile Complete'))),
            text(''),
            bold(text('Overview:')),
            text(`  Duration: ${analysis.totalDuration.toFixed(2)}ms`),
            text(`  Events: ${analysis.eventCount}`),
            text(`  Memory Growth: ${formatBytes(analysis.memoryGrowth)}`),
            text(''),
            bold(text('Slowest Events:')),
            ...slowEvents.map(event =>
              text(`  ${event.name}: ${event.duration.toFixed(2)}ms`)
            ),
            text(''),
            analysis.warnings.length > 0 ? yellow(bold(text('⚠ Performance Warnings:'))) : text(''),
            ...analysis.warnings.map(warning => yellow(text(`  ${warning}`))),
            model.props.output ? text('') : text(''),
            model.props.output
              ? green(text(`✓ Profile saved to ${model.props.output}`))
              : dim(text('Tip: Add output path to save profile: tuix test profile <component> <duration> <output-path>'))
          )
        } else {
          content = dim(text('No profile data'))
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
 * Run profiling on a component
 */
function runProfile(props: ProfileProps): Cmd<ProfileMsg> {
  return Effect.gen(function* (_) {
    try {
      const componentPath = join(process.cwd(), props.component!)

      // Import the component
      const componentModule = yield* Effect.promise(() => import(componentPath))
      const component = componentModule.default || componentModule

      if (!component || typeof component !== 'object') {
        return {
          _tag: 'Error' as const,
          error: 'Component must export a Component object',
        }
      }

      // Profile the component
      const session = yield* Effect.promise(() => profileComponent(component, {
        includeInit: true,
        includeUpdates: [],
        includeView: true,
      }))

      return { _tag: 'Complete' as const, session }
    } catch (error) {
      return {
        _tag: 'Error' as const,
        error: `Failed to profile component: ${error}`,
      }
    }
  })
}

/**
 * Format bytes as human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 0) return `-${formatBytes(-bytes)}`

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export default Profile
