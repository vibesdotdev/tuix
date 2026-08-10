/**
 * Tabs Component - Multi-view interface with tab navigation
 *
 * Features:
 * - Multiple tab views with content switching
 * - Keyboard navigation between tabs
 * - Customizable styling and layout
 * - Support for dynamic tab content
 * - Tab state management
 * - Icons and badges support
 * - Closeable tabs
 *
 * @example
 * ```tsx
 * import { Tabs, Tab } from 'tuix/components/navigation/tabs'
 *
 * function MyApp() {
 *   const activeTab = $state(0)
 *
 *   return (
 *     <Tabs activeIndex={activeTab}>
 *       <Tab label="General" icon="⚙️">
 *         <text>General settings content</text>
 *       </Tab>
 *       <Tab label="Advanced" badge="3">
 *         <text>Advanced settings content</text>
 *       </Tab>
 *       <Tab label="About">
 *         <text>About content</text>
 *       </Tab>
 *     </Tabs>
 *   )
 * }
 * ```
 */

import { $state, $derived, $effect } from '@tuix/reactive/runes/runes'
import type { StateRune } from '@tuix/reactive/runes/runes'
import { isStateRune } from '@tuix/reactive/runes/runes'
import { style, colors, type Style } from '@tuix/ansi'

// Types
export interface TabProps {
  label: string
  icon?: string | JSX.Element
  badge?: string | number
  closeable?: boolean
  disabled?: boolean
  children: JSX.Element | JSX.Element[]
}

export interface TabsProps {
  children: JSX.Element | JSX.Element[]
  activeIndex?: number | StateRune<number>
  onTabChange?: (index: number) => void
  onTabClose?: (index: number) => void
  orientation?: 'horizontal' | 'vertical'
  tabPosition?: 'top' | 'bottom' | 'left' | 'right'
  tabAlign?: 'start' | 'center' | 'end' | 'stretch'
  showBorder?: boolean
  focusable?: boolean
  autoFocus?: boolean
  wrap?: boolean
  className?: string
  style?: Style
  tabStyle?: Style | ((index: number, active: boolean, focused: boolean) => Style)
  tabBarStyle?: Style
  contentStyle?: Style
}

/**
 * Tab Component (used as child of Tabs)
 */
export function Tab(props: TabProps): JSX.Element {
  return <tab {...props} />
}

/**
 * Tabs Component
 */
export function Tabs(props: TabsProps): JSX.Element {
  // Extract tab information from children
  const tabs = $derived(() => {
    const children = Array.isArray(props.children) ? props.children : [props.children]
    return children
      .filter(child => child && child.type === 'tab')
      .map(child => child.props as TabProps)
  })

  // Internal state
  const focused = $state(props.autoFocus || false)
  const hovering = $state(false)
  const internalActiveIndex = $state(0)
  const focusedTabIndex = $state(0)

  // Active index management
  const activeIndex = $derived(() => {
    if (props.activeIndex !== undefined) {
      return isStateRune(props.activeIndex) ? props.activeIndex() : props.activeIndex
    }
    return internalActiveIndex()
  })

  // Ensure active index is valid
  // Only run effect in component context (not in tests)
  if (typeof $effect !== 'undefined') {
    try {
      $effect(() => {
        const maxIndex = tabs().length - 1
        if (activeIndex() > maxIndex) {
          setActiveIndex(maxIndex)
        } else if (activeIndex() < 0 && tabs().length > 0) {
          setActiveIndex(0)
        }
      })
    } catch (e) {
      // Ignore effect errors in test environment
      console.error(e)
    }
  }

  // Configuration
  const orientation = props.orientation || 'horizontal'
  const tabPosition = props.tabPosition || (orientation === 'horizontal' ? 'top' : 'left')
  const tabAlign = props.tabAlign || 'start'
  const showBorder = props.showBorder !== false
  const focusable = props.focusable !== false

  // Helper functions
  function setActiveIndex(index: number) {
    if (tabs()[index]?.disabled) return

    if (isStateRune(props.activeIndex)) {
      props.activeIndex.$set(index)
    } else {
      internalActiveIndex.$set(index)
    }
    props.onTabChange?.(index)
  }

  function closeTab(index: number) {
    props.onTabClose?.(index)
  }

  // Keyboard navigation
  function handleKeyPress(key: string) {
    if (!focused() || !focusable) return

    const isHorizontal = orientation === 'horizontal'
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'

    switch (key) {
      case nextKey:
      case 'l':
      case 'Tab':
        moveTabFocus(1)
        break
      case prevKey:
      case 'h':
      case 'Shift+Tab':
        moveTabFocus(-1)
        break
      case 'Home':
        focusedTabIndex.$set(0)
        break
      case 'End':
        focusedTabIndex.$set(tabs().length - 1)
        break
      case 'Enter':
      case ' ':
        setActiveIndex(focusedTabIndex())
        break
      case 'Delete':
      case 'Backspace':
        if (tabs()[focusedTabIndex()]?.closeable) {
          closeTab(focusedTabIndex())
        }
        break
    }
  }

  function moveTabFocus(delta: number) {
    const newIndex = focusedTabIndex() + delta
    const maxIndex = tabs().length - 1

    if (props.wrap) {
      focusedTabIndex.$set((newIndex + tabs().length) % tabs().length)
    } else {
      focusedTabIndex.$set(Math.max(0, Math.min(maxIndex, newIndex)))
    }

    // Skip disabled tabs
    if (tabs()[focusedTabIndex()]?.disabled) {
      moveTabFocus(delta > 0 ? 1 : -1)
    }
  }

  // Render helpers
  function renderTab(tab: TabProps, index: number): JSX.Element {
    const isActive = index === activeIndex()
    const isFocused = focused() && index === focusedTabIndex()
    const isDisabled = tab.disabled || false

    const tabStyle =
      typeof props.tabStyle === 'function'
        ? props.tabStyle(index, isActive, isFocused)
        : props.tabStyle

    const baseStyle = style({
      padding: { horizontal: 2, vertical: 0 },
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
      ...tabStyle,
    })

    const activeStyle = isActive
      ? style({
          background: colors.blue,
          foreground: colors.white,
          bold: true,
        })
      : style({
          background: 'transparent',
          foreground: colors.gray,
        })

    const focusStyle =
      isFocused && !isActive
        ? style({
            background: colors.gray,
            foreground: colors.white,
          })
        : {}

    const content: JSX.Element[] = []

    // Icon
    if (tab.icon) {
      content.push(typeof tab.icon === 'string' ? <text>{tab.icon}</text> : tab.icon)
    }

    // Label
    content.push(<text>{tab.label}</text>)

    // Badge
    if (tab.badge !== undefined) {
      content.push(
        <text
          style={style()
            .background(isActive ? colors.white : colors.blue)
            .foreground(isActive ? colors.blue : colors.white)
            .padding({ horizontal: 1 })
            .borderRadius(2)}
        >
          {String(tab.badge)}
        </text>
      )
    }

    // Close button
    if (tab.closeable) {
      content.push(
        <interactive
          onClick={(e: any) => {
            e.stopPropagation?.()
            closeTab(index)
          }}
        >
          <text style={style().foreground(colors.red).marginLeft(1)}>×</text>
        </interactive>
      )
    }

    return (
      <interactive
        onClick={() => !isDisabled && setActiveIndex(index)}
        onMouseEnter={() => {
          if (!isDisabled) {
            focusedTabIndex.$set(index)
          }
        }}
      >
        <box
          style={style({
            ...baseStyle,
            ...activeStyle,
            ...focusStyle,
          })}
        >
          <hstack gap={1} align="middle">
            {content}
          </hstack>
        </box>
      </interactive>
    )
  }

  function renderTabBar(): JSX.Element {
    const tabElements = tabs().map((tab, index) => renderTab(tab, index))

    const barStyle = style({
      ...props.tabBarStyle,
      justifyContent: tabAlign === 'stretch' ? 'space-between' : tabAlign,
      borderBottom: showBorder && tabPosition === 'top' ? 'single' : 'none',
      borderTop: showBorder && tabPosition === 'bottom' ? 'single' : 'none',
      borderRight: showBorder && tabPosition === 'left' ? 'single' : 'none',
      borderLeft: showBorder && tabPosition === 'right' ? 'single' : 'none',
    })

    if (orientation === 'horizontal') {
      return (
        <hstack style={barStyle} gap={0}>
          {tabElements}
        </hstack>
      )
    }

    return (
      <vstack style={barStyle} gap={0}>
        {tabElements}
      </vstack>
    )
  }

  function renderContent(): JSX.Element | null {
    const activeTab = tabs()[activeIndex()]
    if (!activeTab) return null

    return <box style={props.contentStyle || style().padding(1)}>{activeTab.children}</box>
  }

  // Main render
  const containerStyle = $derived(() => {
    const baseStyle = props.style || {}
    return style({
      ...baseStyle,
      border: showBorder ? 'single' : 'none',
    })
  })

  const layout = () => {
    const tabBar = renderTabBar()
    const content = renderContent()

    if (orientation === 'horizontal') {
      return tabPosition === 'top' ? [tabBar, content] : [content, tabBar]
    } else {
      return tabPosition === 'left' ? (
        <hstack>
          {tabBar}
          {content}
        </hstack>
      ) : (
        <hstack>
          {content}
          {tabBar}
        </hstack>
      )
    }
  }

  return (
    <interactive
      onKeyPress={handleKeyPress}
      onFocus={() => {
        focused.$set(true)
      }}
      onBlur={() => {
        focused.$set(false)
      }}
      onMouseEnter={() => {
        hovering.$set(true)
      }}
      onMouseLeave={() => {
        hovering.$set(false)
      }}
      focusable={focusable}
      className={props.className}
    >
      <vstack style={containerStyle()}>{layout()}</vstack>
    </interactive>
  )
}

// Preset tab styles
export function SimpleTabs(props: Omit<TabsProps, 'style'>): JSX.Element {
  return Tabs({
    showBorder: false,
    tabStyle: (_, active) =>
      style()
        .padding({ horizontal: 2, vertical: 0 })
        .foreground(active ? colors.white : colors.gray)
        .underline(active),
    ...props,
  })
}

export function PillTabs(props: TabsProps): JSX.Element {
  return Tabs({
    showBorder: false,
    tabStyle: (_, active, focused) =>
      style()
        .padding({ horizontal: 3, vertical: 1 })
        .background(active ? colors.blue : focused ? colors.gray : 'transparent')
        .foreground(active || focused ? colors.white : colors.gray),
    tabBarStyle: style().padding(1),
    ...props,
  })
}

export function VerticalTabs(props: Omit<TabsProps, 'orientation'>): JSX.Element {
  return Tabs({
    orientation: 'vertical',
    tabPosition: 'left',
    ...props,
  })
}
