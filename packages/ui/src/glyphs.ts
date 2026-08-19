/**
 * Standard glyph vocabulary for terminal UI status, navigation, and structure.
 *
 * Provides a consistent symbolic language across all Tuix widgets, avoiding
 * per-widget glyph invention. Use these instead of ad-hoc Unicode characters.
 *
 * @since 1.0.0
 */

// ─── Status Glyphs ────────────────────────────────────────────────────────────

/** Semantic status indicator glyphs (consistent across all widgets). */
export const StatusGlyph = {
  /** Solid circle — active, online, connected, healthy */
  active: '●',
  /** Open circle — inactive, offline, disconnected */
  inactive: '○',
  /** Half-filled circle — transitioning, connecting, partial */
  transitioning: '◐',
  /** Ring-dot circle — selected, current, focused */
  selected: '◉',
  /** Checkmark — success, complete, passed */
  success: '✓',
  /** Cross — error, failed, rejected */
  error: '✗',
  /** Warning triangle — warning, caution */
  warning: '⚠',
  /** Info circle — information, hint */
  info: 'ℹ',
  /** Dash — neutral, skipped, N/A */
  neutral: '–',
  /** Ellipsis — loading, in progress */
  loading: '…',
  /** Pause — paused, suspended */
  paused: '⏸',
  /** Play — running, active process */
  running: '▶',
  /** Stop — stopped, terminated */
  stopped: '■',
} as const

export type StatusGlyphKey = keyof typeof StatusGlyph

// ─── Navigation & Selection Glyphs ───────────────────────────────────────────

/** Glyphs for navigation and selection indicators. */
export const NavGlyph = {
  /** Right-pointing arrow — current item, active selection */
  pointer: '▸',
  /** Right arrow — expanded, open */
  expanded: '▾',
  /** Right-pointing triangle — collapsed, closed */
  collapsed: '▸',
  /** Breadcrumb separator */
  separator: '›',
  /** Tab indicator */
  tab: '·',
  /** Active tab marker */
  tabActive: '●',
  /** Vertical gutter line — continuation, group */
  gutter: '│',
  /** Indent guide */
  indent: '┊',
} as const

// ─── Scroll Indicators ───────────────────────────────────────────────────────

/** Glyphs for scroll position and scrollability. */
export const ScrollGlyph = {
  /** More content above */
  up: '▲',
  /** More content below */
  down: '▼',
  /** More content left */
  left: '◂',
  /** More content right */
  right: '▸',
  /** Scroll track (empty) */
  track: '┃',
  /** Scroll thumb (filled position) */
  thumb: '█',
  /** Scroll track thin */
  trackThin: '│',
  /** Scroll thumb thin */
  thumbThin: '┃',
} as const

// ─── Progress & Density ──────────────────────────────────────────────────────

/** Fractional block characters for sub-cell precision (left-to-right fill). */
export const FractionalBlock = {
  /** Empty (0/8) */
  empty: ' ',
  /** 1/8 block */
  oneEighth: '▏',
  /** 2/8 block */
  twoEighths: '▎',
  /** 3/8 block */
  threeEighths: '▍',
  /** 4/8 block (half) */
  fourEighths: '▌',
  /** 5/8 block */
  fiveEighths: '▋',
  /** 6/8 block */
  sixEighths: '▊',
  /** 7/8 block */
  sevenEighths: '▉',
  /** Full block (8/8) */
  full: '█',
} as const

/** Ordered array of fractional blocks (index 0-8 = fill level). */
export const FRACTIONAL_BLOCKS = [
  ' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█',
] as const

/** Shade characters for density representation. */
export const ShadeBlock = {
  /** Light shade — low density */
  light: '░',
  /** Medium shade — medium density */
  medium: '▒',
  /** Dark shade — high density */
  dark: '▓',
  /** Full block — maximum density */
  full: '█',
} as const

// ─── Border Accents ──────────────────────────────────────────────────────────

/** Special border characters for emphasis/decoration. */
export const BorderAccent = {
  /** Horizontal double line */
  doubleH: '═',
  /** Vertical double line */
  doubleV: '║',
  /** Heavy horizontal */
  heavyH: '━',
  /** Heavy vertical */
  heavyV: '┃',
  /** Rounded top-left */
  roundTL: '╭',
  /** Rounded top-right */
  roundTR: '╮',
  /** Rounded bottom-left */
  roundBL: '╰',
  /** Rounded bottom-right */
  roundBR: '╯',
} as const

// ─── Key Hint Glyphs ─────────────────────────────────────────────────────────

/** Compact key hint glyphs for footer/status bars. */
export const KeyHintGlyph = {
  /** Up/down navigation */
  upDown: '↕',
  /** Left/right navigation */
  leftRight: '↔',
  /** Enter/activate */
  enter: '↵',
  /** Escape/cancel */
  escape: '⎋',
  /** Space bar */
  space: '␣',
  /** Tab key */
  tab: '⇥',
  /** Backspace */
  backspace: '⌫',
  /** Delete */
  delete: '⌦',
} as const
