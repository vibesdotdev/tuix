<script lang="ts">
import { packageHref, packagesByLayer } from '$lib/content/packages'

const layers = packagesByLayer()
</script>

<svelte:head>
	<title>Packages · Tuix</title>
	<meta
		name="description"
		content="Twenty-two workspace packages. Each page explains purpose, concepts, exports, and an example."
	/>
</svelte:head>

<div class="container page-hero">
	<p class="eyebrow" style="margin-bottom: 0.75rem">Monorepo</p>
	<h1>Packages</h1>
	<p>
		Twenty-two workspace packages under <code>packages/*</code>. Open a package to see what it does,
		when to use it, and how its public API works.
	</p>
	<p style="margin-top: 0.75rem">
		<a href="/docs/packages">Read the packages guide</a>
		·
		<a href="/docs/features">Browse catalog features</a>
	</p>
</div>

<section class="section" style="padding-top: 0">
	<div class="container">
		{#each layers as group}
			<h2 class="layer-title">{group.layer}</h2>
			<div class="pkg-grid">
				{#each group.packages as pkg}
					<a class="pkg-card" href={packageHref(pkg.slug)}>
						<span class="pkg-layer">{pkg.layer}</span>
						<h3><code>{pkg.name}</code></h3>
						<p>{pkg.summary}</p>
						<span class="pkg-go">Open docs →</span>
					</a>
				{/each}
			</div>
		{/each}
		<p class="pkg-note">
			Status source: <code>spec/20-catalog/MODULE_CATALOG.md</code>. All modules are Complete for v1.
		</p>
	</div>
</section>

<style>
	.layer-title {
		margin: 0 0 0.85rem;
		font-size: 1.15rem;
		letter-spacing: -0.02em;
	}

	.layer-title:not(:first-child) {
		margin-top: 2rem;
	}

	.pkg-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.85rem;
	}

	@media (max-width: 960px) {
		.pkg-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 560px) {
		.pkg-grid {
			grid-template-columns: 1fr;
		}
	}

	.pkg-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.05rem 1.15rem;
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.12s ease,
			transform 0.12s ease;
	}

	.pkg-card:hover {
		border-color: rgba(52, 211, 153, 0.4);
		transform: translateY(-1px);
		text-decoration: none;
	}

	.pkg-layer {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--cyan);
		margin-bottom: 0.45rem;
	}

	.pkg-card h3 {
		margin: 0 0 0.4rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.pkg-card h3 :global(code) {
		color: var(--text);
		background: transparent;
		padding: 0;
		font-size: 0.9rem;
	}

	.pkg-card p {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.9rem;
		line-height: 1.45;
		flex: 1;
	}

	.pkg-go {
		margin-top: 0.75rem;
		font-family: var(--mono);
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--accent);
	}

	.pkg-note {
		margin-top: 1.5rem;
		color: var(--text-muted);
	}
</style>
