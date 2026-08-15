<script lang="ts">
import DocsSidebar from '$lib/components/DocsSidebar.svelte'
import { docsNav } from '$lib/content/docs'
import { packageDocs, packageHref } from '$lib/content/packages'
import { featureDocs, featureHref } from '$lib/content/features'

const guideLinks = docsNav.filter(i => i.href !== '/docs')
const samplePackages = packageDocs.filter(p =>
  ['core', 'platform', 'jsx', 'reactive', 'runtime', 'ui'].includes(p.slug)
)
const sampleFeatures = featureDocs.slice(0, 6)
</script>

<svelte:head>
	<title>Docs · Tuix</title>
	<meta
		name="description"
		content="Install Tuix, write JSX terminal apps, and learn each package and feature in Simplified Technical English."
	/>
</svelte:head>

<div class="container docs-layout">
	<DocsSidebar />
	<article class="prose">
		<p class="docs-kicker">Docs</p>
		<h1>Documentation</h1>
		<p class="docs-lead">
			Guides and reference for Tuix on Bun. Text uses Simplified Technical English (ASD-STE100
			style): short sentences, active voice, and one idea per sentence.
		</p>

		<p>
			<strong>Prefer tutorials first</strong> if you are building an app.
			<a href="/docs/tutorials">Start the path →</a>
			· Learn <a href="/docs/patterns">patterns unique to Tuix</a>
			· See <a href="/docs/coverage">what is documented vs gap</a>.
		</p>

		<h2>Guides</h2>
		<div class="doc-cards">
			{#each guideLinks as item}
				<a class="doc-card" href={item.href}>
					<span class="doc-card-title">{item.label}</span>
					<span class="doc-card-go">Open →</span>
				</a>
			{/each}
		</div>

		<h2>Start with these packages</h2>
		<p>Each package page states purpose, concepts, key exports, and an example.</p>
		<div class="doc-cards">
			{#each samplePackages as pkg}
				<a class="doc-card" href={packageHref(pkg.slug)}>
					<span class="doc-card-title"><code>{pkg.name}</code></span>
					<span class="doc-card-go">Open →</span>
				</a>
			{/each}
		</div>
		<p><a href="/packages">All {packageDocs.length} packages →</a></p>

		<h2>Catalog features</h2>
		<p>Catalog features map to tested product capabilities.</p>
		<div class="doc-cards">
			{#each sampleFeatures as feat}
				<a class="doc-card" href={featureHref(feat.slug)}>
					<span class="doc-card-title">{feat.title}</span>
					<span class="doc-card-go">Open →</span>
				</a>
			{/each}
		</div>
		<p><a href="/docs/features">All features →</a></p>

		<h2>In the repository</h2>
		<ul>
			<li><code>docs/guides/</code> — install, quickstart, architecture</li>
			<li><code>spec/20-catalog/MODULE_CATALOG.md</code> — package status</li>
			<li><code>spec/20-catalog/FEATURE_CATALOG.md</code> — feature status</li>
			<li><code>spec/60-quality/RELEASE_GATES.md</code> — release gates</li>
		</ul>
	</article>
</div>

<style>
	.doc-cards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin: 1rem 0 1.25rem;
	}

	@media (max-width: 640px) {
		.doc-cards {
			grid-template-columns: 1fr;
		}
	}

	.doc-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
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

	.doc-card:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
		text-decoration: none;
	}

	.doc-card-title {
		font-weight: 600;
	}

	.doc-card-title :global(code) {
		background: transparent;
		padding: 0;
		color: var(--text);
		font-size: 0.9rem;
	}

	.doc-card-go {
		font-family: var(--mono);
		font-size: 0.8rem;
		color: var(--accent);
		flex-shrink: 0;
	}
</style>
