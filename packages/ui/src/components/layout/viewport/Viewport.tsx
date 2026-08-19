/**
 * Viewport Component - JSX version for scrollable content areas
 *
 * A scrollable container component that provides:
 * - Vertical and horizontal scrolling
 * - Scroll indicators/scrollbars
 * - Mouse wheel support
 * - Keyboard navigation (arrow keys, page up/down)
 * - Content that can be larger than the viewport
 * - Smooth scrolling behavior
 *
 * @example
 * ```tsx
 * import { Viewport } from '@tuix/ui'
 *
 * function MyScrollableContent() {
 *   return (
 *     <Viewport
 *       width={80}
 *       height={20}
 *       showScrollbars={true}
 *     >
 *       <text>Line 1</text>
 *       <text>Line 2</text>
 *       <text>Line 3</text>
 *       // ... many more lines ...
 *     </Viewport>
 *   )
 * }
 * ```
 */

/** @jsxImportSource @tuix/jsx */

import { Effect } from 'effect'
import { toView } from '@tuix/jsx'
import { $effect } from '@tuix/reactive/runes/runes'
import { useViewport, useFocus } from '@tuix/reactive'
import { style, colors, borderStyle as makeBorderStyle, type Style, renderStyled } from '@tuix/ansi'
import {
  unwrapRendered,
  resolveSize,
  type View,
  type SizeValue,
  type RenderContext,
} from '@tuix/view'
import { createViewportStore, type ViewportStore } from '../../../stores/viewportStore'
import { useUITheme } from '../../../theme'

// Types
export interface ViewportProps {
  children?: JSX.Element | JSX.Element[]

  // Identification (needed for focus registration)
  id?: string
  className?: string

  // Sizing — accepts fixed cells, 'fill', or 'NN%'
  width: SizeValue
  height: SizeValue

  // Scrolling
  showScrollbars?: boolean
  smoothScroll?: boolean
  scrollStep?: number
  pageSize?: number

  // Styling
  style?: Style
  borderStyle?: 'single' | 'double' | 'rounded' | 'thick' | 'none'
  scrollbarStyle?: Style

  // Callbacks
  onScroll?: (x: number, y: number) => void
  onScrollUp?: () => void
  onScrollDown?: () => void
  onScrollLeft?: () => void
  onScrollRight?: () => void
}

export const Viewport = (props: ViewportProps) => {
  const { theme } = useUITheme()
  const {
    children,
    width,
    height,
    id,
    className,
    showScrollbars = true,
    smoothScroll = true,
    scrollStep = 1,
    pageSize,
    style: customStyle,
    borderStyle = 'single',
    onScroll,
    onScrollUp,
    onScrollDown,
    onScrollLeft,
    onScrollRight,
  } = props

  // Resolve SizeValue (number | 'fill' | 'NN%') against the reactive terminal
  // size so 'fill' and percentage sizes work.
  const viewportSize = useViewport()
  const resolveDim = (v: SizeValue, axis: 'width' | 'height'): number => {
    if (typeof v === 'number') return v
    const vp = viewportSize()
    return resolveSize(v, axis, { width: vp.cols, height: vp.rows }, axis === 'width' ? 80 : 24)
  }

  const resolvedWidth = resolveDim(width, 'width')
  const resolvedHeight = resolveDim(height, 'height')
  const resolvedPageSize = pageSize ?? Math.max(1, resolvedHeight - 2)

  // Create viewport store for scroll state management
  const store = createViewportStore({
    width: resolvedWidth,
    height: resolvedHeight,
    scrollStep,
    pageSize: resolvedPageSize,
    smoothScroll,
    wrapContent: false,
  })
  store.showScrollbars.$set(showScrollbars)

  // Register with the focus system so keyboard events reach our handler.
  // <interactive> will re-register with the key handler; this also gives us
  // a stable focusId for testing.
  const { focusId } = useFocus(id ?? className)

  // Keep store dimensions in sync when the terminal resizes (for 'fill'/'%').
  $effect(() => {
    store.updateDimensions(resolveDim(width, 'width'), resolveDim(height, 'height'))
  })

  // Scroll method wrappers that include callbacks
  const scrollUp = (amount?: number) => {
    store.scrollUp(amount)
    onScroll?.(store.scrollX(), store.scrollY())
    onScrollUp?.()
  }

  const scrollDown = (amount?: number) => {
    store.scrollDown(amount)
    onScroll?.(store.scrollX(), store.scrollY())
    onScrollDown?.()
  }

  const scrollLeft = (amount?: number) => {
    store.scrollLeft(amount)
    onScroll?.(store.scrollX(), store.scrollY())
    onScrollLeft?.()
  }

  const scrollRight = (amount?: number) => {
    store.scrollRight(amount)
    onScroll?.(store.scrollX(), store.scrollY())
    onScrollRight?.()
  }

  // Keyboard handler — wired to <interactive> via focusId so the focus
  // system dispatches key events here when the viewport is focused.
  const handleKeyPress = (key: string) => {
    switch (key) {
      case 'up':
      case 'k':
        scrollUp()
        break
      case 'down':
      case 'j':
        scrollDown()
        break
      case 'left':
      case 'h':
        scrollLeft()
        break
      case 'right':
      case 'l':
        scrollRight()
        break
      case 'pageup':
        store.pageUp()
        onScroll?.(store.scrollX(), store.scrollY())
        break
      case 'pagedown':
        store.pageDown()
        onScroll?.(store.scrollX(), store.scrollY())
        break
      case 'home':
        store.scrollToTop()
        onScroll?.(store.scrollX(), store.scrollY())
        break
      case 'end':
        store.scrollToBottom()
        onScroll?.(store.scrollX(), store.scrollY())
        break
    }
  }

  // Process children to content lines — properly renders each child View via
  // Effect.runPromise and extracts the string content.  Handles both string
  // results and { content: string } objects returned by vstack/hstack/etc.
  const processChildren = async (kids: unknown, context?: RenderContext): Promise<string[]> => {
    if (kids == null) return []
    const childArray = Array.isArray(kids) ? kids : [kids]
    const lines: string[] = []

    for (const child of childArray) {
      if (child == null || typeof child === 'boolean') continue
      if (typeof child === 'string') {
        lines.push(...child.split('\n'))
        continue
      }
      if (typeof child === 'number' || typeof child === 'bigint') {
        lines.push(String(child))
        continue
      }
      // Convert to a View (handles JSX descriptors, View objects, etc.)
      // and render it to extract the string content.
      const view = toView(child)
      const rendered = await Effect.runPromise(view.render(context))
      const content = unwrapRendered(rendered)
      if (content) {
        lines.push(...content.split('\n'))
      }
    }

    return lines
  }

  // Build the viewport content View — renders children, clips to the
  // visible window using the store's scroll state, applies scrollbars,
  // and wraps with border/styling.  This is where the async child rendering
  // happens (inside an Effect generator, bridged from the async
  // processChildren via Effect.promise).
  const viewportView: View = {
    render: (context?: RenderContext) =>
      Effect.gen(function* (_) {
        // 1. Render children to content lines (async → Effect)
        const contentLines = yield* _(Effect.promise(() => processChildren(children, context)))
        store.setContent(contentLines)

        // 2. Get visible lines — the store handles clipping + scroll offsets
        const visible = store.visibleLines()

        // 3. Build scrollbar strings
        const vScrollbar =
          showScrollbars && store.hasVerticalScroll()
            ? renderVerticalScrollbar(store, resolvedHeight)
            : null
        const hScrollbar =
          showScrollbars && store.hasHorizontalScroll()
            ? renderHorizontalScrollbar(store, resolvedWidth)
            : null

        // 4. Combine content with scrollbars
        const outputLines: string[] = []
        for (let i = 0; i < visible.length; i++) {
          const line = visible[i] ?? ''
          if (vScrollbar && i < vScrollbar.length) {
            outputLines.push(line + vScrollbar[i])
          } else {
            outputLines.push(line)
          }
        }
        if (hScrollbar) {
          outputLines.push(vScrollbar ? hScrollbar + '┘' : hScrollbar)
        }

        const rawContent = outputLines.join('\n')

        // 5. Apply border + styling
        const borderStyleValue =
          borderStyle === 'none'
            ? undefined
            : makeBorderStyle(borderStyle === 'single' ? 'thin' : borderStyle)

        const viewportStyle = (customStyle ?? style()).width(resolvedWidth).height(resolvedHeight)

        const finalStyle = borderStyleValue
          ? viewportStyle
              .border(borderStyleValue)
              .borderForeground(theme.colors.border ?? colors.gray)
          : viewportStyle

        return renderStyled(rawContent, finalStyle)
      }),
    width: resolvedWidth,
    height: resolvedHeight,
  }

  return (
    <interactive focusable={true} focusId={focusId} onKeyPress={handleKeyPress}>
      {viewportView}
    </interactive>
  )
}

// ---------------------------------------------------------------------------
// Scrollbar helpers
// ---------------------------------------------------------------------------

function renderVerticalScrollbar(store: ViewportStore, height: number): string[] {
  const thumbSize = store.verticalThumbSize()
  const thumbPosition = store.verticalThumbPosition()
  const viewportHeight = Math.max(0, height - 1)
  return Array.from({ length: viewportHeight }, (_, i) => {
    if (i >= thumbPosition && i < thumbPosition + thumbSize) return '█'
    return '│'
  })
}

function renderHorizontalScrollbar(store: ViewportStore, width: number): string {
  const thumbSize = store.horizontalThumbSize()
  const thumbPosition = store.horizontalThumbPosition()
  const viewportWidth = Math.max(0, width - 1)
  let scrollbar = ''
  for (let i = 0; i < viewportWidth; i++) {
    if (i >= thumbPosition && i < thumbPosition + thumbSize) scrollbar += '█'
    else scrollbar += '─'
  }
  return scrollbar
}

// Export types for external use
export type { ViewportProps }
