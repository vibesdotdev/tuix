/** @jsxImportSource @tuix/jsx */

import type { BindableRune, StateRune } from '@tuix/reactive'
import { readBound } from '../../../bind'

export interface EditorProps {
  value?: string
  'bind:value'?: BindableRune<string> | StateRune<string>
  language?: string
  placeholder?: string
  rows?: number
  onChange?: (value: string) => void
  className?: string
}

/**
 * Numbered source surface. Composes `<card>` plus line text.
 *
 * @example
 * ```tsx
 * <Editor value={src} language="ts" onChange={setSrc} />
 * ```
 */
export function Editor(props: EditorProps): JSX.Element {
  const raw = String(readBound(props['bind:value']) ?? props.value ?? '')
  const lines = (raw.length > 0 ? raw : props.placeholder ?? '').split('\n')
  const limit = props.rows && props.rows > 0 ? props.rows : lines.length
  const visible = lines.slice(0, limit)
  const gutter = String(Math.max(visible.length, 1)).length

  return (
    <card className={props.className}>
      <vstack>
        {props.language ? <text>{props.language}</text> : null}
        {visible.map((line, index) => (
          <text key={index}>{`${String(index + 1).padStart(gutter, ' ')} │ ${line}`}</text>
        ))}
      </vstack>
    </card>
  )
}
