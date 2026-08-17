/** @jsxImportSource @tuix/jsx */

import { $state } from '@tuix/reactive'
import { useUITheme } from '../../../theme'

export interface AccordionItem {
  title: string
  /** Render the body. */
  children?: unknown
}

export interface AccordionProps {
  items: AccordionItem[]
  /** Index of the item opened on first paint (default none). */
  defaultOpen?: number
  /** Allow multiple open sections at once (default false). */
  multiple?: boolean
  className?: string
}

/**
 * Folded sections. Enter/Space (or click) toggles the section under the
 * cursor; ↑/↓ moves between section headers.
 *
 * @example
 * ```tsx
 * <Accordion items={[{ title: 'Details', children: <text>…</text> }]} />
 * ```
 */
export function Accordion(props: AccordionProps): JSX.Element {
  const { theme } = useUITheme()
  const open = $state<Set<number>>(
    props.defaultOpen !== undefined ? new Set([props.defaultOpen]) : new Set(),
    'accordion-open'
  )
  const cursor = $state(props.defaultOpen ?? 0, 'accordion-cursor')

  function toggle(index: number) {
    const next = new Set(open())
    if (next.has(index)) {
      next.delete(index)
    } else {
      if (!props.multiple) next.clear()
      next.add(index)
    }
    open.$set(next)
  }

  function handleKeys(key: string): boolean {
    const lower = key.toLowerCase()
    if (lower === 'up' || lower === 'k') {
      cursor.$set(Math.max(0, cursor() - 1))
      return true
    }
    if (lower === 'down' || lower === 'j') {
      cursor.$set(Math.min(props.items.length - 1, cursor() + 1))
      return true
    }
    if (lower === 'enter' || lower === ' ') {
      toggle(cursor())
      return true
    }
    return false
  }

  return (
    <vstack className={props.className}>
      {props.items.map((item, index) => {
        const isOpen = open().has(index)
        const isCursor = index === cursor()
        const marker = isOpen ? '▾' : '▸'
        return (
          <interactive
            key={`${index}-${item.title}`}
            focusable
            onClick={() => {
              cursor.$set(index)
              toggle(index)
            }}
            onKeyPress={key => {
              cursor.$set(index)
              handleKeys(key)
            }}
          >
            <vstack>
              <hstack gap={1}>
                <text fg={isCursor ? theme.colors.primary : theme.colors.textDim}>{marker}</text>
                <text fg={isCursor ? theme.colors.textBright : theme.colors.fg}>{item.title}</text>
              </hstack>
              {isOpen ? <text>{item.children}</text> : null}
            </vstack>
          </interactive>
        )
      })}
    </vstack>
  )
}

export const accordion = (props: AccordionProps) => <Accordion {...props} />
