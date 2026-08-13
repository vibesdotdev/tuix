/** @jsxImportSource @tuix/jsx */

import type { BindableRune, StateRune } from '@tuix/reactive'
import { readBound } from '../../../bind'
import { Input } from '../../forms/text-input/TextInput'
import { Modal } from '../../feedback/modal/Modal'

export interface CommandItem {
  id: string
  label: string
  hint?: string
  group?: string
}

export interface CommandPaletteProps {
  open: boolean
  items: CommandItem[]
  query?: string
  'bind:query'?: BindableRune<string> | StateRune<string>
  title?: string
  selected?: string
  onPick: (item: CommandItem) => void
  onClose: () => void
  className?: string
}

function matches(item: CommandItem, query: string): boolean {
  if (!query) return true
  const hay = `${item.label} ${item.id} ${item.group ?? ''}`.toLowerCase()
  return hay.includes(query)
}

/**
 * Overlay finder: filter a list, pick one, close.
 *
 * @example
 * ```tsx
 * <CommandPalette open={open} items={items} onPick={run} onClose={close} />
 * ```
 */
export function CommandPalette(props: CommandPaletteProps): JSX.Element | null {
  const query = String(readBound(props['bind:query']) ?? props.query ?? '')
    .trim()
    .toLowerCase()
  const items = props.items.filter(item => matches(item, query))

  return (
    <Modal
      open={props.open}
      title={props.title ?? 'Command'}
      onClose={props.onClose}
      showCloseButton
      className={props.className}
    >
      <vstack>
        <Input
          value={query}
          placeholder="Type a command…"
          bind:value={props['bind:query']}
          focused
        />
        {items.length === 0 ? (
          <text>No results</text>
        ) : (
          items.map(item => {
            const cursor = item.id === props.selected ? '> ' : '  '
            const hint = item.hint ? `  ${item.hint}` : ''
            return (
              <interactive
                key={item.id}
                focusable
                onClick={() => props.onPick(item)}
                onKeyPress={key => key === 'Enter' && props.onPick(item)}
              >
                <text>{`${cursor}${item.label}${hint}`}</text>
              </interactive>
            )
          })
        )}
      </vstack>
    </Modal>
  )
}
