/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  /** Separator between crumbs (default `›`). */
  separator?: string
  className?: string
}

/** Plain breadcrumb string: `root › dir › file`. Last crumb is the leaf. */
export function formatBreadcrumbs(items: BreadcrumbItem[], separator = '›'): string {
  return items.map(item => item.label).join(` ${separator} `)
}

/**
 * Path trail. Ancestors render dim, the current leaf renders bright.
 *
 * @example
 * ```tsx
 * <Breadcrumbs items={[{ label: 'src' }, { label: 'tui' }, { label: 'kit.tsx' }]} />
 * ```
 */
export function Breadcrumbs(props: BreadcrumbsProps): JSX.Element {
  const { theme } = useUITheme()
  const separator = props.separator ?? '›'
  const items = props.items

  if (items.length === 0) return <text className={props.className}>{''}</text>

  return (
    <hstack className={props.className} gap={1}>
      {items.map((item, index) => {
        const last = index === items.length - 1
        return (
          <hstack key={`${index}-${item.label}`} gap={1}>
            <text fg={last ? theme.colors.textBright : theme.colors.textDim}>{item.label}</text>
            {!last ? <text fg={theme.colors.textDim}>{separator}</text> : null}
          </hstack>
        )
      })}
    </hstack>
  )
}

export const breadcrumbs = (props: BreadcrumbsProps) => <Breadcrumbs {...props} />
