/** @jsxImportSource @tuix/jsx */

/**
 * Process Manager Plugin Component
 *
 * JSX component that provides process management to the app
 */

import { Command } from '@tuix/jsx'
import { PMList, PMStatus } from './commands'

export interface ProcessManagerProps {
  /** TUIX directory for process data */
  tuixDir?: string
  /** Auto-restart failed processes */
  autoRestart?: boolean
  /** Maximum restart attempts */
  maxRestarts?: number
  /** Children components */
  children?: any
}

/**
 * ProcessManager Plugin
 *
 * Provides process management commands
 *
 * @example
 * ```tsx
 * <ProcessManager tuixDir=".tuix" autoRestart maxRestarts={5}>
 *   <Command name="serve" component={ServeCommand} />
 * </ProcessManager>
 * ```
 */
export function ProcessManager({
  tuixDir = '.tuix',
  autoRestart = true,
  maxRestarts = 5,
  children
}: ProcessManagerProps) {
  return (
    <>
      <Command
        name="pm:list"
        description="List all managed processes"
        component={PMList}
      />

      <Command
        name="pm:status"
        description="Show detailed process status"
        component={PMStatus}
      />

      {children}
    </>
  )
}

export default ProcessManager
