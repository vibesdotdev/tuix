/**
 * Select Component - Dropdown select for terminal UI
 *
 * @example
 * ```tsx
 * import { Select } from '@tuix/ui'
 *
 * function MyForm() {
 *   const theme = $state('dark')
 *
 *   return (
 *     <Select
 *       bind:value={theme}
 *       options={[
 *         { value: 'dark', label: 'Dark' },
 *         { value: 'light', label: 'Light' },
 *         { value: 'auto', label: 'Auto' }
 *       ]}
 *       placeholder="Select theme..."
 *     />
 *   )
 * }
 * ```
 */

import { $state, $derived, $effect } from '@tuix/reactive/runes/runes'
import type { StateRune, BindableRune } from '@tuix/reactive/runes/runes'
import { isBindableRune, isStateRune } from '@tuix/reactive/runes/runes'
import { style, colors, border } from '@tuix/ansi'

export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface SelectProps<T = string> {
  value?: T
  'bind:value'?: BindableRune<T> | StateRune<T>
  options: SelectOption<T>[]
  placeholder?: string
  width?: number
  onChange?: (value: T) => void
  onFocus?: () => void
  onBlur?: () => void
  disabled?: boolean
  searchable?: boolean
  className?: string
}

/**
 * Select Component
 */
export function Select<T = string>(props: SelectProps<T>): JSX.Element {
  const boundValue = props['bind:value']
  const localValue = $state<T | undefined>(props.value)
  const isOpen = $state(false)
  const isFocused = $state(false)
  const highlightedIndex = $state(0)
  const searchQuery = $state('')

  const width = props.width || 30

  // Get current value (bound or local)
  const currentValue = $derived(() => {
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      return boundValue()
    }
    return localValue()
  })

  // Filter options based on search
  const filteredOptions = $derived(() => {
    if (!props.searchable || !searchQuery()) {
      return props.options
    }
    const query = searchQuery().toLowerCase()
    return props.options.filter(opt =>
      opt.label.toLowerCase().includes(query)
    )
  })

  // Get selected option
  const selectedOption = $derived(() => {
    const val = currentValue()
    return props.options.find(opt => opt.value === val)
  })

  // Sync bound value
  $effect(() => {
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      if (boundValue() !== localValue()) {
        localValue.$set(boundValue())
      }
    }
  })

  // Event handlers
  function handleKeyPress(key: string) {
    if (props.disabled) return

    if (!isOpen()) {
      if (key === 'Enter' || key === ' ') {
        isOpen.$set(true)
        highlightedIndex.$set(0)
        return
      }
      return
    }

    // Dropdown is open
    const options = filteredOptions()

    switch (key) {
      case 'ArrowUp':
        highlightedIndex.$set(Math.max(0, highlightedIndex() - 1))
        break

      case 'ArrowDown':
        highlightedIndex.$set(Math.min(options.length - 1, highlightedIndex() + 1))
        break

      case 'Enter':
      case ' ':
        const selected = options[highlightedIndex()]
        if (selected && !selected.disabled) {
          selectOption(selected.value)
        }
        break

      case 'Escape':
        isOpen.$set(false)
        searchQuery.$set('')
        break

      default:
        // Searchable typing
        if (props.searchable && key.length === 1) {
          searchQuery.$set(searchQuery() + key)
        }
    }
  }

  function selectOption(value: T) {
    localValue.$set(value)
    if (boundValue && (isBindableRune(boundValue) || isStateRune(boundValue))) {
      boundValue.$set(value)
    }
    props.onChange?.(value)
    isOpen.$set(false)
    searchQuery.$set('')
  }

  // Render
  const borderColor = isFocused() ? colors.blue : colors.gray
  let dropdownStyle = style()
    .width(width)
    .padding(0, 1)
    .border(border.borderStyle('thin'))
    .borderFg(borderColor)

  if (props.disabled) {
    dropdownStyle = dropdownStyle.background(colors.gray)
  }

  return (
    <interactive
      onKeyPress={handleKeyPress}
      onFocus={() => {
        isFocused.$set(true)
        props.onFocus?.()
      }}
      onBlur={() => {
        isFocused.$set(false)
        isOpen.$set(false)
        searchQuery.$set('')
        props.onBlur?.()
      }}
      focusable={!props.disabled}
      className={props.className}
    >
      <vstack>
        <box style={dropdownStyle}>
          <hstack align="middle">
            <text style={selectedOption() ? undefined : style().foreground(colors.gray).italic()}>
              {selectedOption()?.label || props.placeholder || 'Select...'}
            </text>
            <spacer />
            <text style={style().foreground(colors.gray)}>
              {isOpen() ? '▲' : '▼'}
            </text>
          </hstack>
        </box>

        {isOpen() && (
          <box
            style={style()
              .width(width)
              .maxHeight(10)
              .border(border.borderStyle('thin'))
              .borderFg(colors.gray)
              .background(colors.black)}
          >
            <vstack>
              {props.searchable && searchQuery() && (
                <text style={style().foreground(colors.gray).italic().padding(0, 1)}>
                  {`Search: ${searchQuery()}`}
                </text>
              )}

              {filteredOptions().length === 0 ? (
                <text style={style().foreground(colors.gray).italic().padding(0, 1)}>
                  No results
                </text>
              ) : (
                filteredOptions().map((option, index) => {
                  const isHighlighted = index === highlightedIndex()
                  const isSelected = option.value === currentValue()

                  let optionStyle = style().padding(0, 1)

                  if (isHighlighted) {
                    optionStyle = optionStyle.background(colors.blue).foreground(colors.white)
                  } else if (isSelected) {
                    optionStyle = optionStyle.foreground(colors.cyan)
                  }

                  if (option.disabled) {
                    optionStyle = optionStyle.foreground(colors.gray)
                  }

                  return (
                    <text key={String(option.value)} style={optionStyle}>
                      {`${isSelected ? '✓ ' : '  '}${option.label}`}
                    </text>
                  )
                })
              )}
            </vstack>
          </box>
        )}
      </vstack>
    </interactive>
  )
}

// Factory function
export function select<T = string>(props: SelectProps<T>): JSX.Element {
  return <Select {...props} />
}
