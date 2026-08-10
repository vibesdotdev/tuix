<script lang="ts">
import DocsSidebar from '$lib/components/DocsSidebar.svelte'
import { featureAreas, featureDocs, featureHref } from '$lib/content/features'
</script>

<svelte:head>
	<title>Features · Tuix Docs</title>
	<meta
		name="description"
		content="Catalog features for terminal I/O, Model-View-Update (MVU), JSX, and process control."
	/>
</svelte:head>

<div class="container docs-layout">
	<DocsSidebar />
	<article class="prose">
		<p class="docs-kicker">Docs</p>
		<h1>Features</h1>
		<p class="docs-lead">
			Each feature is a Complete product capability from the catalog. Read what it does and how you
			use it.
		</p>

		{#each featureAreas as area}
			<h2 id={area.slug}>{area.title}</h2>
			<p>{area.summary}</p>
			<div class="feat-cards">
				{#each area.featureSlugs as slug}
					{@const feat = featureDocs.find((f) => f.slug === slug)}
					{#if feat}
						<a class="feat-card" href={featureHref(feat.slug)}>
							<span class="tag">{feat.status}</span>
							<span class="feat-title">{feat.title}</span>
							<span class="feat-sum">{feat.summary}</span>
						</a>
					{/if}
				{/each}
			</div>
		{/each}

		<p>
			See also the <a href="/features">feature matrix</a> and
			<code>spec/20-catalog/FEATURE_CATALOG.md</code> in the repository.
		</p>
	</article>
</div>

<style>
	.feat-cards {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.65rem;
		margin: 1rem 0 2rem;
	}

	.feat-card {
		display: grid;
		gap: 0.35rem;
		padding: 0.95rem 1.1rem;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--bg-card);
		text-decoration: none;
		color: var(--text);
		transition:
			border-color 0.12s ease,
			background 0.12s ease;
	}

	.feat-card:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
		text-decoration: none;
	}

	.feat-title {
		font-weight: 600;
	}

	.feat-sum {
		color: var(--text-muted);
		font-size: 0.92rem;
	}

	.tag {
		justify-self: start;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--accent);
	}
</style>
