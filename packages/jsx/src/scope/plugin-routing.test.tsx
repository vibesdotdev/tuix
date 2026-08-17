/**
 * Plugin child-command routing regression.
 *
 * `fixScopePaths` used to be a silent no-op (`resolveScopePaths?.()`),
 * and Plugin children never registered during the walk, so
 * `plugin child` routes did not exist. This pins the whole path:
 * registration → parent linking → path nesting → route match.
 */
import { describe, expect, it, beforeEach } from 'bun:test'
import { Command, Plugin, Fallback, toView } from '@tuix/jsx'
import { scopeManager } from '@tuix/jsx/scope/manager'
import { activeRouteStore } from '@tuix/jsx/scope/stores'

function App() {
  return (
    <>
      <Command name="top" description="top-level" component={() => null} />
      <Plugin name="cfg" description="config plugin">
        <Command name="get" description="get value" component={() => null} />
        <Command name="set" description="set value" component={() => null} />
      </Plugin>
      <Command name="after" description="after plugin" component={() => null} />
      <Fallback component={() => null} />
    </>
  )
}

describe('plugin child routing', () => {
  beforeEach(() => {
    scopeManager.clear?.()
  })

  it('plugin children register and nest under the plugin path', () => {
    toView(App())
    scopeManager.fixScopePaths()

    const paths = scopeManager
      .getAllScopes()
      .map(s => (s.path ?? []).join('/'))
      .sort()

    expect(paths).toContain('cfg/get')
    expect(paths).toContain('cfg/set')
    expect(paths).toContain('cfg')
    expect(paths).toContain('top')
    expect(paths).toContain('after')
  })

  it('plugin does not adopt sibling commands', () => {
    toView(App())
    scopeManager.fixScopePaths()

    const paths = scopeManager.getAllScopes().map(s => (s.path ?? []).join('/'))
    expect(paths).not.toContain('cfg/top')
    expect(paths).not.toContain('cfg/after')
  })

  it('nested route matches the child, not the plugin', () => {
    process.argv = ['bun', 'test', 'cfg', 'get']
    activeRouteStore.initFromArgv()
    toView(App())
    scopeManager.fixScopePaths()

    expect(activeRouteStore.matches(['cfg', 'get'])).toBe(true)
    expect(activeRouteStore.matches(['cfg', 'set'])).toBe(false)
    expect(activeRouteStore.matches(['top'])).toBe(false)
  })
})
