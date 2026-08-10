import { $state, $derived, $effect, scopeManager, spacer, View } from '@tuix/core'
import { Button, Modal, Flex } from '@tuix/ui'

// @ts-ignore
import type { ViewTreeNode, UpdateEvent, ScopeInfo, ComponentInfo } from '../../tea/DebugApp'

interface DebugState {
  activeTab: 'app' | 'logs' | 'model' | 'view' | 'update' | 'cli' | 'jsx'
  logs: string[]
  modelState: unknown
  viewTree: ViewTreeNode[]
  updateHistory: UpdateEvent[]
  cliScopes: ScopeInfo[]
  jsxComponents: ComponentInfo[]
  performance: {
    renderTime: number
    updateCount: number
    lastRender: Date
  }
}

interface RichDebugInterfaceProps {
  children?: View
  initialState?: Partial<DebugState>
}

export function RichDebugInterface({
  children = View.empty,
  initialState = {},
}: RichDebugInterfaceProps): View {
  // Reactive debug state using TUIX runes
  const debugState = $state<DebugState>({
    activeTab: 'app',
    logs: [],
    modelState: null,
    viewTree: [],
    updateHistory: [],
    cliScopes: [],
    jsxComponents: [],
    performance: {
      renderTime: 0,
      updateCount: 0,
      lastRender: new Date(),
    },
    ...initialState,
  })

  // Derived state for computed values
  const activeScopes = $derived(() => scopeManager.getAllScopes())
  const tabCount = $derived(() => ({
    logs: debugState.logs.length,
    scopes: activeScopes.length,
    components: debugState.jsxComponents.length,
    updates: debugState.updateHistory.length,
  }))

  // Effects for real-time data updates
  $effect(() => {
    // Update performance metrics
    debugState.performance.lastRender = new Date()
    debugState.performance.updateCount += 1
  })

  // Header with TUIX logo and debug badge
  const header = View.vstack(
    View.hstack(
      View.text({
        content: 'TUIX',
        // gradient: { from: '#00d4ff', to: '#ff00d4' },
        style: 'bold',
      }),
      spacer(),
      View.box(
        {
          border: 'single',
          borderColor: 'yellow',
          padding: { horizontal: 1 },
        },
        [View.text('DEBUG')]
      )
    ),
    View.box(
      {
        border: 'single',
        borderColor: 'blue',
        width: '100%',
        height: 1,
      },
      [View.empty]
    )
  )

  // Tab navigation buttons
  const tabButtons = View.hstack(
    Button({
      content: `App${debugState.activeTab === 'app' ? ' ●' : ''}`,
      variant: debugState.activeTab === 'app' ? 'primary' : 'secondary',
      size: 'sm',
      onClick: () => (debugState.activeTab = 'app'),
    }),
    Button({
      content: `Logs (${tabCount.logs})${debugState.activeTab === 'logs' ? ' ●' : ''}`,
      variant: debugState.activeTab === 'logs' ? 'primary' : 'secondary',
      size: 'sm',
      onClick: () => (debugState.activeTab = 'logs'),
    }),
    Button({
      content: `Model${debugState.activeTab === 'model' ? ' ●' : ''}`,
      variant: debugState.activeTab === 'model' ? 'primary' : 'secondary',
      size: 'sm',
      onClick: () => (debugState.activeTab = 'model'),
    }),
    Button({
      content: `View${debugState.activeTab === 'view' ? ' ●' : ''}`,
      variant: debugState.activeTab === 'view' ? 'primary' : 'secondary',
      size: 'sm',
      onClick: () => (debugState.activeTab = 'view'),
    }),
    Button({
      content: `Update (${tabCount.updates})${debugState.activeTab === 'update' ? ' ●' : ''}`,
      variant: debugState.activeTab === 'update' ? 'primary' : 'secondary',
      size: 'sm',
      onClick: () => (debugState.activeTab = 'update'),
    }),
    Button({
      content: `CLI (${tabCount.scopes})${debugState.activeTab === 'cli' ? ' ●' : ''}`,
      variant: debugState.activeTab === 'cli' ? 'primary' : 'secondary',
      size: 'sm',
      onClick: () => (debugState.activeTab = 'cli'),
    }),
    Button({
      content: `JSX (${tabCount.components})${debugState.activeTab === 'jsx' ? ' ●' : ''}`,
      variant: debugState.activeTab === 'jsx' ? 'primary' : 'secondary',
      size: 'sm',
      onClick: () => (debugState.activeTab = 'jsx'),
    })
  )

  // Main content area based on active tab
  const getTabContent = (): View => {
    switch (debugState.activeTab) {
      case 'app':
        return View.box(
          {
            border: 'double',
            borderColor: 'green',
            title: 'Application View',
            padding: 1,
          },
          [
            View.vstack(
              View.text('🎯 Your application renders here:'),
              View.text(''),
              children,
              View.text(''),
              View.text('💡 Switch tabs to explore debug information')
            ),
          ]
        )

      case 'logs':
        return View.box(
          {
            border: 'single',
            borderColor: 'yellow',
            title: `Console Logs (${debugState.logs.length})`,
            padding: 1,
          },
          [
            View.vstack(
              View.text('📋 Recent log entries:'),
              View.text(''),
              ...debugState.logs
                .slice(-15)
                .map((log, i) => View.hstack(View.text(`${i + 1}.`.padStart(3)), View.text(log))),
              debugState.logs.length === 0 ? View.text('(No logs captured yet)') : View.empty
            ),
          ]
        )

      case 'model':
        return View.box(
          {
            border: 'single',
            borderColor: 'blue',
            title: 'MVU Model State',
            padding: 1,
          },
          [
            View.vstack(
              View.text('🏗️  Current application state:'),
              View.text(''),
              debugState.modelState
                ? View.text(JSON.stringify(debugState.modelState, null, 2))
                : View.text('(No model state captured)'),
              View.text(''),
              View.hstack(
                View.text('Performance: '),
                View.text(
                  `${debugState.performance.renderTime}ms render, ${debugState.performance.updateCount} updates`
                )
              )
            ),
          ]
        )

      case 'view':
        return View.box(
          {
            border: 'single',
            borderColor: 'magenta',
            title: 'View Tree Structure',
            padding: 1,
          },
          [
            View.vstack(
              View.text('🌳 Component hierarchy:'),
              View.text(''),
              ...debugState.viewTree.map(node => View.text(`- ${node.type} (${node.id})`)),
              debugState.viewTree.length === 0 ? View.text('(No view tree captured)') : View.empty
            ),
          ]
        )

      case 'update':
        return View.box(
          {
            border: 'single',
            borderColor: 'cyan',
            title: `Update History (${debugState.updateHistory.length})`,
            padding: 1,
          },
          [
            View.vstack(
              View.text('⚡ Recent state updates:'),
              View.text(''),
              ...debugState.updateHistory
                .slice(-10)
                .map((update, i) =>
                  View.vstack(
                    View.text(`${i + 1}. ${update.type || 'Update'}`),
                    View.text(`   Duration: ${update.duration}ms`),
                    View.text('')
                  )
                ),
              debugState.updateHistory.length === 0
                ? View.text('(No updates captured)')
                : View.empty
            ),
          ]
        )

      case 'cli':
        return View.box(
          {
            border: 'single',
            borderColor: 'red',
            title: `CLI Scopes (${activeScopes.length})`,
            padding: 1,
          },
          [
            View.vstack(
              View.text('⌨️  Active command scopes:'),
              View.text(''),
              ...activeScopes.map(scope =>
                View.vstack(
                  View.text(`• ${scope.id}`),
                  View.text(`  Path: ${scope.path || '/'}`),
                  View.text(`  Commands: ${scope.commands?.length || 0}`),
                  View.text('')
                )
              ),
              activeScopes.length === 0 ? View.text('(No scopes registered)') : View.empty
            ),
          ]
        )

      case 'jsx':
        return View.box(
          {
            border: 'single',
            borderColor: 'white',
            title: `JSX Components (${debugState.jsxComponents.length})`,
            padding: 1,
          },
          [
            View.vstack(
              View.text('⚛️  Rendered JSX components:'),
              View.text(''),
              ...debugState.jsxComponents.map(component =>
                View.text(`- ${component.name} (${component.props?.length || 0} props)`)
              ),
              debugState.jsxComponents.length === 0
                ? View.text('(No components tracked)')
                : View.empty
            ),
          ]
        )

      default:
        return View.text('Unknown tab')
    }
  }

  // Footer with status and controls
  const footer = View.box(
    {
      border: 'single',
      borderColor: 'gray',
      width: '100%',
    },
    [
      View.hstack(
        View.text('🔍 Debug Mode Active'),
        spacer(),
        View.text(`Tab: ${debugState.activeTab}`),
        spacer(),
        View.text(`Updated: ${debugState.performance.lastRender.toLocaleTimeString()}`),
        spacer(),
        View.text('Q: Quit | R: Refresh | C: Clear')
      ),
    ]
  )

  // Complete layout
  return Flex(
    {
      direction: 'column',
      height: '100%',
    },
    [
      header,
      View.box({ padding: { vertical: 1 } }, [tabButtons]),
      Flex(
        {
          direction: 'column',
          flex: 1,
        },
        [getTabContent()]
      ),
      footer,
    ]
  )
}
