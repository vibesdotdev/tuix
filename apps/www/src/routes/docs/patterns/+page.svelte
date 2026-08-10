<script lang="ts">
import DocsSidebar from '$lib/components/DocsSidebar.svelte'
import {
	commonPatterns,
	uniquePatterns,
	patternHref,
	patterns,
} from '$lib/content/patterns'
</script>

<svelte:head>
	<title>Patterns · Tuix Docs</title>
	<meta
		name="description"
		content="Common CLI and TUI patterns, and Tuix-unique paradigms such as named state and JSX-to-MVU."
	/>
</svelte:head>

<div class="container docs-layout">
	<DocsSidebar />
	<article class="prose">
		<p class="docs-kicker">How Tuix thinks</p>
		<h1>Patterns</h1>
		<p class="docs-lead">
			Common CLI and TUI problems. Paradigms that are unique to Tuix. Read these when a tutorial is
			not enough and you need the rule behind the sample.
		</p>

		<p class="stats">
			<strong>{patterns.length}</strong> patterns ·
			<span class="unique">{uniquePatterns.length} unique to Tuix</span> ·
			<span class="common">{commonPatterns.length} common CLI/TUI</span>
		</p>

		<section class="band unique-band">
			<h2>Unique to Tuix</h2>
			<p>
				These rules surprise people who come from web frameworks or ad-hoc chalk scripts. Learn them
				early.
			</p>
			<div class="grid">
				{#each uniquePatterns as p}
					<a class="card unique" href={patternHref(p.slug)}>
						<span class="tag">Unique · {p.category}</span>
						<span class="title">{p.title}</span>
						<span class="sum">{p.summary}</span>
					</a>
				{/each}
			</div>
		</section>

		<section class="band">
			<h2>Common CLI and TUI patterns</h2>
			<p>
				Layout, routing, async, input, process control, and data. The Tuix shape of each pattern is
				documented below.
			</p>
			<div class="grid">
				{#each commonPatterns as p}
					<a class="card" href={patternHref(p.slug)}>
						<span class="tag">{p.category}</span>
						<span class="title">{p.title}</span>
						<span class="sum">{p.summary}</span>
					</a>
				{/each}
			</div>
		</section>

		<section class="band">
			<h2>Suggested path</h2>
			<ol>
				<li>
					<a href={patternHref('jsx-to-mvu')}>JSX → MVU</a> and
					<a href={patternHref('named-state')}> named state</a>
				</li>
				<li>
					<a href={patternHref('cli-routing')}>CLI routing</a> and
					<a href={patternHref('interactive-mode')}> interactive mode</a>
				</li>
				<li>
					<a href={patternHref('keys-focus-paste')}>Keys / focus / paste</a>,
					<a href={patternHref('layout')}> layout</a>,
					<a href={patternHref('async-cmd-sub')}> async</a>
				</li>
				<li>
					<a href={patternHref('platform-live')}>Platform Live</a>,
					<a href={patternHref('pty')}> PTY</a>,
					<a href={patternHref('runtime-hooks')}> hooks</a>
				</li>
			</ol>
			<p>
				Then build with the
				<a href="/docs/tutorials">tutorial path</a>.
			</p>
		</section>
	</article>
</div>

<style>
	.stats {
		font-family: var(--mono);
		font-size: 0.9rem;
		color: var(--text-muted);
		margin-bottom: 1.75rem !important;
	}

	.unique {
		color: var(--accent);
	}

	.common {
		color: var(--cyan);
	}

	.band {
		margin-top: 2rem;
	}

	.band > p {
		margin-bottom: 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.card {
		display: grid;
		gap: 0.35rem;
		padding: 1rem 1.1rem;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--bg-card);
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.12s ease,
			background 0.12s ease;
	}

	.card:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
		text-decoration: none;
	}

	.card.unique {
		border-color: rgba(52, 211, 153, 0.28);
	}

	.tag {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--cyan);
	}

	.card.unique .tag {
		color: var(--accent);
	}

	.title {
		font-weight: 700;
		font-size: 1.02rem;
	}

	.sum {
		color: var(--text-muted);
		font-size: 0.92rem;
		line-height: 1.45;
	}

	.band ol {
		padding-left: 1.2rem;
	}

	.band li {
		margin-bottom: 0.45rem;
	}
</style>
