/**
 * Plugin Component
 *
 * High-level component that creates a plugin scope for organizing related commands
 */

import { Scope, type ScopeProps } from './Scope'
import { currentScopeStore } from '../stores'
import type { JSX } from '@tuix/jsx'

export interface PluginProps {
  /** Plugin name (used in command paths) */
  name: string

  /** Plugin description for help text */
  description?: string

  /** Plugin version */
  version?: string

  /** Hide from help output */
  hidden?: boolean

  /** Plugin aliases */
  aliases?: string[]

  /** Additional metadata */
  metadata?: Record<string, unknown>

  /** Child commands and nested plugins */
  children?: JSX.Element | JSX.Element[]

  /** Default content when no command matches */
  defaultContent?: JSX.Element

  /** Layout wrapper for plugin content */
  layout?: (content: JSX.Element) => JSX.Element

  /** Scope ID override (auto-generated if not provided) */
  id?: string

  /** Explicit path override (computed from parent if not provided) */
  path?: string[]

  /** Initialization hook */
  onInit?: () => void | Promise<void>

  /** Cleanup hook */
  onExit?: () => void | Promise<void>
}

/**
 * Plugin component - creates a plugin scope for organizing commands
 *
 * @example
 * ```tsx
 * <Plugin name="dev" description="Development tools">
 *   <Command name="setup" handler={setupHandler} />
 *   <Command name="build" handler={buildHandler} />
 * </Plugin>
 * ```
 */
export function Plugin(props: PluginProps): JSX.Element {
  const {
    name,
    description,
    version,
    hidden,
    aliases,
    metadata = {},
    children,
    defaultContent,
    layout,
    id,
    path,
    onInit,
    onExit,
  } = props

  // Merge version into metadata if provided
  const pluginMetadata = {
    ...metadata,
    ...(version && { version }),
    ...(hidden && { hidden }),
    ...(onInit && { onInit }),
    ...(onExit && { onExit }),
  }

  // Create the underlying Scope with plugin-specific defaults
  return (
    <Scope
      id={id}
      type="plugin"
      name={name}
      path={path}
      description={description}
      executable={true}
      aliases={aliases}
      metadata={pluginMetadata}
      defaultContent={defaultContent}
      layout={layout}
    >
      {children}
    </Scope>
  )
}
