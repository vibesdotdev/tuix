/**
 * Display Components
 *
 * Components for displaying content and information
 */

export * from './text'
export * from './header'
export * from './badge'
export * from './status-indicator'
export * from './divider'
export * from './large-text'
export * from './status-bar'
export * from './card'
export * from './mark'
export * from './kbd'
export * from './avatar'
export * from './accordion'
export * from './perf-hud'

// Re-export commonly used components
export { Text, Heading, Code, Success, Error, Warning, Info } from './text'
export { Header } from './header'
export { Badge } from './badge'
export { StatusIndicator } from './status-indicator'
export { Divider } from './divider'
export { Kbd, KbdHint, formatKeys } from './kbd'
export { Avatar, initialsOf, avatarAccent } from './avatar'
export { Accordion } from './accordion'
export { PerfHud } from './perf-hud'
