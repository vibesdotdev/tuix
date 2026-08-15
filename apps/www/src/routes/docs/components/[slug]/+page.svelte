<script lang="ts">
import DocsSidebar from '$lib/components/DocsSidebar.svelte'
import CodeBlock from '$lib/components/CodeBlock.svelte'
import { componentHref } from '$lib/content/components'
import { packageHref } from '$lib/content/packages'

let { data } = $props()
const c = $derived(data.component)
const prev = $derived(data.prev)
const next = $derived(data.next)

function pkgSlug(name: string) {
  return name.startsWith('@tuix/') ? name.slice('@tuix/'.length) : name
}
</script>

<svelte:head>
	<title>{c.name} · Components · Tuix</title>
	<meta name="description" content={c.summary} />
</svelte:head>

<div class="container docs-layout">
	<DocsSidebar />
	<article class="prose">
		<p class="docs-kicker">{c.category} · docs: {c.docs}</p>
		<h1>{c.name}</h1>
		<p class="docs-lead">{c.summary}</p>

		<p>
			Package:
			<a href={packageHref(pkgSlug(c.package))}><code>{c.package}</code></a>
		</p>

		<h2>When to use</h2>
		<p>{c.whenToUse}</p>

		{#if c.example}
			<h2>Example</h2>
			<CodeBlock
				code={c.example.code}
				lang={c.example.lang}
				filename={c.example.filename}
				label={`${c.name} example`}
			/>
		{:else if c.docs === 'none'}
			<h2>Example</h2>
			<p>
				No site example yet. Import <code>{c.name.split(' / ')[0]}</code> from
				<code>{c.package}</code> and inspect the package source under
				<code>packages/{pkgSlug(c.package)}/</code>.
			</p>
		{/if}

		{#if c.docs !== 'full'}
			<h2>Docs status</h2>
			<p>
				This entry is a catalog summary ({c.docs}). Full prop tables and edge cases are not on the
				site yet. Prefer package TypeScript types and tests as the source of truth for parameters.
			</p>
		{/if}

		<nav class="docs-pager" aria-label="Component pagination">
			{#if prev}
				<a class="pager-link prev" href={componentHref(prev.slug)}>
					<span class="dir">Previous</span>
					<span class="title">{prev.name}</span>
				</a>
			{:else}
				<span></span>
			{/if}
			{#if next}
				<a class="pager-link next" href={componentHref(next.slug)}>
					<span class="dir">Next</span>
					<span class="title">{next.name}</span>
				</a>
			{/if}
		</nav>
	</article>
</div>

<style>
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
