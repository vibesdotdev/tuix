<script lang="ts">
import CodeBlock from '$lib/components/CodeBlock.svelte'
import { packageHref } from '$lib/content/packages'

let { data } = $props()
const pkg = $derived(data.pkg)
const prev = $derived(data.prev)
const next = $derived(data.next)

function relatedSlug(name: string) {
  return name.startsWith('@tuix/') ? name.slice('@tuix/'.length) : name
}
</script>

<svelte:head>
	<title>{pkg.name} · Tuix packages</title>
	<meta name="description" content={pkg.summary} />
</svelte:head>

<div class="container page-hero">
	<p class="eyebrow" style="margin-bottom: 0.75rem">{pkg.layer} package</p>
	<h1><code>{pkg.name}</code></h1>
	<p>{pkg.summary}</p>
</div>

<section class="section" style="padding-top: 0">
	<div class="container prose pkg-doc">
		<h2>Purpose</h2>
		<p>{pkg.purpose}</p>

		<h2>When to use this package</h2>
		<p>{pkg.whenToUse}</p>

		<h2>Main concepts</h2>
		<ul>
			{#each pkg.mainConcepts as item}
				<li>{item}</li>
			{/each}
		</ul>

		<h2>Key exports</h2>
		<ul class="export-list">
			{#each pkg.keyExports as item}
				<li><code>{item.split(' — ')[0]}</code>{item.includes(' — ') ? ` — ${item.split(' — ').slice(1).join(' — ')}` : ''}</li>
			{/each}
		</ul>

		{#if pkg.example}
			<h2>Example</h2>
			<CodeBlock
				code={pkg.example.code}
				lang={pkg.example.lang}
				filename={pkg.example.filename}
				terminal={pkg.example.lang === 'bash'}
				label={`${pkg.name} example`}
			/>
		{/if}

		{#if pkg.related?.length}
			<h2>Related packages</h2>
			<ul class="related">
				{#each pkg.related as name}
					<li>
						<a href={packageHref(relatedSlug(name))}><code>{name}</code></a>
					</li>
				{/each}
			</ul>
		{/if}

		<nav class="docs-pager" aria-label="Package pagination">
			{#if prev}
				<a class="pager-link prev" href={packageHref(prev.slug)}>
					<span class="dir">Previous</span>
					<span class="title">{prev.name}</span>
				</a>
			{:else}
				<span></span>
			{/if}
			{#if next}
				<a class="pager-link next" href={packageHref(next.slug)}>
					<span class="dir">Next</span>
					<span class="title">{next.name}</span>
				</a>
			{/if}
		</nav>

		<p class="back">
			<a href="/packages">All packages</a>
			·
			<a href="/docs/packages">Packages guide</a>
			·
			<a href="/docs/features">Features</a>
		</p>
	</div>
</section>

<style>
	.pkg-doc :global(h1 code) {
		font-size: 0.9em;
		color: var(--text);
		background: transparent;
		padding: 0;
	}

	.export-list li {
		margin-bottom: 0.35rem;
	}

	.related {
		list-style: none;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.related li {
		margin: 0;
		padding: 0;
		border: 0;
		color: inherit;
	}

	.related a {
		display: inline-block;
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg-card);
		text-decoration: none;
	}

	.related a:hover {
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
		font-family: var(--mono);
		font-size: 0.9rem;
	}

	.back {
		margin-top: 1.5rem;
		color: var(--text-muted);
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
