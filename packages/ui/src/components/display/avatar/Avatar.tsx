/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'

export type AvatarSize = 'small' | 'medium' | 'large'

export interface AvatarProps {
  /** Derive initials from a name (`Ada Lovelace` → `AL`). */
  name?: string
  /** Render a single glyph instead of initials. */
  glyph?: string
  size?: AvatarSize
  className?: string
}

/** Initials for a name: first letter of the first two words, uppercased. */
export function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(word => /[a-z0-9]/i.test(word))
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return (words[0]![0]! + words[1]![0]!).toUpperCase()
}

/**
 * Identity mark for a person or entity. Initials by default, glyph on request.
 *
 * @example
 * ```tsx
 * <Avatar name="Ada Lovelace" />
 * ```
 */
export function Avatar(props: AvatarProps): JSX.Element {
  const { theme } = useUITheme()
  const size = props.size ?? 'medium'
  const mark = props.glyph ?? initialsOf(props.name ?? '')
  const wrapped = size === 'small' ? mark : size === 'large' ? `( ${mark} )` : `[${mark}]`
  return (
    <text className={props.className} fg={theme.colors.primary}>
      {wrapped}
    </text>
  )
}

export const avatar = (props: AvatarProps) => <Avatar {...props} />
