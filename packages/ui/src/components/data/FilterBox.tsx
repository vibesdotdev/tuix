/**
 * FilterBox Component
 *
 * Reusable filter ribbon with preset chips and search summary.
 * Implemented with JSX primitives so it composes naturally with other @tuix/ui widgets.
 */

import type { JSX } from '@tuix/jsx'
import { style, colors, border } from '@tuix/ansi'
import { useUITheme } from '../../theme'

export interface FilterPreset {
  readonly name: string
  readonly label: string
  readonly icon?: string
  readonly filter: (item: any) => boolean
}

export interface FilterBoxProps {
  readonly title?: string
  readonly presets?: ReadonlyArray<FilterPreset>
  readonly activePreset?: string | null
  readonly searchTerm?: string
  readonly onPresetChange?: (preset: string | null) => void
  readonly onSearchClear?: () => void
  readonly showSearch?: boolean
  readonly searchPlaceholder?: string
  readonly compact?: boolean
  readonly className?: string
}

export function FilterBox(props: FilterBoxProps): JSX.Element {
  const { theme } = useUITheme()
  const presets = props.presets ?? []
  const activePreset = props.activePreset ?? null
  const searchTerm = props.searchTerm ?? ''
  const showSearch = props.showSearch ?? true
  const compact = props.compact ?? false

  const presetChips = presets.length > 0 ? presets.map(preset => renderPresetChip(preset)) : []

  const searchSummary =
    showSearch && (searchTerm.length > 0 || props.searchPlaceholder) ? renderSearchSummary() : null

  const layoutChildren: (JSX.Element | null)[] = [
    props.title ? (
      <text
        style={style()
          .foreground(theme.colors.textBright ?? colors.white)
          .bold()}
      >
        {props.title}
      </text>
    ) : null,

    presets.length > 0 ? (compact ? renderCompactRibbon() : renderPresetSection()) : null,

    searchSummary,
  ]

  return (
    <vstack gap={compact ? 0 : 1} className={props.className} data-component="filter-box">
      {layoutChildren.filter(Boolean)}
    </vstack>
  )

  function renderPresetChip(preset: FilterPreset): JSX.Element {
    const isActive = preset.name === activePreset
    const baseStyle = style()
      .padding(0, 1)
      .border(border.borderStyle('thin'))
      .borderForeground(theme.colors.border ?? colors.gray)

    const activeStyle = isActive
      ? style()
          .background(theme.colors.selection ?? colors.blue)
          .foreground(theme.colors.textBright ?? colors.white)
          .bold()
      : style().foreground(theme.colors.fg ?? colors.white)

    return (
      <interactive key={preset.name} focusable onClick={() => props.onPresetChange?.(preset.name)}>
        <hstack gap={1} style={baseStyle.merge(activeStyle)} align="middle">
          {preset.icon && <text aria-hidden="true">{preset.icon}</text>}
          <text>{preset.label}</text>
        </hstack>
      </interactive>
    )
  }

  function renderPresetSection(): JSX.Element {
    return (
      <vstack gap={1}>
        <text style={style().foreground(theme.colors.textDim ?? colors.gray)}>Quick Filters</text>
        <hstack gap={1} wrap>
          {presetChips}
          {activePreset && (
            <interactive focusable onClick={() => props.onPresetChange?.(null)}>
              <text style={style().foreground(colors.red).padding(0, 1)}>Clear</text>
            </interactive>
          )}
        </hstack>
      </vstack>
    )
  }

  function renderCompactRibbon(): JSX.Element {
    return (
      <hstack gap={1} wrap align="middle">
        {presets.length > 0 && (
          <text style={style().foreground(theme.colors.textDim ?? colors.gray)}>Filter:</text>
        )}
        {presetChips.length > 0 ? presetChips : null}
        {activePreset && (
          <interactive focusable onClick={() => props.onPresetChange?.(null)}>
            <text style={style().foreground(colors.red)}>✕</text>
          </interactive>
        )}
      </hstack>
    )
  }

  function renderSearchSummary(): JSX.Element {
    const textStyle = style().foreground(theme.colors.textDim ?? colors.gray)

    if (searchTerm.length === 0) {
      return <text style={textStyle.italic()}>{props.searchPlaceholder ?? 'Search...'}</text>
    }

    return (
      <hstack gap={1} align="middle">
        <text style={style().foreground(theme.colors.info ?? colors.cyan)}>🔍</text>
        <text>{searchTerm}</text>
        {props.onSearchClear && (
          <interactive focusable onClick={() => props.onSearchClear?.()}>
            <text style={style().foreground(colors.red)}>Clear</text>
          </interactive>
        )}
      </hstack>
    )
  }
}

/**
 * Preset filter configurations for common use cases
 */
export const LOG_FILTER_PRESETS: FilterPreset[] = [
  {
    name: 'errors',
    label: 'Errors Only',
    icon: '❌',
    filter: (log: any) => log.level === 'error' || log.level === 'fatal',
  },
  {
    name: 'warnings',
    label: 'Warnings & Errors',
    icon: '⚠️',
    filter: (log: any) => ['warn', 'error', 'fatal'].includes(log.level),
  },
  {
    name: 'debug',
    label: 'Debug & Above',
    icon: '🔍',
    filter: (log: any) => log.level !== 'trace',
  },
  {
    name: 'recent',
    label: 'Last 5 minutes',
    icon: '🕐',
    filter: (log: any) => Date.now() - log.timestamp.getTime() < 5 * 60 * 1000,
  },
]

export const PROCESS_FILTER_PRESETS: FilterPreset[] = [
  {
    name: 'running',
    label: 'Running Only',
    icon: '🟢',
    filter: (proc: any) => proc.status === 'running',
  },
  {
    name: 'stopped',
    label: 'Stopped Only',
    icon: '⚪',
    filter: (proc: any) => proc.status === 'stopped',
  },
  {
    name: 'errors',
    label: 'Errors Only',
    icon: '🔴',
    filter: (proc: any) => proc.status === 'error',
  },
  {
    name: 'active',
    label: 'Active (Running/Starting)',
    icon: '⚡',
    filter: (proc: any) => ['running', 'starting'].includes(proc.status),
  },
]

export interface FilterableContentProps<T> {
  readonly items: ReadonlyArray<T>
  readonly renderItem: (item: T, index: number) => JSX.Element
  readonly filters?: FilterPreset[]
  readonly activePreset?: string | null
  readonly searchTerm?: string
  readonly title?: string
  readonly emptyMessage?: string | JSX.Element
  readonly className?: string
}

export function FilterableContent<T extends Record<string, any>>(
  props: FilterableContentProps<T>
): JSX.Element {
  const { theme } = useUITheme()
  const activeFilter =
    props.filters?.find(filter => filter.name === props.activePreset)?.filter ?? (() => true)

  const filteredItems = props.items.filter(activeFilter)

  return (
    <vstack gap={1} className={props.className}>
      {props.title && (
        <text
          style={style()
            .foreground(theme.colors.textBright ?? colors.white)
            .bold()}
        >
          {props.title}
        </text>
      )}

      <FilterBox
        presets={props.filters}
        activePreset={props.activePreset}
        searchTerm={props.searchTerm}
        showSearch={Boolean(props.searchTerm)}
      />

      {filteredItems.length === 0 ? (
        typeof props.emptyMessage === 'string' ? (
          <text style={style().foreground(theme.colors.textDim ?? colors.gray)}>
            {props.emptyMessage}
          </text>
        ) : (
          (props.emptyMessage ?? (
            <text style={style().foreground(theme.colors.textDim ?? colors.gray)}>
              No items match the current filters
            </text>
          ))
        )
      ) : (
        <vstack gap={1}>{filteredItems.map((item, index) => props.renderItem(item, index))}</vstack>
      )}
    </vstack>
  )
}
