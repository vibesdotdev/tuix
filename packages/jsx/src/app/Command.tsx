/**
 * Command Component
 *
 * High-level component that creates a command scope for CLI commands
 */

import { Scope } from '../scope/components'
import type { JSX } from '../jsx-runtime'
import type { ArgDef, FlagDef } from '../scope/types'

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
    children,
    defaultContent,
    layout,
    id,
    path,
  } = props

  // If component is provided, use it as the handler
  const effectiveHandler = component || handler

  // Merge hidden into metadata if provided
  const commandMetadata = {
    ...metadata,
    ...(hidden && { hidden }),
    ...(component && { component }),
  }

  // If component is provided and no children, render the component as default content
  // We need to defer calling component() until render time (when args are available)
  // Wrap component in lifecycle context so $effect and other runes work
  const effectiveDefaultContent = defaultContent || (component ? {
    render: () => {
      // Import withLifecycle at the top if not already imported
      const { withLifecycle } = require('@tuix/reactive/jsx-lifecycle')
      const wrappedComponent = withLifecycle(component)
      const result = wrappedComponent({})
      return result.render()
    },
    width: 0,
    height: 0,
  } as JSX.Element : undefined)

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
