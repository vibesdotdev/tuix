/**
 * Command Component
 *
 * High-level component that creates a command scope for CLI commands
 */

import { Effect } from 'effect'
import { Scope, type ScopeProps } from './Scope'
import { currentScopeStore } from '../stores'
import type { JSX } from '@tuix/jsx'
import type { ArgDef, FlagDef } from '../types'

export interface CommandProps {
  /** Command name */
  name: string

  /** Command description for help text */
  description?: string

  /** Command handler function or component */
  handler?: any

  /** Component to render when command is executed */
  component?: () => JSX.Element

  /** Command aliases */
  aliases?: string[]

  /** Hide from help output */
  hidden?: boolean

  /** Arguments definition */
  args?: Record<string, ArgDef>

  /** Flags definition */
  flags?: Record<string, FlagDef>

  /** Additional metadata */
  metadata?: Record<string, unknown>

  /**
   * When true, runApp keeps an interactive MVU loop for this command
   * (fullscreen, no exitAfterRender). Prefer for explorers/dashboards.
   */
  interactive?: boolean

  /** Child elements (args, flags, or content) */
  children?: JSX.Element | JSX.Element[]

  /** Default content when command is executed without rendering */
  defaultContent?: JSX.Element

  /** Layout wrapper for command output */
  layout?: (content: JSX.Element) => JSX.Element

  /** Scope ID override (auto-generated if not provided) */
  id?: string

  /** Explicit path override (computed from parent if not provided) */
  path?: string[]
}

/**
 * Command component - creates a command scope for CLI commands
 *
 * @example
 * ```tsx
 * <Command
 *   name="build"
 *   description="Build the project"
 *   handler={buildHandler}
 * >
 *   <arg name="target" description="Build target" />
 *   <flag name="watch" description="Watch mode" />
 * </Command>
 * ```
 *
 * @example With component prop
 * ```tsx
 * <Command name="hello" component={HelloComponent} />
 * ```
 */
export function Command(props: CommandProps): JSX.Element {
  const {
    name,
    description,
    handler,
    component,
    aliases,
    hidden,
    args,
    flags,
    metadata = {},
    interactive,
    children,
    defaultContent,
    layout,
    id,
    path,
  } = props

  // If component is provided, use it as the handler
  const effectiveHandler = component || handler

  // Mark handler interactive for detectInteractive when Command.interactive
  if (interactive === true && typeof effectiveHandler === 'function') {
    ;(effectiveHandler as { interactive?: boolean }).interactive = true
  }

  // Merge hidden / interactive into metadata for runApp classification
  const commandMetadata = {
    ...metadata,
    ...(hidden && { hidden }),
    ...(component && { component }),
    ...(interactive !== undefined && { interactive }),
  }

  // Defer command component render; convert JSX → View via jsx-runtime
  const effectiveDefaultContent =
    defaultContent ||
    (component
      ? ({
          render: () =>
            Effect.gen(function* () {
              const { render: renderJsx } = yield* Effect.promise(() => import('../../jsx-runtime'))
              const result = component()
              const view =
                result && typeof (result as { render?: unknown }).render === 'function'
                  ? (result as { render: () => Effect.Effect<unknown> })
                  : renderJsx(result as any)
              const rendered = yield* view.render()
              if (typeof rendered === 'string') return rendered
              if (rendered && typeof rendered === 'object' && 'content' in rendered) {
                return (rendered as { content: string }).content
              }
              return String(rendered ?? '')
            }),
          width: 0,
          height: 0,
        } as unknown as JSX.Element)
      : undefined)

  // Create the underlying Scope with command-specific defaults
  return (
    <Scope
      id={id}
      type="command"
      name={name}
      path={path}
      description={description}
      executable={true}
      handler={effectiveHandler}
      aliases={aliases}
      args={args}
      flags={flags}
      metadata={commandMetadata}
      defaultContent={effectiveDefaultContent}
      layout={layout}
    >
      {children}
    </Scope>
  )
}
