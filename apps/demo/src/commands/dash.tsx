/** @jsxImportSource @tuix/jsx */

/**
 * Dash — live service dashboard on an interval clock. Metric cards share one
 * width so the screen sits on a grid; statuses run as a compact strip.
 *
 * Keys: [p] pause/resume · [r] reset history · [t] inject a spike
 */

import { $state, $derived, registerKeyHandler } from '@tuix/reactive'
import { KbdHint, ProgressBar, Sparkline, StatusIndicator, useUITheme } from '@tuix/ui'

const HISTORY = 40
const CARD_W = 30

function push(arr: number[], v: number): number[] {
  const next = [...arr, v]
  return next.length > HISTORY ? next.slice(next.length - HISTORY) : next
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

type Status = 'active' | 'warning' | 'error'

let timer: ReturnType<typeof setInterval> | null = null
let keyCleanup: (() => void) | null = null

export default function Dash() {
  const { theme } = useUITheme()
  const rps = $state(840, 'rps')
  const p95 = $state(118, 'p95')
  const errRate = $state(0.4, 'errRate')
  const mem = $state(62, 'mem')
  const conns = $state(118, 'conns')
  const history = $state([] as number[], 'history')
  const errHistory = $state([] as number[], 'errHistory')
  const paused = $state(false, 'paused')
  const ticks = $state(0, 'ticks')
  const spike = $state(false, 'spike')

  const avg = $derived(() => {
    const h = history()
    if (h.length === 0) return 0
    return Math.round(h.reduce((a, b) => a + b, 0) / h.length)
  })

  function seed() {
    for (let i = 0; i < HISTORY; i++) {
      const base = 800 + Math.round(Math.sin(i / 5) * 140 + (Math.random() - 0.5) * 80)
      history.$set(push(history(), base))
      errHistory.$set(push(errHistory(), +(Math.random() * 0.8).toFixed(2)))
    }
  }

  function tick() {
    if (paused()) return
    const drift = (Math.random() - 0.5) * 90
    const burst = spike() ? 420 : 0
    rps.$set(clamp(Math.round(rps() + drift + burst), 320, 1900))
    p95.$set(clamp(Math.round(p95() + (Math.random() - 0.5) * 14 + (burst ? 38 : 0)), 62, 380))
    errRate.$set(
      clamp(+(errRate() + (Math.random() - 0.5) * 0.2 + (burst ? 1.1 : 0)).toFixed(2), 0, 9)
    )
    mem.$set(clamp(Math.round(mem() + (Math.random() - 0.5) * 4), 38, 96))
    conns.$set(clamp(Math.round(conns() + (Math.random() - 0.5) * 18), 40, 240))
    history.$set(push(history(), rps()))
    errHistory.$set(push(errHistory(), errRate()))
    ticks.$set(ticks() + 1)
    if (spike()) spike.$set(false)
  }

  if (timer == null) {
    seed()
    timer = setInterval(tick, 900)
  }

  if (keyCleanup) keyCleanup()
  keyCleanup = registerKeyHandler(key => {
    if (key === 'p' || key === 'P') paused.$set(!paused())
    else if (key === 'r' || key === 'R') {
      history.$set([])
      errHistory.$set([])
      seed()
    } else if (key === 't' || key === 'T') spike.$set(true)
  })

  const dim = theme.colors.textDim ?? '#7d8ca3'
  const dim2 = theme.colors.textDim
  const gate: Status = errRate() > 4 ? 'error' : errRate() > 1.5 ? 'warning' : 'active'

  return (
    <box padding={1} border="rounded" borderColor={dim2}>
      {/* Header */}
      <hstack gap={1}>
        <text bg={theme.colors.primary} fg={theme.colors.bg}>
          {' Tuix Dash '}
        </text>
        <text fg={paused() ? theme.colors.warning : theme.colors.success}>
          {paused() ? '‖ paused' : '● live'}
        </text>
        <text fg={dim2}>{`t+${(ticks() * 0.9).toFixed(1)}s`}</text>
      </hstack>
      <text> </text>

      {/* Metric cards */}
      <hstack gap={2}>
        <vstack gap={0} width={CARD_W}>
          <text fg={dim2}>{'req/s'}</text>
          <text fg={theme.colors.fg}>{String(rps())}</text>
          <text fg={dim2}>{`avg ${avg()}`}</text>
          <text> </text>
          <Sparkline values={history()} width={CARD_W} variant="bar" />
        </vstack>
        <vstack gap={0} width={CARD_W}>
          <text fg={dim2}>{'errors %'}</text>
          <text fg={theme.colors.fg}>{errRate().toFixed(2)}</text>
          <text fg={errRate() > 1.5 ? theme.colors.warning : dim2}>
            {errRate() > 1.5 ? 'elevated' : 'nominal'}
          </text>
          <text> </text>
          <Sparkline values={errHistory()} width={CARD_W} variant="bar" />
        </vstack>
      </hstack>
      <text> </text>

      {/* Saturation bars */}
      <vstack gap={0} width={CARD_W * 2 + 2}>
        <ProgressBar value={mem()} label={`memory ${mem()}%`} />
        <text> </text>
        <ProgressBar
          value={conns()}
          total={240}
          label={`connections ${conns()}/240`}
          variant={conns() > 200 ? 'warning' : 'secondary'}
        />
      </vstack>
      <text> </text>

      {/* Services strip */}
      <text fg={dim2}>{'services'}</text>
      <hstack gap={3}>
        <StatusIndicator status={gate} label="edge" />
        <StatusIndicator status={p95() > 220 ? 'warning' : 'active'} label="api" />
        <StatusIndicator status={errRate() > 3 ? 'error' : 'active'} label="workers" />
        <StatusIndicator status="active" label="postgres" />
      </hstack>
      <text> </text>
      <text> </text>

      {Array.from({ length: Math.max(0, (process.stdout.rows ?? 24) - 18) }, (_, i) => (
        <text key={`f-${i}`}> </text>
      ))}

      {/* Hints */}
      <hstack gap={2}>
        <KbdHint keys="p" label="pause" />
        <KbdHint keys="r" label="reset" />
        <KbdHint keys="t" label="inject spike" />
        <KbdHint keys="ctrl+c" label="quit" />
      </hstack>
    </box>
  )
}
