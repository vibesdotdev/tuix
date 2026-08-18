/** @jsxImportSource @tuix/jsx */

/**
 * Dash — a real example app: live service dashboard on an interval clock.
 * Sparklines trace history, bars show saturation, statuses pulse per service.
 *
 * Keys: [p] pause/resume the clock · [r] reset history · [t] inject a spike
 */

import { $state, $derived, registerKeyHandler } from '@tuix/reactive'
import { KbdHint, ProgressBar, Sparkline, StatusIndicator, useUITheme } from '@tuix/ui'

const HISTORY = 40

function push(arr: number[], v: number): number[] {
  const next = [...arr, v]
  return next.length > HISTORY ? next.slice(next.length - HISTORY) : next
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

type Status = 'active' | 'warning' | 'error'

// Module-level clock: one interval per process, guarded so hot-reload/tests
// don't stack timers. Views read named state; the interval writes it.
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
  const gate: Status = errRate() > 4 ? 'error' : errRate() > 1.5 ? 'warning' : 'active'

  return (
    <vstack gap={0}>
      {/* Header chip + live clock */}
      <hstack gap={1}>
        <text bg={theme.colors.primary} fg={theme.colors.bg}>
          {' Tuix Dash '}
        </text>
        <text fg={paused() ? theme.colors.warning : theme.colors.success}>
          {paused() ? '‖ paused' : '● live'}
        </text>
        <text fg={dim}>{`t+${(ticks() * 0.9).toFixed(1)}s`}</text>
      </hstack>
      <text> </text>

      {/* Metric cards */}
      <hstack gap={3}>
        <vstack gap={0}>
          <text fg={dim}>req/s</text>
          <text>{String(rps())}</text>
          <text fg={dim}>{`avg ${avg()}`}</text>
          <text> </text>
          <Sparkline values={history()} width={28} variant="bar" label="rps" />
        </vstack>
        <vstack gap={0}>
          <text fg={dim}>errors %</text>
          <text>{errRate().toFixed(2)}</text>
          <text fg={dim}>{errRate() > 1.5 ? 'elevated' : 'nominal'}</text>
          <text> </text>
          <Sparkline values={errHistory()} width={22} variant="bar" label="err" />
        </vstack>
      </hstack>
      <text> </text>

      {/* Saturation bars */}
      <ProgressBar value={mem()} label={`memory ${mem()}%`} />
      <text> </text>
      <ProgressBar
        value={conns()}
        total={240}
        label={`connections ${conns()}/240`}
        variant={conns() > 200 ? 'warning' : 'secondary'}
      />
      <text> </text>

      {/* Services */}
      <text fg={dim}>services</text>
      <StatusIndicator status={gate} label="edge" />
      <StatusIndicator status={p95() > 220 ? 'warning' : 'active'} label="api" />
      <StatusIndicator status={errRate() > 3 ? 'error' : 'active'} label="workers" />
      <StatusIndicator status="active" label="postgres" />
      <text> </text>

      <hstack gap={1}>
        <KbdHint keys="p" label="pause" />
        <KbdHint keys="r" label="reset" />
        <KbdHint keys="t" label="inject spike" />
        <KbdHint keys="ctrl+c" label="quit" />
      </hstack>
    </vstack>
  )
}
