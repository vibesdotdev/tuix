/** @jsxImportSource @tuix/jsx */

import { style } from '@tuix/ansi'
import {
  Accordion,
  Alert,
  Avatar,
  Breadcrumbs,
  Kbd,
  KbdHint,
  Skeleton,
  SkeletonText,
  Sparkline,
  Toast,
  useUITheme,
} from '@tuix/ui'

const LATENCY = [42, 38, 51, 47, 62, 58, 44, 39, 55, 61, 48, 43]
const THROUGHPUT = [3, 5, 4, 7, 6, 9, 8, 12, 10, 14]

function Section({ title, children }: { title: string; children: unknown }): JSX.Element {
  const { theme } = useUITheme()
  return (
    <vstack gap={0}>
      <text fg={theme.colors.textDim}>{`— ${title}`}</text>
      {children}
    </vstack>
  )
}

export default function Widgets() {
  const { theme, depth } = useUITheme()

  return (
    <vstack gap={1}>
      <text style={style().bold()} fg={theme.colors.textBright}>
        Widget gallery
      </text>

      <Section title="Breadcrumbs">
        <Breadcrumbs
          items={[{ label: 'apps' }, { label: 'demo' }, { label: 'src' }, { label: 'kit.tsx' }]}
        />
      </Section>

      <Section title="Accordion">
        <Accordion
          defaultOpen={0}
          items={[
            { title: 'Session', children: '3 open · rewrite auth active' },
            { title: 'Files', children: 'sessions-open.ts · login.ts · store.ts' },
          ]}
        />
      </Section>

      <Section title="Kbd + KbdHint">
        <hstack gap={2}>
          <KbdHint keys="/" label="commands" />
          <KbdHint keys="?" label="help" />
          <KbdHint keys="ctrl+k" label="clear" />
        </hstack>
      </Section>

      <Section title="Avatar">
        <hstack gap={2}>
          <Avatar name="Ada Lovelace" />
          <Avatar name="Grace Hopper" size="small" />
          <Avatar glyph="✿" size="large" />
        </hstack>
      </Section>

      <Section title="Sparkline">
        <Sparkline values={LATENCY} label="p99 ms" />
        <Sparkline values={THROUGHPUT} variant="line" label="ops/s" />
      </Section>

      <Section title="Skeleton">
        <hstack gap={2}>
          <Skeleton width={14} height={3} />
          <SkeletonText lines={3} width={24} />
        </hstack>
      </Section>

      <Section title="Alert">
        <vstack gap={1}>
          <Alert variant="info" title="Sync">
            Last push 2 minutes ago.
          </Alert>
          <Alert variant="success">All checks passed.</Alert>
          <Alert variant="warning" title="Read-only">
            Workspace is in review mode.
          </Alert>
          <Alert variant="danger">Build failed on 2 tests.</Alert>
        </vstack>
      </Section>

      <Section title="Toast">
        <hstack gap={2}>
          <Toast kind="info" message="Connected" />
          <Toast kind="success" message="Saved" />
          <Toast kind="warning" message="Retry queued" />
          <Toast kind="danger" message="Offline" />
        </hstack>
      </Section>

      <box border="thin" borderColor={theme.colors.borderSubtle} background={depth.surface}>
        <text fg={theme.colors.textDim}>
          Every color above comes from theme.colors or theme.depth — no widget hardcodes hex.
        </text>
      </box>
    </vstack>
  )
}
