/** @jsxImportSource @tuix/jsx */

import type { BindableRune, StateRune } from '@tuix/reactive'
import { readBound } from '../../../bind'

export interface TextareaProps {
  value?: string
  'bind:value'?: BindableRune<string> | StateRune<string>
  placeholder?: string
  rows?: number
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  disabled?: boolean
  className?: string
}

/**
 * Multi-line field. Composes the `<textarea>` intrinsic.
 *
 * @example
 * ```tsx
 * <Textarea bind:value={body} rows={6} placeholder="Notes" />
 * ```
 */
export function Textarea(props: TextareaProps): JSX.Element {
  const raw = String(readBound(props['bind:value']) ?? props.value ?? '')
  const rows = Math.max(1, props.rows ?? (raw ? raw.split('\n').length : 1))
  const lines = raw.length > 0 ? raw.split('\n') : [props.placeholder ?? '']
  const visible = lines.slice(0, rows)

  if (visible.length === 1) {
    return (
      <textarea
        className={props.className}
        value={raw}
        placeholder={props.placeholder}
        bind:value={props['bind:value']}
        disabled={props.disabled}
        onChange={props.disabled ? undefined : props.onChange}
        onSubmit={props.disabled ? undefined : props.onSubmit}
      />
    )
  }

  return (
    <vstack className={props.className}>
      {visible.map((line, index) => (
        <text key={index}>{line}</text>
      ))}
    </vstack>
  )
}
