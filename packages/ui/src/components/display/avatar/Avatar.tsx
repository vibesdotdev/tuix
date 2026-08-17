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

/** Deterministic 31-bit hash of a string (FNV-1a). */
function hashOf(name: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return Math.abs(hash)
}

/**
 * Stable theme accent for a name — same name, same color, every paint.
 * Picks from the palette by name hash so identities are distinguishable
 * without inventing colors outside the theme.
 */
export function avatarAccent(name: string, palette: readonly string[]): string {
  if (palette.length === 0) throw new Error('avatarAccent requires a non-empty palette')
  return palette[hashOf(name) % palette.length]!
}

/**
 * Identity mark for a person or entity. Initials by default, glyph on
 * request. The accent is deterministic per name, drawn from theme colors.
 *
 * @example
 * ```tsx
 * <Avatar name="Ada Lovelace" />
 * ```
 */
export function Avatar(props: AvatarProps): JSX.Element {
  const { theme } = useUITheme()
  const size = props.size ?? 'medium'
  const name = props.name ?? ''
  const mark = props.glyph ?? initialsOf(name)
  const wrapped = size === 'small' ? mark : size === 'large' ? `( ${mark} )` : `[${mark}]`
  const palette = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.tertiary,
    theme.colors.info,
    theme.colors.warning,
  ]
  const accent = name ? avatarAccent(name, palette) : theme.colors.primary

  return (
    <text className={props.className} fg={accent}>
      {wrapped}
    </text>
  )
}

export const avatar = (props: AvatarProps) => <Avatar {...props} />
