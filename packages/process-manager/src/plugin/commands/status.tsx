/**
 * PM Status Command - Show detailed process status
 */

import { Panel, Header, StatusIndicator, Divider, ProgressBar, Badge } from '@tuix/ui'
import { box } from '@tuix/view'
import { ProcessManager } from '../../manager'

export interface PMStatusProps {
  manager?: ProcessManager
  processName?: string
}

export function PMStatus(props: PMStatusProps): JSX.Element {
  const manager = props.manager || new ProcessManager()
  const processes = props.processName
    ? manager.list().filter(p => p.name === props.processName)
    : manager.list()

  if (processes.length === 0) {
    return (
      <Panel title="Process Status" variant="error" rounded>
        <text>Process not found: {props.processName || 'unknown'}</text>
      </Panel>
    )
  }

  return (
    <box flexDirection="column" gap={2}>
      {processes.map(proc => (
        <Panel
          key={proc.name}
          title={proc.name}
          variant={
            proc.status === 'running' ? 'success' : proc.status === 'error' ? 'error' : 'default'
          }
          rounded
        >
          <box flexDirection="column" gap={1.5}>
            {/* Status Row */}
            <box flexDirection="row" gap={2} alignItems="center">
              <text bold color="primary">
                Status:
              </text>
              <StatusIndicator
                status={proc.status === 'running' ? 'active' : 'inactive'}
                label={proc.status.toUpperCase()}
                pulse={proc.status === 'running'}
              />
            </box>

            {/* PID */}
            {proc.pid && (
              <box flexDirection="row" gap={2}>
                <text bold color="primary">
                  PID:
                </text>
                <text>{proc.pid}</text>
              </box>
            )}

            {/* Command */}
            <box flexDirection="row" gap={2}>
              <text bold color="primary">
                Command:
              </text>
              <text>
                {proc.config.command} {proc.config.args?.join(' ')}
              </text>
            </box>

            {/* Uptime */}
            {proc.startTime && proc.status === 'running' && (
              <box flexDirection="row" gap={2}>
                <text bold color="primary">
                  Uptime:
                </text>
                <text>{formatUptime(Date.now() - proc.startTime.getTime())}</text>
              </box>
            )}

            {/* Restarts */}
            {proc.restarts > 0 && (
              <box flexDirection="row" gap={2}>
                <text bold color="primary">
                  Restarts:
                </text>
                <text>{proc.restarts}</text>
                {proc.config.maxRestarts && <text dim>/ {proc.config.maxRestarts} max</text>}
              </box>
            )}

            {/* Resources (if available) */}
            {(proc.memory || proc.cpu) && (
              <>
                <Divider label="Resources" margin={1} />

                {proc.memory && (
                  <ProgressBar
                    value={proc.memory}
                    total={proc.config.maxMemory || 1024}
                    label="Memory"
                    showPercentage
                    variant={
                      proc.memory > (proc.config.maxMemory || 1024) * 0.8 ? 'warning' : 'success'
                    }
                  />
                )}

                {proc.cpu && (
                  <ProgressBar
                    value={proc.cpu}
                    label="CPU"
                    showPercentage
                    variant={proc.cpu > 80 ? 'warning' : 'success'}
                  />
                )}
              </>
            )}

            {/* Error */}
            {proc.lastError && (
              <>
                <Divider margin={1} />
                <box flexDirection="column" gap={0.5}>
                  <text bold color="error">
                    Last Error:
                  </text>
                  <text color="error">{proc.lastError}</text>
                </box>
              </>
            )}

            {/* Config Info */}
            <Divider label="Configuration" margin={1} />

            <box flexDirection="row" gap={2} flexWrap="wrap">
              {proc.config.autorestart && <Badge variant="info" label="Auto-restart" />}
              {proc.config.watch && <Badge variant="info" label="Watch mode" />}
              {proc.config.group && (
                <Badge variant="default" label={`Group: ${proc.config.group}`} />
              )}
            </box>
          </box>
        </Panel>
      ))}
    </box>
  )
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}
