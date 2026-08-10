/** @jsxImportSource @tuix/jsx */

/**
 * Dashboard Demo - Multi-panel system monitoring interface
 *
 * Demonstrates how to build complex layouts similar to exemplar's
 * multi-panel dashboards. Shows:
 * - Multiple panels with different data
 * - Real-time metrics display
 * - Status indicators
 * - Progress bars
 * - Color-coded alerts
 */

import { style, colors, textGradient, oceanGradient } from '@tuix/ansi'

export default function DashboardDemo() {
  // Simulate system metrics
  const cpuUsage = 45
  const memoryUsage = 67
  const diskUsage = 82
  const networkIn = '125 MB/s'
  const networkOut = '87 MB/s'

  // Simulate process list
  const processes = [
    { pid: '1234', name: 'node', cpu: '25%', mem: '512 MB' },
    { pid: '5678', name: 'bun', cpu: '15%', mem: '256 MB' },
    { pid: '9012', name: 'postgres', cpu: '5%', mem: '1.2 GB' },
  ]

  // Simulate recent logs
  const logs = [
    { level: 'info', time: '14:23:45', message: 'Server started on port 3000' },
    { level: 'warn', time: '14:24:12', message: 'High memory usage detected' },
    { level: 'error', time: '14:24:30', message: 'Database connection timeout' },
    { level: 'info', time: '14:25:01', message: 'Request processed: GET /api/users' },
  ]

  const renderProgressBar = (percentage: number, width: number = 20) => {
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled
    const color = percentage > 80 ? colors.red : percentage > 60 ? colors.yellow : colors.green

    return (
      <text style={style().fg(color)}>
        {'█'.repeat(filled)}
        <text style={style().faint()}>{'░'.repeat(empty)}</text> {percentage}%
      </text>
    )
  }

  return (
    <vstack>
      {/* Header */}
      <box border="double" padding={1} style={style().bg(colors.black)}>
        <hstack>
          <text>
            {textGradient({ gradient: oceanGradient(), text: '📊 TUIX System Dashboard' })}
          </text>
          <text style={style().faint().fg(colors.gray)}> • Live monitoring</text>
        </hstack>
      </box>

      <text></text>

      {/* Top row - System metrics */}
      <hstack>
        {/* CPU Panel */}
        <box border="rounded" padding={1} style={style().fg(colors.blue)}>
          <vstack>
            <text style={style().bold()}>⚡ CPU Usage</text>
            <text></text>
            {renderProgressBar(cpuUsage)}
            <text></text>
            <text style={style().faint()}>4 cores @ 3.2 GHz</text>
            <text style={style().faint()}>Load: 1.2, 1.5, 1.8</text>
          </vstack>
        </box>

        <text> </text>

        {/* Memory Panel */}
        <box border="rounded" padding={1} style={style().fg(colors.magenta)}>
          <vstack>
            <text style={style().bold()}>💾 Memory</text>
            <text></text>
            {renderProgressBar(memoryUsage)}
            <text></text>
            <text style={style().faint()}>10.7 GB / 16 GB</text>
            <text style={style().faint()}>Swap: 2.1 GB</text>
          </vstack>
        </box>

        <text> </text>

        {/* Disk Panel */}
        <box border="rounded" padding={1} style={style().fg(colors.yellow)}>
          <vstack>
            <text style={style().bold()}>💿 Disk Usage</text>
            <text></text>
            {renderProgressBar(diskUsage)}
            <text></text>
            <text style={style().faint()}>410 GB / 500 GB</text>
            <text style={style().faint()}>I/O: 15 MB/s</text>
          </vstack>
        </box>

        <text> </text>

        {/* Network Panel */}
        <box border="rounded" padding={1} style={style().fg(colors.cyan)}>
          <vstack>
            <text style={style().bold()}>🌐 Network</text>
            <text></text>
            <text style={style().fg(colors.green)}>↓ {networkIn}</text>
            <text style={style().fg(colors.red)}>↑ {networkOut}</text>
            <text></text>
            <text style={style().faint()}>eth0: active</text>
          </vstack>
        </box>
      </hstack>

      <text></text>

      {/* Bottom row - Processes and logs */}
      <hstack>
        {/* Process list */}
        <box border="double" padding={1} style={style().fg(colors.white)}>
          <vstack>
            <text style={style().bold().fg(colors.cyan)}>🔄 Running Processes</text>
            <text></text>
            {/* Header */}
            <hstack>
              <text style={style().bold()}>PID </text>
              <text style={style().bold()}>Name </text>
              <text style={style().bold()}>CPU </text>
              <text style={style().bold()}>Memory</text>
            </hstack>
            <text style={style().fg(colors.gray)}>────────────────────────────────</text>
            {/* Processes */}
            {processes.map(proc => (
              <hstack key={proc.pid}>
                <text style={style().fg(colors.yellow)}>{proc.pid.padEnd(7)}</text>
                <text>{proc.name.padEnd(10)}</text>
                <text style={style().fg(colors.green)}>{proc.cpu.padEnd(6)}</text>
                <text style={style().fg(colors.magenta)}>{proc.mem}</text>
              </hstack>
            ))}
          </vstack>
        </box>

        <text> </text>

        {/* Logs panel */}
        <box border="double" padding={1} style={style().fg(colors.white)}>
          <vstack>
            <text style={style().bold().fg(colors.cyan)}>📋 Recent Logs</text>
            <text></text>
            {logs.map((log, i) => {
              const levelStyle =
                log.level === 'error'
                  ? style().bg(colors.red).fg(colors.white).bold()
                  : log.level === 'warn'
                    ? style().bg(colors.yellow).fg(colors.black).bold()
                    : style().bg(colors.blue).fg(colors.white).bold()

              return (
                <vstack key={i}>
                  <hstack>
                    <text style={levelStyle}> {log.level.toUpperCase()} </text>
                    <text style={style().faint().fg(colors.gray)}> {log.time}</text>
                  </hstack>
                  <text style={style().fg(colors.white)}>{log.message}</text>
                  {i < logs.length - 1 && <text></text>}
                </vstack>
              )
            })}
          </vstack>
        </box>
      </hstack>

      <text></text>

      {/* Status bar */}
      <box padding={1} style={style().bg(colors.green).fg(colors.black)}>
        <hstack>
          <text style={style().bold()}>● System Healthy</text>
          <text> • </text>
          <text>Uptime: 5d 12h 34m</text>
          <text> • </text>
          <text>Last update: just now</text>
          <text> • </text>
          <text style={style().faint()}>Press 'r' to refresh • 'q' to quit</text>
        </hstack>
      </box>
    </vstack>
  )
}
