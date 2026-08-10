<script lang="ts">
import DocsSidebar from '$lib/components/DocsSidebar.svelte'
import {
	componentDocs,
	componentsByCategory,
	componentHref,
} from '$lib/content/components'

const groups = componentsByCategory()
const full = componentDocs.filter((c) => c.docs === 'full').length
const brief = componentDocs.filter((c) => c.docs === 'brief').length
const none = componentDocs.filter((c) => c.docs === 'none').length
</script>

<svelte:head>
	<title>Components · Tuix Docs</title>
	<meta
		name="description"
		content="Catalog of UI widgets and JSX building blocks in Tuix."
	/>
</svelte:head>

<div class="container docs-layout">
	<DocsSidebar />
	<article class="prose">
		<p class="docs-kicker">Reference</p>
		<h1>Components</h1>
		<p class="docs-lead">
			Building blocks from <code>@tuix/ui</code> and <code>@tuix/jsx</code>. Each entry states what
			it does and when to use it. Docs depth is marked honestly.
		</p>

		<p class="stats">
			<strong>{componentDocs.length}</strong> components ·
			<span class="ok">{brief + full} with at least a brief page</span> ·
			<span class="gap">{none} listed only (props TBD)</span>
		</p>

		{#each groups as group}
			<h2 id={group.category.toLowerCase().replace(/\s+/g, '-')}>{group.category}</h2>
			<div class="comp-grid">
				{#each group.items as c}
					<a class="comp-card" href={componentHref(c.slug)}>
						<span class="docs-badge" class:gap={c.docs === 'none'} class:brief={c.docs === 'brief'}
							>{c.docs}</span
						>
						<span class="name">{c.name}</span>
						<span class="sum">{c.summary}</span>
						<code class="pkg">{c.package}</code>
					</a>
				{/each}
			</div>
		{/each}
	</article>
</div>

<style>
	.stats {
		color: var(--text-muted);
		font-size: 0.95rem;
	}

	.ok {
		color: var(--accent);
	}

	.gap {
		color: var(--amber);
	}

	.comp-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.65rem;
		margin: 0.85rem 0 1.75rem;
	}

	.comp-card {
		display: grid;
		gap: 0.3rem;
		padding: 0.9rem 1.05rem;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--bg-card);
		text-decoration: none;
		color: inherit;
	}

	.comp-card:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
		text-decoration: none;
	}

	.docs-badge {
		justify-self: start;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--cyan);
	}

	.docs-badge.brief {
		color: var(--accent);
	}

	.docs-badge.gap {
		color: var(--amber);
	}

	.name {
		font-weight: 700;
	}

	.sum {
		color: var(--text-muted);
		font-size: 0.92rem;
	}

	.pkg {
		font-size: 0.75rem;
		color: var(--cyan);
		background: transparent;
		padding: 0;
	}
</style>
