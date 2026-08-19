/** @jsxImportSource @tuix/jsx */

import { Effect } from 'effect'
import { toView } from '@tuix/jsx'

/** Render any JSX element to its final string output with a root context. */
export async function renderJsxTree(
  element: unknown,
  context?: { width: number; height: number }
): Promise<string> {
  const view = toView(element as never)
  const out = await Effect.runPromise(view.render(context))
  return typeof out === 'string' ? out : out.content
}
