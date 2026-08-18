/**
 * ScrollableBox Component
 *
 * Modern, JSX-first scrollable container that wraps content in a themed panel
 * and delegates scrolling to the Viewport component.
 */

import type { JSX } from '@tuix/jsx'
import { style, colors, borderStyle, type Style } from '@tuix/ansi'
import { useUITheme } from '../../../theme'
import { Box } from '../box'
import { Viewport } from '../viewport'

export interface ScrollableBoxProps<T = unknown> {
  readonly title?: string
  readonly items: ReadonlyArray<T>
  readonly renderItem: (item: T, index: number) => JSX.Element
  readonly height?: number
  readonly width?: number
  readonly showScrollbar?: boolean
  readonly showFilter?: boolean
  readonly filterLabel?: string
  readonly filterValue?: string
  readonly filterPlaceholder?: string
  readonly emptyMessage?: string | JSX.Element
  readonly border?: 'single' | 'double' | 'rounded' | 'thick' | 'none'
  readonly showCount?: boolean
  readonly footer?: JSX.Element | string
  readonly itemGap?: number
  readonly className?: string
  readonly contentStyle?: Style
  readonly scrollbarStyle?: Style
}

export function ScrollableBox<T>(props: ScrollableBoxProps<T>): JSX.Element {
  const { theme } = useUITheme()

  const width = props.width ?? 80
  const height = props.height ?? 12
  const showScrollbar = props.showScrollbar ?? true
  const showCount = props.showCount ?? true
  const itemGap = props.itemGap ?? 0

  const borderStyle = resolveBorderStyle(props.border, theme.typography.borderStyle)

  const listChildren =
    props.items.length === 0
      ? [renderEmpty()]
      : props.items.map((item, index) => (
          <box key={String(index)} style={props.contentStyle}>
            {props.renderItem(item, index)}
          </box>
        ))

  return (
    <Box
      border={borderStyle}
      borderColor={theme.colors.border ?? colors.gray}
      padding={1}
      className={props.className}
    >
      <vstack gap={1}>
        {props.title && (
          <text
            style={style()
              .foreground(theme.colors.textBright ?? colors.white)
              .bold()}
          >
            {props.title}
          </text>
        )}

        {showCount && renderCount()}
        {props.showFilter && renderFilter()}

        <Viewport
          width={width}
          height={height}
          showScrollbars={showScrollbar}
          scrollbarStyle={props.scrollbarStyle}
        >
          <vstack gap={itemGap}>{listChildren}</vstack>
        </Viewport>

        {renderFooter()}
      </vstack>
    </Box>
  )

  function renderCount(): JSX.Element | null {
    if (!showCount) return null

    const countStyle = style().foreground(theme.colors.textDim ?? colors.gray)
    return <text style={countStyle}>Items: {props.items.length}</text>
  }

  function renderFilter(): JSX.Element {
    const hasValue = Boolean(props.filterValue && props.filterValue.length > 0)
    const label = props.filterLabel ?? 'Filter'
    const placeholder = props.filterPlaceholder ?? 'Type to filter...'

    return (
      <hstack gap={1} align="middle">
        <text style={style().foreground(theme.colors.info ?? colors.cyan)}>🔍</text>
        <text>{label}:</text>
        {hasValue ? (
          <text style={style().foreground(theme.colors.textBright ?? colors.white)}>
            {props.filterValue}
          </text>
        ) : (
          <text
            style={style()
              .foreground(theme.colors.textDim ?? colors.gray)
              .italic()}
          >
            {placeholder}
          </text>
        )}
      </hstack>
    )
  }

  function renderFooter(): JSX.Element | null {
    if (!props.footer) {
      return null
    }

    if (typeof props.footer === 'string') {
      return (
        <text style={style().foreground(theme.colors.textDim ?? colors.gray)}>{props.footer}</text>
      )
    }

    return props.footer
  }

  function renderEmpty(): JSX.Element {
    if (!props.emptyMessage) {
      return (
        <text style={style().foreground(theme.colors.textDim ?? colors.gray)}>
          No items to display
        </text>
      )
    }

    return typeof props.emptyMessage === 'string' ? (
      <text style={style().foreground(theme.colors.textDim ?? colors.gray)}>
        {props.emptyMessage}
      </text>
    ) : (
      props.emptyMessage
    )
  }
}

function resolveBorderStyle(
  explicit: ScrollableBoxProps['border'],
  themeBorder: 'single' | 'double' | 'rounded' | 'heavy' | 'light'
) {
  if (explicit === 'none') {
    return undefined
  }

  const target = explicit ?? themeBorder

  switch (target) {
    case 'single':
    case 'light':
      return borderStyle('thin')
    case 'double':
      return borderStyle('double')
    case 'rounded':
      return borderStyle('rounded')
    case 'thick':
    case 'heavy':
      return borderStyle('thick')
    default:
      return borderStyle('thin')
  }
}

export interface LogEntry {
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  source: string
  message: string
}

export function ScrollableLogBox(
  props: Omit<ScrollableBoxProps<LogEntry>, 'items' | 'renderItem'> & {
    logs: ReadonlyArray<LogEntry>
    colorize?: boolean
  }
): JSX.Element {
  const colorize = props.colorize ?? true

  const levelColors = {
    debug: colors.gray,
    info: colors.blue,
    warn: colors.yellow,
    error: colors.red,
  } as const

  const levelIcons = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  } as const

  return (
    <ScrollableBox
      {...props}
      items={props.logs}
      renderItem={(log, index) => (
        <vstack gap={0.5} key={String(index)}>
          <hstack gap={1}>
            <text style={style().foreground(colors.gray)}>
              {log.timestamp.toLocaleTimeString()}
            </text>
            <text style={style().foreground(colors.cyan)}>[{log.source}]</text>
            <text
              style={
                colorize
                  ? style()
                      .background(levelColors[log.level])
                      .foreground(colors.black)
                      .padding(0, 1)
                      .bold()
                  : style().bold()
              }
            >
              {levelIcons[log.level]} {log.level.toUpperCase()}
            </text>
          </hstack>
          <text>{log.message}</text>
        </vstack>
      )}
    />
  )
}

export interface ProcessInfo {
  name: string
  status: 'running' | 'stopped' | 'error' | 'starting'
  pid?: number
  uptime?: number
  restarts?: number
}

export function ScrollableProcessList(
  props: Omit<ScrollableBoxProps<ProcessInfo>, 'items' | 'renderItem'> & {
    processes: ReadonlyArray<ProcessInfo>
    detailed?: boolean
  }
): JSX.Element {
  const detailed = props.detailed ?? false

  const statusColors = {
    running: colors.green,
    stopped: colors.gray,
    error: colors.red,
    starting: colors.yellow,
  } as const

  const statusIcons = {
    running: '🟢',
    stopped: '⚪',
    error: '🔴',
    starting: '🟡',
  } as const

  return (
    <ScrollableBox
      {...props}
      items={props.processes}
      renderItem={(proc, index) => (
        <vstack gap={detailed ? 1 : 0} key={String(index)}>
          <hstack gap={1} align="middle">
            <text>{statusIcons[proc.status]}</text>
            <text style={style().foreground(colors.cyan).bold()}>{proc.name}</text>
            {proc.pid !== undefined && (
              <text style={style().foreground(colors.gray)}>PID: {proc.pid}</text>
            )}
            {proc.uptime !== undefined && (
              <text style={style().foreground(colors.blue)}>⏱ {proc.uptime}s</text>
            )}
            {proc.restarts !== undefined && (
              <text style={style().foreground(colors.yellow)}>🔄 {proc.restarts}</text>
            )}
          </hstack>
          {detailed && (
            <text style={style().foreground(statusColors[proc.status]).italic()}>
              Status: {proc.status.toUpperCase()}
            </text>
          )}
        </vstack>
      )}
    />
  )
}
