/** @jsxImportSource @tuix/jsx */

/**
 * Interactive System Dashboard - Live monitoring interface
 *
 * Demonstrates building a real-time dashboard with TUIX that rivals
 * any blessed implementation. Features:
 * - Live metric updates every second
 * - Animated progress bars
 * - Real-time log streaming
 * - Process monitoring
 * - Clean, professional styling
 */

import { style, colors, textGradient, oceanGradient } from '@tuix/ansi'
import { $state, $derived } from '@tuix/reactive'
import { Effect } from 'effect'

export default function DashboardInteractive() {
  // Reactive metrics
  const cpuUsage = $state(45)
  const memoryUsage = $state(67)
  const diskUsage = $state(82)
  const networkIn = $state(125)
  const networkOut = $state(87)
  const uptime = $state(453674) // seconds

  // Process list
  const processes = $state([
    { pid: '1234', name: 'node', cpu: 25, mem: 512 },
    { pid: '5678', name: 'bun', cpu: 15, mem: 256 },
    { pid: '9012', name: 'postgres', cpu: 5, mem: 1200 },
  ])

  // Logs
  const logs = $state<Array<{
    level: 'info' | 'warn' | 'error'
    time: string
    message: string
  }>>([
    { level: 'info', time: '14:23:45', message: 'Server started on port 3000' },
    { level: 'warn', time: '14:24:12', message: 'High memory usage detected' },
    { level: 'error', time: '14:24:30', message: 'Database connection timeout' },
    { level: 'info', time: '14:25:01', message: 'Request processed: GET /api/users' },
  ])

  // Derived states
  const systemHealth = $derived(() => {
    const avgUsage = (cpuUsage() + memoryUsage() + diskUsage()) / 3
    if (avgUsage > 80) return { status: 'Critical', color: colors.red }
    if (avgUsage > 60) return { status: 'Warning', color: colors.yellow }
    return { status: 'Healthy', color: colors.green }
  })

  const uptimeFormatted = $derived(() => {
    const seconds = uptime()
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  })

  // Simulate live updates
  Effect.runPromise(Effect.gen(function* () {
    while (true) {
      yield* Effect.sleep(1000)

      // Update CPU (random walk)
      cpuUsage.$set(Math.max(10, Math.min(95, cpuUsage() + (Math.random() - 0.5) * 10)))

      // Update memory (slow increase)
      memoryUsage.$set(Math.max(50, Math.min(90, memoryUsage() + (Math.random() - 0.3) * 3)))

      // Update disk (very slow)
      diskUsage.$set(Math.max(70, Math.min(95, diskUsage() + (Math.random() - 0.48) * 0.5)))

      // Update network
      networkIn.$set(Math.max(50, Math.min(250, Math.floor(networkIn() + (Math.random() - 0.5) * 30))))
      networkOut.$set(Math.max(30, Math.min(200, Math.floor(networkOut() + (Math.random() - 0.5) * 25))))

      // Update process CPU
      processes.$set(processes().map(p => ({
        ...p,
        cpu: Math.max(1, Math.min(50, p.cpu + (Math.random() - 0.5) * 5))
      })))

      // Increment uptime
      uptime.$set(uptime() + 1)

      // Add log every 5 seconds
      if (uptime() % 5 === 0) {
        const logMessages = [
          { level: 'info' as const, message: `Request processed: GET /api/data/${Math.floor(Math.random() * 1000)}` },
          { level: 'info' as const, message: 'Health check passed' },
          { level: 'warn' as const, message: `Slow query detected: ${Math.floor(Math.random() * 500)}ms` },
        ]
        const newLog = {
          ...logMessages[Math.floor(Math.random() * logMessages.length)],
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
        logs.$set([...logs().slice(-9), newLog])
      }
    }
  }))

  const renderProgressBar = (percentage: number, width: number = 16) => {
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled
    const color = percentage > 80 ? colors.red : percentage > 60 ? colors.yellow : colors.green

    return (
      <hstack>
        <text style={style().fg(color)}>
          {'█'.repeat(filled)}
        </text>
        <text style={style().faint().fg(colors.gray)}>
          {'░'.repeat(empty)}
        </text>
        <text> </text>
        <text style={style().bold()}>{Math.round(percentage)}%</text>
      </hstack>
    )
  }

  return (
    <vstack>
      {/* Header */}
      <box border="double" padding={1} style={style().bg(colors.black)}>
        <hstack>
          <text>{textGradient({ gradient: oceanGradient(), text: '📊 TUIX System Dashboard' })}</text>
          <text style={style().faint().fg(colors.gray)}> • Live Monitoring</text>
        </hstack>
      </box>

      <text></text>

      {/* Metrics row */}
      <hstack>
        {/* CPU Panel */}
        <box border="rounded" padding={1} style={style().fg(colors.blue)}>
          <vstack>
            <text style={style().bold()}>⚡ CPU Usage</text>
            <text></text>
            {renderProgressBar(cpuUsage())}
            <text></text>
            <text style={style().faint()}>4 cores @ 3.2 GHz</text>
            <text style={style().faint()}>Temp: 62°C</text>
          </vstack>
        </box>

        <text>  </text>

        {/* Memory Panel */}
        <box border="rounded" padding={1} style={style().fg(colors.magenta)}>
          <vstack>
            <text style={style().bold()}>💾 Memory</text>
            <text></text>
            {renderProgressBar(memoryUsage())}
            <text></text>
            <text style={style().faint()}>
              {(memoryUsage() * 16 / 100).toFixed(1)} GB / 16 GB
            </text>
            <text style={style().faint()}>Swap: 2.1 GB</text>
          </vstack>
        </box>

        <text>  </text>

        {/* Disk Panel */}
        <box border="rounded" padding={1} style={style().fg(colors.yellow)}>
          <vstack>
            <text style={style().bold()}>💿 Disk I/O</text>
            <text></text>
            {renderProgressBar(diskUsage())}
            <text></text>
            <text style={style().faint()}>
              {(diskUsage() * 500 / 100).toFixed(0)} GB / 500 GB
            </text>
            <text style={style().faint()}>R/W: 45 MB/s</text>
          </vstack>
        </box>

        <text>  </text>

        {/* Network Panel */}
        <box border="rounded" padding={1} style={style().fg(colors.cyan)}>
          <vstack>
            <text style={style().bold()}>🌐 Network</text>
            <text></text>
            <text style={style().fg(colors.green)}>↓ {networkIn()} MB/s</text>
            <text style={style().fg(colors.red)}>↑ {networkOut()} MB/s</text>
            <text></text>
            <text style={style().faint()}>eth0: active</text>
            <text style={style().faint()}>IP: 10.0.1.42</text>
          </vstack>
        </box>
      </hstack>

      <text></text>

      {/* Bottom row */}
      <hstack>
        {/* Process list */}
        <box border="double" padding={1} style={style().fg(colors.white)}>
          <vstack>
            <text style={style().bold().fg(colors.cyan)}>🔄 Running Processes</text>
            <text></text>
            {/* Header */}
            <hstack>
              <text style={style().bold()}>PID    </text>
              <text style={style().bold()}>Name      </text>
              <text style={style().bold()}>CPU   </text>
              <text style={style().bold()}>Memory</text>
            </hstack>
            <text style={style().fg(colors.gray)}>──────────────────────────────────</text>
            {/* Processes */}
            {processes().map(proc => (
              <hstack key={proc.pid}>
                <text style={style().fg(colors.yellow)}>{proc.pid.padEnd(7)}</text>
                <text>{proc.name.padEnd(10)}</text>
                <text style={style().fg(proc.cpu > 20 ? colors.red : colors.green)}>
                  {Math.round(proc.cpu)}%{' '.repeat(4 - Math.round(proc.cpu).toString().length)}
                </text>
                <text style={style().fg(colors.magenta)}>
                  {proc.mem > 1000 ? `${(proc.mem / 1024).toFixed(1)} GB` : `${proc.mem} MB`}
                </text>
              </hstack>
            ))}
            <text></text>
            <text style={style().faint().fg(colors.gray)}>Total: {processes().length} processes</text>
          </vstack>
        </box>

        <text>  </text>

        {/* Logs panel */}
        <box border="double" padding={1} style={style().fg(colors.white)}>
          <vstack>
            <text style={style().bold().fg(colors.cyan)}>📋 System Logs</text>
            <text></text>
            {logs().map((log, i) => {
              const levelStyle =
                log.level === 'error' ? style().bg(colors.red).fg(colors.white).bold() :
                log.level === 'warn' ? style().bg(colors.yellow).fg(colors.black).bold() :
                style().bg(colors.blue).fg(colors.white).bold()

              return (
                <vstack key={i}>
                  <hstack>
                    <text style={levelStyle}> {log.level.toUpperCase()} </text>
                    <text style={style().faint().fg(colors.gray)}> {log.time}</text>
                  </hstack>
                  <text style={style().fg(colors.white)}>{log.message}</text>
                  {i < logs().length - 1 && <text></text>}
                </vstack>
              )
            })}
          </vstack>
        </box>
      </hstack>

      <text></text>

      {/* Status bar */}
      <box padding={1} style={style().bg(systemHealth().color).fg(colors.black)}>
        <hstack>
          <text style={style().bold()}>● System {systemHealth().status}</text>
          <text> • </text>
          <text>Uptime: {uptimeFormatted()}</text>
          <text> • </text>
          <text>Updated: just now</text>
          <text> • </text>
          <text style={style().faint()}>Refreshing every 1s • Press 'r' to force refresh • 'q' to quit</text>
        </hstack>
      </box>
    </vstack>
  )
}
