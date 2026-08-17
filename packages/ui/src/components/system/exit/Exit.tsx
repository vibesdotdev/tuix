/**
 * Exit Component
 *
 * Allows explicit control over when and how to exit the application
 */

import { Effect } from 'effect'
import { text, vstack } from '@tuix/view/primitives/view'
import type { View } from '@tuix/core/types'
import { Interactive } from '@tuix/runtime/interactive'

export interface ExitProps {
  code?: number
  message?: string | View
  children?: string | View
  delay?: number
}

/**
 * Exit component that signals the app to exit.
 *
 * The exit is deferred to the next macrotask so the current render walk
 * (including runApp's scope-registration pass) finishes and any exit
 * message actually paints before the process goes away.
 */
export function ExitComponent(props: ExitProps): View {
  const { code = 0, message, children, delay = 0 } = props

  setTimeout(() => {
    Effect.runPromise(
      Effect.gen(function* () {
        const isInteractive = yield* Interactive.isActive

        if (isInteractive) {
          yield* Interactive.exit(code).pipe(
            Effect.catchAll(() => Effect.sync(() => process.exit(code)))
          )
        } else {
          yield* Effect.sync(() => process.exit(code))
        }
      })
    ).catch(() => {
      /* already exiting or effect system unavailable; nothing left to do */
    })
  }, delay)

  // Return the message to display
  if (message || children) {
    const content = message || children
    if (typeof content === 'string') {
      return text(content)
    }
    return content as View
  }

  return text('')
}

export default ExitComponent
