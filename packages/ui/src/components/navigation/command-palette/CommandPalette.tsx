/** @jsxImportSource @tuix/jsx */

import { $state } from '@tuix/reactive'
import type { BindableRune, StateRune } from '@tuix/reactive'
import { readBound } from '../../../bind'
import { useUITheme } from '../../../theme'
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
  /** Legacy caller-driven selection id. Arrow keys drive the internal cursor. */
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

function step(index: number, delta: number, length: number): number {
  if (length === 0) return -1
  return (index + delta + length) % length
}

/**
 * Overlay finder: filter a list, pick one, close.
 *
 * ↑/↓ (or ctrl+n/ctrl+p) move the cursor, Enter picks, Esc closes.
 * Typing refilters; the cursor clamps to the filtered list.
 *
 * @example
 * ```tsx
 * <CommandPalette open={open} items={items} onPick={run} onClose={close} />
 * ```
 */
export function CommandPalette(props: CommandPaletteProps): JSX.Element | null {
  const { theme } = useUITheme()
  const cursor = $state(0, 'palette-cursor')

  const query = String(readBound(props['bind:query']) ?? props.query ?? '')
    .trim()
    .toLowerCase()
  const items = props.items.filter(item => matches(item, query))

  function move(delta: number) {
    cursor.$set(step(cursor(), delta, items.length))
  }

  function handleListKeys(key: string) {
    const lower = key.toLowerCase()
    if (lower === 'up' || lower === 'ctrl+p') {
      move(-1)
      return true
    }
    if (lower === 'down' || lower === 'ctrl+n') {
      move(1)
      return true
    }
    if (lower === 'enter') {
      const item = items[cursor()]
      if (item) props.onPick(item)
      return true
    }
    return false
  }

  const activeIndex = (() => {
    if (cursor() >= 0 && cursor() < items.length) return cursor()
    const legacy = props.selected ? items.findIndex(item => item.id === props.selected) : -1
    return legacy >= 0 ? legacy : -1
  })()

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
          items.map((item, index) => {
            const active = index === activeIndex
            const cursorMark = active ? '> ' : '  '
            const hint = item.hint ? `  ${item.hint}` : ''
            return (
              <interactive
                key={item.id}
                focusable
                onClick={() => props.onPick(item)}
                onKeyPress={key => {
                  if (key === 'Enter') {
                    props.onPick(item)
                    return
                  }
                  handleListKeys(key)
                }}
              >
                <text fg={active ? theme.colors.primary : undefined}>
                  {`${cursorMark}${item.label}${hint}`}
                </text>
              </interactive>
            )
          })
        )}
        {items.length > 1 ? (
          <text fg={theme.colors.textDim}>{'[↑/↓] select  [enter] run  [esc] close'}</text>
        ) : null}
      </vstack>
    </Modal>
  )
}
