/**
 * Testing Plugin - Provides testing commands for TUI apps
 */

import type { Plugin } from '@tuix/core/types'

/**
 * Testing plugin component
 */
export function Testing(): Plugin {
  return {
    name: 'testing',
    version: '1.0.0',
    description: 'Testing utilities and commands',
    commands: {
      dashboard: () => import('./commands/dashboard'),
      benchmark: () => import('./commands/benchmark'),
      snapshot: () => import('./commands/snapshot'),
      profile: () => import('./commands/profile'),
    },
  }
}

export default Testing
