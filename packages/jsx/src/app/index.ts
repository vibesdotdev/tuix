/**
 * @tuix/jsx/app - JSX components for CLI application structure
 *
 * This module provides the JSX versions of runtime primitives for building CLI apps.
 *
 * @module jsx/app
 */

export { Command, type CommandProps } from './Command'
export { Plugin, type PluginProps } from './Plugin'
export { Fallback, type FallbackProps } from './Fallback'
// NOTE: runApp is now exported from ./compiler instead
export type { JSXComponent, JSXRunConfig } from './runApp'
