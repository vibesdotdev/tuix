<script lang="ts">
import DocsSidebar from '$lib/components/DocsSidebar.svelte'
import CodeBlock from '$lib/components/CodeBlock.svelte'
import { featureHref } from '$lib/content/features'
import { packageHref } from '$lib/content/packages'

let { data } = $props()
const feature = $derived(data.feature)
const prev = $derived(data.prev)
const next = $derived(data.next)

function pkgSlug(name: string) {
  return name.startsWith('@tuix/') ? name.slice('@tuix/'.length) : name
}
</script>

<svelte:head>
	<title>{feature.title} · Tuix Docs</title>
	<meta name="description" content={feature.summary} />
</svelte:head>

<div class="container docs-layout">
	<DocsSidebar />
	<article class="prose">
		<p class="docs-kicker">{feature.area} · {feature.id}</p>
		<h1>{feature.title}</h1>
		<p class="docs-lead">{feature.summary}</p>

		<p>
			<span class="status">{feature.status}</span>
		</p>

		<h2>What it does</h2>
		<p>{feature.whatItDoes}</p>

		<h2>How to use it</h2>
		<p>{feature.howToUse}</p>

		{#if feature.subfeatures?.length}
			<h2>Subfeatures</h2>
			<ul>
				{#each feature.subfeatures as sub}
					<li>{sub}</li>
				{/each}
			</ul>
		{/if}

		{#if feature.packages?.length}
			<h2>Packages</h2>
			<ul class="pkg-chips">
				{#each feature.packages as name}
					<li>
						<a href={packageHref(pkgSlug(name))}><code>{name}</code></a>
					</li>
				{/each}
			</ul>
		{/if}

		{#if feature.example}
			<h2>Example</h2>
			<CodeBlock
				code={feature.example.code}
				lang={feature.example.lang}
				filename={feature.example.filename}
				terminal={feature.example.lang === 'bash'}
				label={`${feature.title} example`}
			/>
		{/if}

		<nav class="docs-pager" aria-label="Feature pagination">
			{#if prev}
				<a class="pager-link prev" href={featureHref(prev.slug)}>
					<span class="dir">Previous</span>
					<span class="title">{prev.title}</span>
				</a>
			{:else}
				<span></span>
			{/if}
			{#if next}
				<a class="pager-link next" href={featureHref(next.slug)}>
					<span class="dir">Next</span>
					<span class="title">{next.title}</span>
				</a>
			{/if}
		</nav>
	</article>
</div>

<style>
	.status {
		display: inline-block;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		background: var(--accent-soft);
		border: 1px solid rgba(52, 211, 153, 0.35);
		color: var(--accent);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.pkg-chips {
		list-style: none;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.pkg-chips li {
		margin: 0;
		padding: 0;
		border: 0;
	}

	.pkg-chips a {
		display: inline-block;
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg-card);
		text-decoration: none;
	}

	.pkg-chips a:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.docs-pager {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-top: 2.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
	}

	.pager-link {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.9rem 1rem;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--bg-card);
		text-decoration: none;
		color: var(--text);
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
		font-size: 0.75rem;
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
	}
</style>
