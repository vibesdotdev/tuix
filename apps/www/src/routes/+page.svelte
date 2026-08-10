<script lang="ts">
import CodeBlock from '$lib/components/CodeBlock.svelte'

const features = [
	{
		tag: 'Authoring',
		title: 'JSX for the terminal',
		body: 'Write TUIs with familiar JSX. compileToComponent and toView feed the Effect MVU loop — not a parallel render system.',
	},
	{
		tag: 'State',
		title: 'Runes that hit the model',
		body: 'Named $state / $states extract under Bun. $set bridges into MVU so re-renders hydrate paint from the model, not ephemeral closures.',
	},
	{
		tag: 'Runtime',
		title: 'Effect-powered MVU',
		body: 'init · update · view with RuntimeHooks, subscriptions, error recovery, and a single execution model.',
	},
	{
		tag: 'Terminal',
		title: 'Caps, graphics, input',
		body: 'Capability detection, sixel/kitty/iTerm encode, bracketed paste, focus tracking, continuous readLine, and Live services via @tuix/platform.',
	},
	{
		tag: 'Process',
		title: 'PTY production path',
		body: 'ProcessManager spawns interactive TTYs with write/resize, auto-restart, and stream helpers.',
	},
	{
		tag: 'Quality',
		title: 'Gates that match the code',
		body: 'Architecture boundary tests, full bun test suite, typecheck-v1 delivery entries, and full-tree Biome on source.',
	},
]

const heroCode = `import { $state } from '@tuix/reactive'
import { runApp } from '@tuix/jsx'

function Counter() {
  const count = $state(0, 'count')
  return (
    <vstack>
      <text>Count: {count()}</text>
    </vstack>
  )
}

await runApp(Counter, { interactive: true })`

const cliCode = `$ bun run tuix --help

tuix — Terminal UI framework

Available commands:
  version — Show TUIX version and system information
  help — Interactive help explorer
  dashboard — System status dashboard with live metrics

Run: tuix <command> [--help]

$ bun test
# architecture · spine · catalog · full suite`
</script>

<svelte:head>
	<title>Tuix — Terminal UI for Bun</title>
	<meta
		name="description"
		content="Bun-native terminal UI framework with JSX, reactive runes, and Effect MVU. Ship product CLIs and interactive TUIs."
	/>
</svelte:head>

<section class="hero">
	<div class="container hero-grid">
		<div>
			<div class="eyebrow">v1.0.0-rc.3 · Bun-native · MIT</div>
			<h1>Terminal apps with JSX, runes, and Effect MVU</h1>
			<p class="lead">
				Tuix is a full-stack framework for building rich CLI and TUI products on Bun. Author in JSX,
				keep state one-way through Model/Update/View, and ship with live terminal I/O, graphics, and
				PTY.
			</p>
			<div class="hero-actions">
				<a class="btn btn-primary" href="/get-started">Get started</a>
				<a class="btn btn-ghost" href="/docs">Read the docs</a>
			</div>
			<div class="meta-row">
				<span><strong>22</strong> packages</span>
				<span><strong>Effect</strong> side effects</span>
				<span><strong>Bun</strong> only runtime</span>
			</div>
		</div>

		<div class="hero-code">
			<CodeBlock
				code={heroCode}
				lang="tsx"
				filename="counter.tsx"
				terminal
				label="Example counter"
			/>
		</div>
	</div>
</section>

<section class="section band">
	<div class="container">
		<div class="section-head">
			<h2>Built for product CLIs and interactive TUIs</h2>
			<p>
				Dogfood the same stack the framework uses: the <code>tuix</code> CLI ships version,
				interactive help, and dashboard on the real runtime path.
			</p>
		</div>
		<div class="cards">
			{#each features as f}
				<article class="card">
					<span class="tag">{f.tag}</span>
					<h3>{f.title}</h3>
					<p>{f.body}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<section class="section">
	<div class="container two-col">
		<div>
			<div class="section-head">
				<h2>What you get in v1</h2>
				<p>Public APIs across the monorepo are implemented and gated — not placeholder stubs.</p>
			</div>
			<ul class="checklist">
				<li>JSX → View → Effect MVU pipeline</li>
				<li>Named runes, $set → MVU bridge, key handlers</li>
				<li>Live Terminal / Input / Renderer / Storage layers</li>
				<li>Graphics encode (sixel, kitty, iTerm2) + write path</li>
				<li>PTY spawn / write / resize via ProcessManager</li>
				<li>Config JSON, YAML, TOML, env</li>
				<li>useStorage, testing harness + e2e PTY harness</li>
				<li>Architecture boundary tests + catalog completeness tests</li>
			</ul>
		</div>
		<div>
			<CodeBlock code={cliCode} lang="bash" filename="terminal" terminal label="CLI demo" />
		</div>
	</div>
</section>

<section class="section band">
	<div class="container cta">
		<h2>Ship your next terminal product on Tuix</h2>
		<p>
			Install from the monorepo, read the guides, and build with the same APIs we test every run.
		</p>
		<div class="hero-actions" style="justify-content: center">
			<a class="btn btn-primary" href="/get-started">Get started</a>
			<a class="btn btn-ghost" href="/docs/architecture">Architecture</a>
		</div>
	</div>
</section>

<style>
	.hero-code :global(.code-block) {
		margin: 0;
	}

	.cta {
		text-align: center;
	}

	.cta h2 {
		margin: 0 0 0.75rem;
	}

	.cta p {
		color: var(--text-muted);
		margin: 0 0 1.5rem;
	}
</style>
