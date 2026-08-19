<script lang="ts">
import CodeBlock from '$lib/components/CodeBlock.svelte'

const demos = [
  {
    id: 'brand',
    title: 'Brand — wordmark, braille, gradient borders',
    blurb:
      'Half-block wordmark with per-glyph gradient, 2×4 braille sparklines, and Lipgloss-style gradient border boxes — all pure ANSI, no graphics protocol required.',
    grid: '100×30',
    file: 'brand.png',
  },
  {
    id: 'kit',
    title: 'Kit — agent workbench',
    blurb:
      'Session list, transcript, composer, and file pane. Tab focus, / command palette, ? help overlay — all on the overlay layer with scrim.',
    grid: '100×30',
    keys: ['tab', '/', '?', 'esc'],
    file: 'kit.png',
  },
  {
    id: 'kit-120x40',
    title: 'Kit — wide layout (120×40)',
    blurb:
      'The same workbench at 120 columns: sidebar, file list, composer, and status footer stretch into the wider grid with the overlay layer still active.',
    grid: '120×40',
    keys: ['tab', '/', '?', 'esc'],
    file: 'kit-120x40.png',
  },
  {
    id: 'kit-80x24-palette',
    title: 'Kit — command palette (80×24)',
    blurb:
      'The / command palette rendered as an overlay above the 80×24 workbench. Scrim dims the background; fuzzy filter narrows commands in real time.',
    grid: '80×24',
    keys: ['/'],
    file: 'kit-80x24-palette.png',
  },
  {
    id: 'tasks',
    title: 'Tasks — focus ring + confirm',
    blurb:
      'bind:value two-way input in the focus ring, j/k cursor, space toggles, x opens a scrim confirm modal, 1/2/3 filters.',
    grid: '100×30',
    keys: ['tab', 'j/k', 'space', 'x', '1/2/3'],
    file: 'tasks.png',
  },
  {
    id: 'dash',
    title: 'Dash — live metrics',
    blurb:
      'Interval-driven state through the MVU loop: sparklines trace history, bars track saturation, service statuses react to error rate.',
    grid: '100×30',
    keys: ['p', 'r', 't'],
    file: 'dash.png',
  },
  {
    id: 'forms',
    title: 'Forms — bind:value proof',
    blurb:
      'Two-way binding end to end: typed characters write through the bound rune, the focused field shows its cursor, and derived preview stays live.',
    grid: '100×30',
    keys: ['tab', 'enter', 'esc'],
    file: 'forms.png',
  },
]

const heroCode = `/** @jsxImportSource @tuix/jsx */
import { $state } from '@tuix/reactive'
import { Modal, KbdHint, useUITheme } from '@tuix/ui'

export default function Tasks() {
  const { theme } = useUITheme()
  const confirm = $state(false, 'confirm')

  return (
    <vstack>
      <text bg={theme.colors.primary}>{' Tuix Tasks '}</text>
      {/* ... rows, filters, focus-ring input ... */}
      <Modal open={confirm()} scrim title="Delete task?">
        <text>Are you sure?</text>
      </Modal>
      <KbdHint keys="x" label="delete" />
    </vstack>
  )
}`
</script>

<svelte:head>
	<title>Gallery · Tuix</title>
	<meta
		name="description"
		content="Real example apps photographed in a live PTY — workbench, tasks, dashboard, forms."
	/>
</svelte:head>

<div class="container page-hero">
	<p class="eyebrow">Evidence</p>
	<h1>Gallery</h1>
	<p>
		Every screenshot below is a real GPU-rendered capture from a Ghostty window at the labeled grid
		size — truecolor, real fonts, real terminal compositing via the <code>@tuix/ghostty</code>
		capture package.
	</p>
</div>

<section class="section">
	<div class="container">
		{#each demos as demo, i (demo.id)}
			<article class="demo" class:flip={i % 2 === 1}>
				<div class="shot">
					<img
						src="/evidence/{demo.file}"
						alt="{demo.title} — live PTY capture"
						loading={i === 0 ? 'eager' : 'lazy'}
						width={1848}
						height={1188}
					/>
					<div class="shot-meta">
						<span>{demo.grid} · Ghostty capture</span>
						{#if demo.keys}<span class="keys">{demo.keys.join(' · ')}</span>{/if}
					</div>
				</div>
				<div class="desc">
					<h2>{demo.title}</h2>
					<p>{demo.blurb}</p>
					{#if demo.keys}
						<div class="key-chips">
							{#each demo.keys as k (k)}
								<kbd>{k}</kbd>
							{/each}
						</div>
					{/if}
					{#if demo.id === 'tasks'}
						<div class="snippet">
							<CodeBlock code={heroCode} lang="tsx" filename="tasks.tsx" terminal={false} />
						</div>
					{/if}
				</div>
			</article>
		{/each}
	</div>
</section>

<style>
	.demo {
		display: grid;
		grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
		gap: 2rem;
		align-items: start;
		padding: 2rem 0;
		border-top: 1px solid var(--border);
	}

	.demo:first-child {
		border-top: 0;
	}

	@media (max-width: 860px) {
		.demo {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.shot img {
		width: 100%;
		height: auto;
		border-radius: 12px;
		border: 1px solid var(--border);
		display: block;
		background: #070b10;
	}

	.shot-meta {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		color: var(--text-muted);
		font-size: 0.78rem;
		font-family: var(--mono);
		margin-top: 0.5rem;
	}

	.keys {
		color: var(--accent);
	}

	.desc h2 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		letter-spacing: -0.01em;
	}

	.desc p {
		margin: 0;
		color: var(--text-muted);
	}

	.key-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.9rem;
	}

	kbd {
		font-family: var(--mono);
		font-size: 0.75rem;
		padding: 0.15rem 0.5rem;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--text);
	}

	.snippet {
		margin-top: 0.9rem;
	}
</style>
