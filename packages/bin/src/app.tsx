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
import { ThemesCommand, ThemesPreviewCommand } from './commands/themes'

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
        interactive
      />

      <Command
        name="dashboard"
        description="System status dashboard with live metrics"
        component={DashboardCommand}
        interactive
      />

      <Command
        name="themes"
        description="List built-in themes with color and depth swatches"
        component={ThemesCommand}
      />

      <Command
        name="themes-preview"
        description="Cycle built-in themes live with arrow keys"
        component={ThemesPreviewCommand}
        interactive
      />

      {/* Fallback: show welcome screen when no command matches */}
      <Fallback component={WelcomeScreen} />
    </>
  )
}
