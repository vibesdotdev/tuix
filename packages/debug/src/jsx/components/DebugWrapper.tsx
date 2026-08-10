import { $effect, spacer, View, Interactive } from '@tuix/core'
import { debugStore } from '../../core/store'
import { debugWrapperStore } from '../stores/debugWrapperStore'
import { Effect } from 'effect'
import { Box, Flex, Text } from '@tuix/ui'
import type { JSX } from '@tuix/jsx'
import { StateInspector } from './StateInspector'

interface DebugWrapperProps {
  children?: JSX.Element
}

export function DebugWrapper({ children }: DebugWrapperProps): JSX.Element {
  // Use debug wrapper store for state management

  // Subscribe to store updates
  $effect(() => {
    const unsubscribe = debugStore.subscribe(state => {
      // Track state changes silently
    })

    return () => unsubscribe()
  })

  // Intercept console.log and stdout
  $effect(() => {
    // Store original functions
    const originalConsoleLog = console.log
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    const originalConsoleInfo = console.info
    const originalStdoutWrite = process.stdout.write.bind(process.stdout)
    const originalStderrWrite = process.stderr.write.bind(process.stderr)

    // Intercept console methods
    console.log = (...args: unknown[]) => {
      const message = args
        .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
        .join(' ')
      debugWrapperStore.addLog(`[LOG] ${message}`)
      // Only write to original if not in app view
      if (debugWrapperStore.activeTab !== 'app') {
        originalConsoleLog(...args)
      }
    }

    console.error = (...args: unknown[]) => {
      const message = args
        .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
        .join(' ')
      debugWrapperStore.addLog(`[ERROR] ${message}`)
      if (debugWrapperStore.activeTab !== 'app') {
        originalConsoleError(...args)
      }
    }

    console.warn = (...args: unknown[]) => {
      const message = args
        .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
        .join(' ')
      debugWrapperStore.addLog(`[WARN] ${message}`)
      if (debugWrapperStore.activeTab !== 'app') {
        originalConsoleWarn(...args)
      }
    }

    console.info = (...args: unknown[]) => {
      const message = args
        .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
        .join(' ')
      debugWrapperStore.addLog(`[INFO] ${message}`)
      if (debugWrapperStore.activeTab !== 'app') {
        originalConsoleInfo(...args)
      }
    }

    // Intercept stdout/stderr
    process.stdout.write = function (chunk: string | Uint8Array, ...args: unknown[]): boolean {
      const str = chunk?.toString() || ''
      // Filter out debug output to prevent recursion
      if (
        !str.includes('[TUIX DEBUG]') &&
        !str.includes('[DebugWrapper]') &&
        !str.includes('DEBUG MODE') &&
        !str.includes('Registered Scopes:')
      ) {
        debugWrapperStore.addOutput(str)
      }
      // Only write to original if not in app view
      if (debugWrapperStore.activeTab !== 'app') {
        return originalStdoutWrite(chunk, ...args)
      }
      return true
    }

    process.stderr.write = function (chunk: string | Uint8Array, ...args: unknown[]): boolean {
      const str = chunk?.toString() || ''
      debugWrapperStore.addOutput(`[STDERR] ${str}`)
      // Only write to original if not in app view
      if (debugWrapperStore.activeTab !== 'app') {
        return originalStderrWrite(chunk, ...args)
      }
      return true
    }

    // Cleanup on unmount
    return () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      console.info = originalConsoleInfo
      process.stdout.write = originalStdoutWrite
      process.stderr.write = originalStderrWrite
    }
  })

  // Keyboard handler
  $effect(() => {
    const handleKey = (key: Buffer) => {
      const keyStr = key.toString()

      // Handle quit separately since it's not in the store
      if (keyStr === 'q' || keyStr === 'Q') {
        Effect.runSync(Interactive.exit(0))
        return
      }

      // Use store to handle other keys
      debugWrapperStore.handleKeypress(keyStr)
    }

    process.stdin.on('data', handleKey)
    return () => process.stdin.off('data', handleKey)
  })

  if (!debugWrapperStore.isVisible) {
    return children || null
  }

  // Create tab bar
  const TabBar = () => (
    <Flex direction="row">
      <Text>{debugWrapperStore.getTabDisplay('app')}</Text>
      <Text>{debugWrapperStore.getTabDisplay('logs')}</Text>
      <Text>{debugWrapperStore.getTabDisplay('output')}</Text>
      <Text>{debugWrapperStore.getTabDisplay('scopes')}</Text>
      <Text>{debugWrapperStore.getTabDisplay('events')}</Text>
      <Text>{debugWrapperStore.getTabDisplay('performance')}</Text>
      <Text>{debugWrapperStore.getTabDisplay('state')}</Text>
    </Flex>
  )

  // Create tab content based on active tab
  const TabContent = () => {
    if (debugWrapperStore.activeTab === 'app') {
      return (
        <Flex direction="column">
          <Text>Application Output</Text>
          <Text>Your app renders here. Press 2-7 to view debug info.</Text>
          <Text />
          {children}
        </Flex>
      )
    } else if (debugWrapperStore.activeTab === 'logs') {
      const recentLogs = debugWrapperStore.getRecentLogs(20)
      return (
        <Flex direction="column">
          <Text>Console Logs ({debugWrapperStore.logCount} total)</Text>
          <Text />
          {recentLogs.map(log => (
            <Text>{log}</Text>
          ))}
        </Flex>
      )
    } else if (debugWrapperStore.activeTab === 'output') {
      const lines = debugWrapperStore.getRecentOutput(20)
      return (
        <Flex direction="column">
          <Text>Process Output ({lines.length} lines)</Text>
          <Text />
          {lines.map(line => (
            <Text>{line}</Text>
          ))}
        </Flex>
      )
    } else if (debugWrapperStore.activeTab === 'scopes') {
      const state = debugStore.getState()
      const scopes =
        state.matchedScopes.length > 0
          ? state.matchedScopes
          : state.renderTree.map(n => n.name || n.id || 'scope')
      return (
        <Flex direction="column">
          <Text>Scopes ({scopes.length})</Text>
          <Text />
          {scopes.length === 0 ? (
            <Text color="gray">No scopes registered</Text>
          ) : (
            scopes.map((s, i) => (
              <Text key={i}>{typeof s === 'string' ? s : JSON.stringify(s)}</Text>
            ))
          )}
          {state.selectedScope ? <Text>Selected: {String(state.selectedScope)}</Text> : null}
        </Flex>
      )
    } else if (debugWrapperStore.activeTab === 'events') {
      const events = debugStore.getState().events.slice(-20)
      return (
        <Flex direction="column">
          <Text>Events ({debugStore.getState().events.length} total)</Text>
          <Text />
          {events.length === 0 ? (
            <Text color="gray">No events yet</Text>
          ) : (
            events.map(ev => (
              <Text key={ev.id}>
                [{ev.level}] {ev.category}: {ev.message}
              </Text>
            ))
          )}
        </Flex>
      )
    } else if (debugWrapperStore.activeTab === 'performance') {
      const metrics = [...debugStore.getState().performanceMetrics.entries()]
      return (
        <Flex direction="column">
          <Text>Performance</Text>
          <Text />
          {metrics.length === 0 ? (
            <Text color="gray">No metrics recorded</Text>
          ) : (
            metrics.map(([name, m]) => (
              <Text key={name}>
                {name}: n={m.count} avg=
                {m.count ? (m.totalTime / m.count).toFixed(2) : 0}ms min={m.minTime}
                ms max={m.maxTime}ms
              </Text>
            ))
          )}
        </Flex>
      )
    } else if (debugWrapperStore.activeTab === 'state') {
      return <StateInspector />
    }
    return null
  }

  // Status bar
  const StatusBar = () => (
    <Flex direction="row">
      <Text>D: toggle | 1-7: tabs | C: clear logs/output | Q: quit</Text>
      <spacer />
      <Text>Debug Mode: {debugWrapperStore.activeTab}</Text>
    </Flex>
  )

  // Return the debug panel
  return (
    <Flex direction="column">
      <Box>
        <Flex direction="column">
          <TabBar />
          <Text />
          <Box>
            <TabContent />
          </Box>
          <Text />
          <StatusBar />
        </Flex>
      </Box>
    </Flex>
  )
}
