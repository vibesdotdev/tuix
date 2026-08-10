/** @jsxImportSource @tuix/jsx */

/**
 * Config Plugin Component
 *
 * JSX component that provides configuration management to the app
 */

import { Plugin } from '@tuix/jsx'
import ConfigGet from './commands/get'
import ConfigSet from './commands/set'
import ConfigList from './commands/list'
import ConfigImport from './commands/import'
import ConfigExport from './commands/export'

export interface ConfigProps {
  /** Config file name */
  filename?: string
  /** Config file format */
  format?: 'json' | 'yaml' | 'toml' | 'typescript'
  /** Children components */
  children?: any
}

/**
 * Config Plugin
 *
 * Provides config commands and extends context with config API
 *
 * @example
 * ```tsx
 * <Config filename="myapp.config.json" format="json">
 *   <Command name="serve" component={ServeCommand} />
 * </Config>
 * ```
 */
export default function Config({ filename = 'config.json', format, children }: ConfigProps) {
  const detectedFormat =
    format ||
    (filename.endsWith('.yaml') || filename.endsWith('.yml')
      ? 'yaml'
      : filename.endsWith('.toml')
        ? 'toml'
        : filename.endsWith('.ts')
          ? 'typescript'
          : 'json')

  return (
    <Plugin name="config" description="Configuration management">
      <ConfigGet filename={filename} format={detectedFormat} />
      <ConfigSet filename={filename} format={detectedFormat} />
      <ConfigList filename={filename} format={detectedFormat} />
      <ConfigImport filename={filename} format={detectedFormat} />
      <ConfigExport filename={filename} format={detectedFormat} />
      {children}
    </Plugin>
  )
}
