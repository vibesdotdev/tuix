/**
 * Overlay metadata. Flex extracts tagged views from flow; the renderer
 * paints them as a transparent layer over the workbench framebuffer.
 */
import type { View } from './core'

export const OVERLAY_METADATA = Symbol.for('tuix.overlay')
export const OVERLAYS_METADATA = Symbol.for('tuix.overlays')

export const DEFAULT_OVERLAY_ORIGIN = { x: 0, y: 1 } as const

export interface OverlayOrigin {
  readonly x: number
  readonly y: number
  /** Dim the surface beneath the overlay (modal scrim). */
  readonly scrim?: boolean
}

export interface OverlaySpec {
  readonly view: View
  readonly x: number
  readonly y: number
  readonly scrim?: boolean
}

type OverlayCarrier = View & {
  readonly [OVERLAY_METADATA]?: OverlayOrigin
  readonly [OVERLAYS_METADATA]?: ReadonlyArray<OverlaySpec>
}

export function markOverlay(view: View, origin: Partial<OverlayOrigin> = {}): View {
  const marked: OverlayCarrier = {
    render: view.render.bind(view),
    width: view.width,
    height: view.height,
  }
  Object.defineProperty(marked, OVERLAY_METADATA, {
    value: {
      x: origin.x ?? DEFAULT_OVERLAY_ORIGIN.x,
      y: origin.y ?? DEFAULT_OVERLAY_ORIGIN.y,
      scrim: origin.scrim ?? false,
    },
    enumerable: false,
    writable: false,
  })
  return marked
}

export function isOverlayView(view: unknown): view is OverlayCarrier {
  return Boolean(view && typeof view === 'object' && OVERLAY_METADATA in view)
}

export function overlaySpec(view: View): OverlaySpec {
  const origin = isOverlayView(view)
    ? (view[OVERLAY_METADATA] ?? DEFAULT_OVERLAY_ORIGIN)
    : DEFAULT_OVERLAY_ORIGIN
  return { view, x: origin.x, y: origin.y, scrim: origin.scrim ?? false }
}

export function collectOverlays(view: unknown): OverlaySpec[] {
  if (!view || typeof view !== 'object') return []
  const listed = (view as OverlayCarrier)[OVERLAYS_METADATA]
  return Array.isArray(listed) ? [...listed] : []
}

export function attachOverlays(view: View, overlays: ReadonlyArray<OverlaySpec>): View {
  if (overlays.length === 0) return view
  Object.defineProperty(view, OVERLAYS_METADATA, {
    value: overlays,
    enumerable: false,
    writable: false,
  })
  return view
}

export function partitionOverlays<T extends { view: View }>(
  items: ReadonlyArray<T>
): { flow: T[]; overlays: OverlaySpec[] } {
  const flow: T[] = []
  const overlays: OverlaySpec[] = []
  for (const item of items) {
    if (isOverlayView(item.view)) overlays.push(overlaySpec(item.view))
    else flow.push(item)
  }
  return { flow, overlays }
}
