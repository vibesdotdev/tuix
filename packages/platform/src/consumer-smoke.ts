import { $state, $states, $derived, $bindable, isBindableRune } from '@tuix/reactive'
import {
  detectInteractive,
  extractModel,
  extractStateFromSource,
  compileToComponent,
} from '../../jsx/src/compiler/jsx-to-component.ts'
import { createHooks, applyOnMessageHook } from '@tuix/runtime'
import { PLATFORM_VERSION, detectCapabilities, encodeGraphics, LiveServices } from './index.ts'
import { Effect } from 'effect'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

const n = $state(2)
const d = $derived(() => n() * 3)
assert(d() === 6, 'derived')
n.$set(4)
assert(d() === 12, 'derived invalidates')
const b = $bindable('x')
assert(isBindableRune(b) && b() === 'x', 'bindable')

function Counter() {
  const count = $state(0, 'count')
  return count
}
assert(detectInteractive(Counter) === true, 'detectInteractive')
const model = extractModel(Counter, { extractState: true }) as { count: number }
assert(model.count === 0, `extractModel named count got ${JSON.stringify(model)}`)

function Multi() {
  return $states({ count: 1, label: 'hi' })
}
const multi = extractModel(Multi, { extractState: true }) as { count: number; label: string }
assert(multi.count === 1 && multi.label === 'hi', `extractModel $states ${JSON.stringify(multi)}`)

assert(extractStateFromSource('const count = $state(0)').count === 0, 'extractStateFromSource')

const [initModel] = await Effect.runPromise(
  compileToComponent(Counter, { extractState: true }).init
)
assert((initModel as { count: number }).count === 0, `compile init ${JSON.stringify(initModel)}`)

const cancelled = await Effect.runPromise(
  applyOnMessageHook(
    createHooks({ onMessage: (m: number) => Effect.succeed(m < 0 ? null : m) }),
    -1
  )
)
assert(cancelled === null, 'onMessage cancel')

assert(!!PLATFORM_VERSION && !!LiveServices, 'platform')
const caps = detectCapabilities({ env: { TERM_PROGRAM: 'WezTerm' }, columns: 80, rows: 24 })
assert(caps.sixel === true, 'wezterm sixel')
const g = encodeGraphics(caps, {
  data: new Uint8Array(48).fill(200),
  width: 8,
  height: 6,
  channels: 1,
  format: 'gray',
})
assert(!g.fallback && g.protocol === 'sixel', 'encode sixel')

console.log('consumer-smoke: OK')
console.log(JSON.stringify({ model, multi, initModel, protocol: g.protocol }))
