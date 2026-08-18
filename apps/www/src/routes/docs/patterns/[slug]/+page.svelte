<script lang="ts">
import DocsSidebar from '$lib/components/DocsSidebar.svelte'
import EditLink from '$lib/components/EditLink.svelte'
import CodeTabs from '$lib/components/CodeTabs.svelte'
import { patternHref } from '$lib/content/patterns'

let { data } = $props()
const pattern = $derived(data.pattern)
const prev = $derived(data.prev)
const next = $derived(data.next)
</script>

<svelte:head>
	<title>{pattern.title} · Patterns · Tuix</title>
	<meta name="description" content={pattern.summary} />
</svelte:head>

<div class="container docs-layout">
	<DocsSidebar />
	<article class="prose pattern">
		<p class="docs-kicker">
			{pattern.kind === 'unique' ? 'Unique to Tuix' : 'Common CLI/TUI'} · {pattern.category}
		</p>
		<h1>{pattern.title}</h1>
		<p class="docs-lead">{pattern.summary}</p>

		<div class="meta-grid">
			<section class="meta-card">
				<h2 class="meta-title">Why it matters</h2>
				<p>{pattern.whyItMatters}</p>
			</section>
			<section class="meta-card">
				<h2 class="meta-title">How it works in Tuix</h2>
				<p>{pattern.howInTuix}</p>
			</section>
		</div>

		<section class="block">
			<h2>Pitfalls</h2>
			<ul class="pitfalls">
				{#each pattern.pitfalls as item}
					<li>{item}</li>
				{/each}
			</ul>
		</section>

		{#if pattern.samples?.length}
			<section class="block">
				<h2>Examples</h2>
				<CodeTabs tabs={pattern.samples} label={`${pattern.title} samples`} />
			</section>
		{/if}

		{#if pattern.related?.length}
			<section class="block">
				<h2>Related</h2>
				<ul class="related">
					{#each pattern.related as r}
						<li><a href={r.href}>{r.label}</a></li>
					{/each}
				</ul>
			</section>
		{/if}

		<nav class="docs-pager" aria-label="Pattern pagination">
			{#if prev}
				<a class="pager-link prev" href={patternHref(prev.slug)}>
					<span class="dir">Previous</span>
					<span class="title">{prev.title}</span>
				</a>
			{:else}
				<span></span>
			{/if}
			{#if next}
				<a class="pager-link next" href={patternHref(next.slug)}>
					<span class="dir">Next</span>
					<span class="title">{next.title}</span>
				</a>
			{/if}
		</nav>
		<EditLink />
</article>
</div>

<style>
	.meta-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.85rem;
		margin: 1.5rem 0 1.75rem;
	}

	@media (min-width: 720px) {
		.meta-grid {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}

	.meta-card {
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

	.meta-card p {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.95rem;
	}

	.block {
		margin-top: 2rem;
	}

	.pitfalls {
		margin: 0.75rem 0 0;
		padding-left: 1.15rem;
	}

	.pitfalls li {
		margin-bottom: 0.45rem;
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

	.docs-pager {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
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
			grid-template-columns: minmax(0, 1fr);
		}
		.pager-link.next {
			text-align: left;
		}
	}
</style>
