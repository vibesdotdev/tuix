/**
 * TUIX CLI - Main application
 *
 * Dogfooding our own framework! 🐕
 */

import { Command, Fallback } from '@tuix/jsx'
import { WelcomeScreen } from './commands/welcome'
import { VersionCommand } from './commands/version'
import { HelpCommand } from './commands/help'
import { DashboardCommand } from './commands/dashboard'

/**
 * Main TUIX CLI application
 *
 * Uses the vibes theme and integrates all standard plugins.
 */
export function TuixApp(): JSX.Element {
  return (
    <>
      {/* Core commands */}
      <Command
        name="version"
        description="Show TUIX version and system information"
        component={VersionCommand}
      />

      <Command
        name="help"
        description="Interactive help explorer"
        component={HelpCommand}
      />

      <Command
        name="dashboard"
        description="System status dashboard with live metrics"
        component={DashboardCommand}
      />

      {/* Fallback: show welcome screen when no command matches */}
      <Fallback component={WelcomeScreen} />
    </>
  )
}
