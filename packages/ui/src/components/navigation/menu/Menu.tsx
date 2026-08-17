/** @jsxImportSource @tuix/jsx */

import { $state } from '@tuix/reactive'
import { useUITheme } from '../../../theme'

export interface MenuItem {
  id: string
  label: string
  hint?: string
  disabled?: boolean
  separator?: boolean
}

export interface MenuProps {
  items: MenuItem[]
  title?: string
  /** Index of the highlighted item on first paint. */
  defaultIndex?: number
  onPick: (item: MenuItem) => void
  onClose?: () => void
  className?: string
}

function step(index: number, delta: number, pickable: number[]): number {
  if (pickable.length === 0) return index
  let position = pickable.indexOf(index)
  if (position === -1) position = 0
  position = (position + delta + pickable.length) % pickable.length
  return pickable[position]!
}

/**
 * Popup menu. ↑/↓ (or j/k) move over enabled items, Enter picks, Esc
 * closes. Separator rows render a rule and are skipped by the cursor.
 *
 * Render it inside an `<overlay>` for a context-menu feel:
 *
 * @example
 * ```tsx
 * <overlay>
 *   <Menu
 *     title="Session"
 *     items={[
 *       { id: 'rename', label: 'Rename', hint: 'r' },
 *       { id: 'sep1', label: '', separator: true },
 *       { id: 'delete', label: 'Delete', hint: 'D' },
 *     ]}
 *     onPick={run}
 *     onClose={close}
 *   />
 * </overlay>
 * ```
 */
export function Menu(props: MenuProps): JSX.Element {
  const { theme, depth } = useUITheme()
  const cursor = $state(props.defaultIndex ?? 0, 'menu-cursor')

  const pickable = props.items
    .map((item, index) => (item.separator || item.disabled ? -1 : index))
    .filter(index => index >= 0)

  function handleKeys(key: string): boolean {
    const lower = key.toLowerCase()
    if (lower === 'up' || lower === 'k') {
      cursor.$set(step(cursor(), -1, pickable))
      return true
    }
    if (lower === 'down' || lower === 'j') {
      cursor.$set(step(cursor(), 1, pickable))
      return true
    }
    if (lower === 'enter') {
      const item = props.items[cursor()]
      if (item && !item.separator && !item.disabled) props.onPick(item)
      return true
    }
    if (lower === 'escape' || lower === 'esc') {
      props.onClose?.()
      return true
    }
    return false
  }

  return (
    <interactive className={props.className} focusable onKeyPress={handleKeys}>
      <box border="thin" borderColor={theme.colors.border} background={depth.overlay} padding={0}>
        <vstack>
          {props.title ? <text fg={theme.colors.textDim}>{props.title}</text> : null}
          {props.items.map((item, index) => {
            if (item.separator) {
              return (
                <text key={item.id ?? index} fg={theme.colors.borderSubtle}>
                  {'─'.repeat(12)}
                </text>
              )
            }
            const isCursor = index === cursor()
            const mark = isCursor ? '> ' : '  '
            const hint = item.hint ? `  ${item.hint}` : ''
            return (
              <text
                key={item.id}
                fg={
                  isCursor
                    ? theme.colors.primary
                    : item.disabled
                      ? theme.colors.textDim
                      : theme.colors.fg
                }
              >
                {`${mark}${item.label}${hint}`}
              </text>
            )
          })}
        </vstack>
      </box>
    </interactive>
  )
}

export const menu = (props: MenuProps) => <Menu {...props} />
