/**
 * User Interface Module
 *
 * This module provides the complete UI system for building terminal applications
 * with Tuix. It includes components, patterns, themes, and utilities for creating
 * rich interactive user interfaces in the terminal.
 *
 * @example
 * ```typescript
 * import { components } from 'tuix/ui'
 *
 * const { Button, Modal, Table } = components
 * ```
 */

// Core UI Components
export * as components from './components/index.js'
export * from './components/index.js'

// Form Validation
export * as validation from './validation/index.js'
export * from './validation/index.js'

// Re-export commonly used components at the top level for convenience
export { Button, ButtonGroup } from './components/forms/button/index.js'
export { Input, TextInput } from './components/forms/text-input/index.js'
export { Textarea } from './components/forms/textarea/index.js'
export { Editor } from './components/forms/editor/index.js'
export { Modal } from './components/feedback/modal/index.js'
export { Table } from './components/data/table/index.js'
export { FileTree } from './components/data/file-tree/index.js'
export { Text } from './components/display/text/index.js'
export { Card } from './components/display/card/index.js'
export { Mark } from './components/display/mark/index.js'
export { Box } from './components/layout/box/index.js'
export { Flex } from './components/layout/flex/index.js'
export { Select } from './components/forms/select/index.js'
export { CommandPalette } from './components/navigation/command-palette/index.js'
export { Checkbox } from './components/forms/checkbox/index.js'
export { Radio } from './components/forms/radio/index.js'
export { Confirm } from './components/forms/confirm/index.js'
export { Form } from './components/forms/form/index.js'

// New modern components
export { Panel } from './components/layout/panel/index.js'
export { Header } from './components/display/header/index.js'
export { Badge } from './components/display/badge/index.js'
export { StatusIndicator } from './components/display/status-indicator/index.js'
export { Divider } from './components/display/divider/index.js'
export { ProgressBar } from './components/feedback/progress-bar/index.js'
export { Kbd, KbdHint } from './components/display/kbd/index.js'
export { Avatar } from './components/display/avatar/index.js'
export { Accordion } from './components/display/accordion/index.js'
export { Breadcrumbs } from './components/navigation/breadcrumbs/index.js'
export { Skeleton, SkeletonText } from './components/feedback/skeleton/index.js'
export { Alert } from './components/feedback/alert/index.js'
export { Sparkline, sparklineBars, sparklineBraille } from './components/data/sparkline/index.js'
export { ToastViewport, createToastStore } from './components/feedback/toast/index.js'

// Layout patterns
export { StaticLayout } from './components/layout/static-layout/StaticLayout.js'
export { InteractiveLayout } from './components/layout/interactive-layout/InteractiveLayout.js'
export { Help } from './components/navigation/help/index.js'
export { LargeText } from './components/display/large-text/index.js'
export { Wordmark, wordmark, wordmarkRows } from './components/display/wordmark/index.js'
export { Viewport } from './components/layout/viewport/index.js'

// Theme utilities
export * from './theme/index.js'
