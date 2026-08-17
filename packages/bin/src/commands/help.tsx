/**
 * TUIX CLI - Help command
 *
 * Interactive help explorer using @tuix/docs.
 */

import { HelpExplorer, extractAppDoc, extractAppDocFromScopes } from '@tuix/docs'
import { $states } from '@tuix/reactive'
import { Effect } from 'effect'
import { scopeManager } from '@tuix/jsx/scope/manager'
import { TuixApp } from '../app'
import { VERSION } from '../version'

export function HelpCommand(): JSX.Element {
  // Seed named model keys at the command root so extractModel/init hydrates
  // HelpExplorer selection without nested-only extract (same keys as explorer).
  $states({
    selectedIndex: 0,
    viewMode: 'list' as 'list' | 'detail',
    selectedCommand: null as null,
  })

  // Prefer scopes registered by TuixApp/Command (populated after root walk in runApp).
  // Fall back to JSX tree scan of TuixApp().
  let docs = {
    name: 'tuix',
    version: VERSION,
    commands: [] as Array<{ name: string; description?: string }>,
    plugins: [] as Array<{ name: string; commands: Array<{ name: string; description?: string }> }>,
  }

  try {
    const scopes = scopeManager.getAllScopes?.() ?? []
    if (scopes.length > 0) {
      docs = extractAppDocFromScopes(scopes, 'tuix', VERSION)
    }
  } catch {
    /* fall through */
  }

  if (docs.commands.length === 0) {
    try {
      docs = Effect.runSync(extractAppDoc(TuixApp, 'tuix', VERSION))
    } catch {
      /* keep empty */
    }
  }

  // Last-resort static catalog so help never paints empty
  if (docs.commands.length === 0) {
    docs = {
      name: 'tuix',
      version: VERSION,
      commands: [
        { name: 'version', description: 'Show TUIX version and system information' },
        { name: 'help', description: 'Interactive help explorer' },
        { name: 'dashboard', description: 'System status dashboard with live metrics' },
        { name: 'themes', description: 'List built-in themes with color and depth swatches' },
        { name: 'themes-preview', description: 'Cycle built-in themes live with arrow keys' },
      ],
      plugins: [],
    }
  }

  return <HelpExplorer docs={docs} showPlugins={true} />
}
;(HelpCommand as { interactive?: boolean }).interactive = true
