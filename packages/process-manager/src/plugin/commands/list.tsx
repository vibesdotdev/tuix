/**
 * PM List Command - Show all processes
 */

import { Panel, Header, StatusIndicator, Divider, Badge } from '@tuix/ui'
import { box } from '@tuix/view'
import { ProcessManager } from '../../manager'
import { Effect } from 'effect'

export interface PMListProps {
  manager?: ProcessManager
}

export function PMList(props: PMListProps): JSX.Element {
  // Get or create manager
  const manager = props.manager || new ProcessManager()

  // Get all processes
  const processes = manager.list()

  if (processes.length === 0) {
    return (
      <Panel title="Process Manager" variant="primary" rounded>
        <box padding={2}>
          <text dim>No processes configured. Use 'tuix pm add' to add a process.</text>
        </box>
      </Panel>
    )
  }

  return (
    <Panel title="Process Manager" variant="primary" rounded>
      <Header
        title="Managed Processes"
        subtitle={`${processes.length} process${processes.length === 1 ? '' : 'es'} configured`}
      />

      <Divider margin={1} />

      <box flexDirection="column" gap={1}>
        {processes.map((proc) => {
          const statusMap = {
            running: 'active' as const,
            stopped: 'inactive' as const,
            error: 'error' as const,
            crashed: 'error' as const,
            starting: 'info' as const,
            stopping: 'warning' as const,
          }

          const status = statusMap[proc.status] || 'inactive'

          return (
            <box
              key={proc.name}
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              padding={[0.5, 1]}
              backgroundColor={proc.status === 'running' ? 'backgroundAlt' : undefined}
              borderRadius={1}
            >
              <box flexDirection="row" alignItems="center" gap={2}>
                <StatusIndicator
                  status={status}
                  pulse={proc.status === 'running'}
                />
                <text bold>{proc.name}</text>
                {proc.pid && (
                  <text dim>PID: {proc.pid}</text>
                )}
              </box>

              <box flexDirection="row" gap={1}>
                {proc.config.group && (
                  <Badge variant="info" label={proc.config.group} />
                )}
                {proc.restarts > 0 && (
                  <Badge variant="warning" label={`${proc.restarts} restarts`} />
                )}
              </box>
            </box>
          )
        })}
      </box>

      <Divider margin={1} />

      <box>
        <text dim>Use 'tuix pm start &lt;name&gt;' to start a process</text>
      </box>
    </Panel>
  )
}
