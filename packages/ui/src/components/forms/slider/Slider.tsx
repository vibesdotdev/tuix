/** @jsxImportSource @tuix/jsx */

import { useUITheme } from '../../../theme'

export interface SliderProps {
  /** 0..1 position of the handle. */
  value?: number
  /** Discrete steps; omit (or 0) for a continuous track. */
  steps?: number
  /** Track width in columns (default 20). */
  width?: number
  label?: string
  /** Render the numeric position next to the track. */
  showValue?: boolean
  disabled?: boolean
  onChange?: (value: number) => void
  className?: string
}

const FILLED = '█'
const EMPTY = '░'
const HANDLE = '●'

/** Clamp to 0..1. */
function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/** Quantize to `steps` evenly spaced positions (0..1 inclusive). */
export function quantize(value: number, steps: number): number {
  if (!steps || steps < 2) return clamp01(value)
  const quantized = Math.round(clamp01(value) * (steps - 1)) / (steps - 1)
  return quantized
}

/** Pure track renderer: filled run, handle cell, empty run. */
export function sliderTrack(value: number, width: number, steps?: number): string {
  const w = Math.max(3, width)
  const position = quantize(value, steps ?? 0)
  const cells = w - 1 // one cell is the handle
  const filled = Math.round(position * cells)
  return `${FILLED.repeat(filled)}${HANDLE}${EMPTY.repeat(cells - filled)}`
}

/**
 * Range control. ←/→ (or h/l) step, Home/End jump to the bounds, and the
 * quantized value reports through `onChange`.
 *
 * @example
 * ```tsx
 * <Slider value={volume()} steps={10} label="volume" onChange={v => volume.$set(v)} />
 * ```
 */
export function Slider(props: SliderProps): JSX.Element {
  const { theme } = useUITheme()
  const width = props.width ?? 20
  const value = clamp01(props.value ?? 0)
  const position = quantize(value, props.steps ?? 0)
  const track = sliderTrack(value, width, props.steps)
  const disabled = Boolean(props.disabled)

  function stepBy(delta: number) {
    if (disabled || !props.onChange) return
    const granularity = props.steps && props.steps >= 2 ? 1 / (props.steps - 1) : 0.05
    props.onChange(quantize(position + delta * granularity, props.steps ?? 0))
  }

  function handleKeys(key: string): boolean {
    const lower = key.toLowerCase()
    if (lower === 'left' || lower === 'h') {
      stepBy(-1)
      return true
    }
    if (lower === 'right' || lower === 'l') {
      stepBy(1)
      return true
    }
    if (lower === 'home') {
      if (!disabled) props.onChange?.(0)
      return true
    }
    if (lower === 'end') {
      if (!disabled) props.onChange?.(1)
      return true
    }
    return false
  }

  const valueText = props.showValue ? `${Math.round(position * 100)}%` : undefined

  return (
    <interactive className={props.className} focusable={!disabled} onKeyPress={handleKeys}>
      <hstack gap={1}>
        {props.label ? <text fg={theme.colors.textDim}>{props.label}</text> : null}
        <text fg={disabled ? theme.colors.textDim : theme.colors.primary}>{track}</text>
        {valueText ? <text fg={theme.colors.textDim}>{valueText}</text> : null}
      </hstack>
    </interactive>
  )
}

export const slider = (props: SliderProps) => <Slider {...props} />
