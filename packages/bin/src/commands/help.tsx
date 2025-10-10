/**
 * TUIX CLI - Help command
 *
 * Interactive help explorer using @tuix/docs.
 */

import { HelpExplorer } from '@tuix/docs'
import { extractAppDoc } from '@tuix/docs'
import { Effect } from 'effect'
import { TuixApp } from '../app'

export function HelpCommand(): JSX.Element {
  // Extract documentation from the app
  const docs = Effect.runSync(
    extractAppDoc(
      TuixApp,
      'tuix',
      '1.0.0-rc.3'
    )
  )

  return (
    <HelpExplorer
      docs={docs}
      showPlugins={true}
    />
  )
}
