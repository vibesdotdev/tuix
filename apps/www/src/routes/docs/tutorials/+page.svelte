<script lang="ts">
import DocsSidebar from '$lib/components/DocsSidebar.svelte'
import { tutorials, tutorialHref } from '$lib/content/tutorials'
</script>

<svelte:head>
	<title>Tutorials · Tuix Docs</title>
	<meta
		name="description"
		content="Build common Tuix apps with increasing difficulty. Each tutorial shows JSX and Effect Model-View-Update (MVU) styles."
	/>
</svelte:head>

<div class="container docs-layout">
	<DocsSidebar />
	<article class="prose">
		<p class="docs-kicker">Learn by building</p>
		<h1>Tutorials</h1>
		<p class="docs-lead">
			Work through nine projects of rising difficulty. Each page has tabs so you can compare the
			<strong>JSX</strong> product path with an explicit <strong>Effect Model-View-Update (MVU)</strong>
			style. Pair each tutorial with a
			<a href="/docs/patterns">pattern page</a> when you need the rule behind the sample.
		</p>

		<div class="intro-cards">
			<section class="intro-card">
				<h2>How to use the tabs</h2>
				<ul>
					<li>
						<strong>JSX</strong> — prefer this path for product CLIs and demos under Bun.
					</li>
					<li>
						<strong>Effect MVU</strong> — use this path when you want init, update, and view under
						your control.
					</li>
				</ul>
				<p>
					Both styles end in the same runtime. Pick one style for a given app. Stay consistent.
				</p>
			</section>
			<section class="intro-card">
				<h2>Path map</h2>
				<p>
					Start at Hello world. Stop when the outcome matches your goal. Return later for Pseudo-Terminal
					(PTY) and Live services.
				</p>
			</section>
		</div>

		<ol class="path">
			{#each tutorials as t}
				<li>
					<a class="path-card" href={tutorialHref(t.slug)}>
						<div class="path-top">
							<span class="level">{t.levelLabel}</span>
							<span class="num">Level {t.level}</span>
						</div>
						<span class="title">{t.title}</span>
						<span class="sum">{t.summary}</span>
						<span class="outcome"><strong>Outcome:</strong> {t.outcome}</span>
						<span class="go">Open tutorial →</span>
					</a>
				</li>
			{/each}
		</ol>
	</article>
</div>

<style>
	.intro-cards {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.85rem;
		margin: 1.35rem 0 2rem;
	}

	@media (min-width: 720px) {
		.intro-cards {
			grid-template-columns: 1.2fr 0.8fr;
		}
	}

	.intro-card {
		padding: 1.1rem 1.2rem;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--bg-card);
	}

	.intro-card h2 {
		margin: 0 0 0.65rem !important;
		font-size: 0.95rem !important;
	}

	.intro-card ul {
		margin: 0 0 0.75rem;
		padding-left: 1.15rem;
	}

	.intro-card li {
		margin-bottom: 0.4rem;
	}

	.intro-card p {
		margin: 0;
	}

	.path {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem;
		display: grid;
		gap: 0.85rem;
	}

	.path-card {
		display: grid;
		gap: 0.45rem;
		padding: 1.15rem 1.25rem 1.2rem;
		border: 1px solid var(--border);
		border-radius: 14px;
		background: var(--bg-card);
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.12s ease,
			background 0.12s ease,
			transform 0.12s ease;
	}

	.path-card:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
		text-decoration: none;
		transform: translateY(-1px);
	}

	.path-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.level {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--cyan);
	}

	.num {
		font-family: var(--mono);
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.title {
		font-weight: 700;
		font-size: 1.12rem;
		letter-spacing: -0.02em;
		color: var(--text);
	}

	.sum {
		color: var(--text-muted);
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.outcome {
		margin-top: 0.15rem;
		padding-top: 0.65rem;
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.88rem;
		line-height: 1.45;
	}

	.outcome strong {
		color: var(--text);
		font-weight: 600;
	}

	.go {
		font-family: var(--mono);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--accent);
		margin-top: 0.15rem;
	}
</style>
