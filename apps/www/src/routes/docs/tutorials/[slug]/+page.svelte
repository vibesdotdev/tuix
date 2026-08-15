<script lang="ts">
import DocsSidebar from '$lib/components/DocsSidebar.svelte'
import CodeTabs from '$lib/components/CodeTabs.svelte'
import { tutorialHref } from '$lib/content/tutorials'
import { packageHref } from '$lib/content/packages'

let { data } = $props()
const tutorial = $derived(data.tutorial)
const prev = $derived(data.prev)
const next = $derived(data.next)

function pkgSlug(name: string) {
  return name.startsWith('@tuix/') ? name.slice('@tuix/'.length) : name
}
</script>

<svelte:head>
	<title>{tutorial.title} · Tutorials · Tuix</title>
	<meta name="description" content={tutorial.summary} />
</svelte:head>

<div class="container docs-layout">
	<DocsSidebar />
	<article class="prose tutorial">
		<p class="docs-kicker">
			Tutorial · Level {tutorial.level} · {tutorial.levelLabel}
		</p>
		<h1>{tutorial.title}</h1>
		<p class="docs-lead">{tutorial.summary}</p>

		<div class="meta-grid">
			<section class="meta-card">
				<h2 class="meta-title">Outcome</h2>
				<p>{tutorial.outcome}</p>
			</section>
			<section class="meta-card">
				<h2 class="meta-title">Goals</h2>
				<ul>
					{#each tutorial.goals as g}
						<li>{g}</li>
					{/each}
				</ul>
			</section>
			<section class="meta-card">
				<h2 class="meta-title">Prerequisites</h2>
				<ul>
					{#each tutorial.prerequisites as p}
						<li>{p}</li>
					{/each}
				</ul>
			</section>
		</div>

		<section class="block">
			<h2>Packages</h2>
			<ul class="chips">
				{#each tutorial.packages as name}
					<li>
						<a href={packageHref(pkgSlug(name))}><code>{name}</code></a>
					</li>
				{/each}
			</ul>
		</section>

		{#if tutorial.related?.length}
			<section class="block">
				<h2>Related</h2>
				<ul class="related">
					{#each tutorial.related as r}
						<li><a href={r.href}>{r.label}</a></li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="block steps">
			<h2>Steps</h2>
			<ol class="step-list">
				{#each tutorial.steps as step, i}
					<li class="step">
						<span class="step-num" aria-hidden="true">{i + 1}</span>
						<div class="step-body">
							<h3>{step.heading}</h3>
							<p>{step.body}</p>
						</div>
					</li>
				{/each}
			</ol>
		</section>

		<section class="block build">
			<h2>Build it</h2>
			<p class="build-lead">
				Use the tabs to switch style. Start with <strong>JSX</strong> unless you need an explicit
				message loop.
			</p>
			<CodeTabs tabs={tutorial.approaches} label={`${tutorial.title} samples`} />
		</section>

		<nav class="docs-pager" aria-label="Tutorial pagination">
			{#if prev}
				<a class="pager-link prev" href={tutorialHref(prev.slug)}>
					<span class="dir">Previous</span>
					<span class="title">{prev.title}</span>
				</a>
			{:else}
				<span></span>
			{/if}
			{#if next}
				<a class="pager-link next" href={tutorialHref(next.slug)}>
					<span class="dir">Next</span>
					<span class="title">{next.title}</span>
				</a>
			{/if}
		</nav>
	</article>
</div>

<style>
	.tutorial :global(h1) {
		margin-bottom: 0.65rem;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.85rem;
		margin: 1.5rem 0 1.75rem;
	}

	@media (min-width: 720px) {
		.meta-grid {
			grid-template-columns: 1fr 1fr;
		}
		.meta-grid .meta-card:first-child {
			grid-column: 1 / -1;
		}
	}

	.meta-card {
		margin: 0;
		padding: 1rem 1.15rem 1.1rem;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--bg-card);
	}

	.meta-title {
		margin: 0 0 0.55rem !important;
		font-size: 0.72rem !important;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted) !important;
	}

	.meta-card p,
	.meta-card li {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.95rem;
	}

	.meta-card ul {
		margin: 0;
		padding-left: 1.1rem;
	}

	.meta-card li + li {
		margin-top: 0.35rem;
	}

	.block {
		margin-top: 2rem;
	}

	.block > h2 {
		margin-top: 0;
	}

	.chips {
		list-style: none;
		padding: 0;
		margin: 0.75rem 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.chips li {
		margin: 0;
		padding: 0;
		border: 0;
		color: inherit;
	}

	.chips a {
		display: inline-block;
		padding: 0.4rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg-card);
		text-decoration: none;
		line-height: 1.3;
	}

	.chips a:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.related {
		list-style: none;
		padding: 0;
		margin: 0.65rem 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem 1.1rem;
	}

	.related li {
		margin: 0;
		padding: 0;
		border: 0;
	}

	.step-list {
		list-style: none;
		padding: 0;
		margin: 1rem 0 0;
		display: grid;
		gap: 0.85rem;
	}

	.step {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.85rem;
		align-items: start;
		padding: 1rem 1.1rem;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: rgba(18, 24, 33, 0.55);
	}

	.step-num {
		width: 1.85rem;
		height: 1.85rem;
		border-radius: 999px;
		display: grid;
		place-items: center;
		font-family: var(--mono);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--accent);
		background: var(--accent-soft);
		border: 1px solid rgba(52, 211, 153, 0.35);
		margin-top: 0.1rem;
	}

	.step-body h3 {
		margin: 0 0 0.4rem !important;
		font-size: 1.02rem !important;
		color: var(--text) !important;
	}

	.step-body p {
		margin: 0;
		color: var(--text-muted);
	}

	.build-lead {
		margin-bottom: 1rem !important;
	}

	.build :global(.code-tabs) {
		margin-top: 0.25rem;
	}

	.docs-pager {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.85rem;
		margin-top: 2.75rem;
		padding-top: 1.75rem;
		border-top: 1px solid var(--border);
	}

	.pager-link {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem 1.1rem;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--bg-card);
		text-decoration: none;
		color: var(--text);
		min-height: 4.25rem;
		justify-content: center;
	}

	.pager-link:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
		text-decoration: none;
	}

	.pager-link.next {
		text-align: right;
	}

	.dir {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		font-weight: 600;
	}

	.title {
		font-weight: 600;
		color: var(--accent);
	}

	@media (max-width: 560px) {
		.docs-pager {
			grid-template-columns: 1fr;
		}
		.pager-link.next {
			text-align: left;
		}
		.step {
			grid-template-columns: 1fr;
			gap: 0.55rem;
		}
	}
</style>
