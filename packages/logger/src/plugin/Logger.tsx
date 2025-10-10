/** @jsxImportSource @tuix/jsx */

/**
 * Logger Plugin Component
 *
 * JSX component that provides logging functionality to the app
 */

import { Plugin } from '@tuix/jsx'

export interface LoggerProps {
  /** Log level */
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  /** Enable colorized output */
  colorize?: boolean
  /** Show emoji in logs */
  showEmoji?: boolean
  /** Children components */
  children?: any
}

/**
 * Logger Plugin
 *
 * Provides logging services to the application
 *
 * @example
 * ```tsx
 * <Logger level="info" colorize showEmoji>
 *   <Command name="serve" component={ServeCommand} />
 * </Logger>
 * ```
 */
export function Logger({
  level = 'info',
  colorize = true,
  showEmoji = true,
  children
}: LoggerProps) {
  return (
    <Plugin name="logger" description="Application logging">
      {children}
    </Plugin>
  )
}

export default Logger
