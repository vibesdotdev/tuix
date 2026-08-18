<script lang="ts">
import { featureAreas, featureDocs, featureHref } from '$lib/content/features'
import { packageHref } from '$lib/content/packages'

function pkgSlug(name: string) {
  return name.startsWith('@tuix/') ? name.slice('@tuix/'.length) : name
}
</script>

<svelte:head>
	<title>Features · Tuix</title>
	<meta
		name="description"
		content="Complete catalog features: terminal capabilities, Model-View-Update (MVU), JSX, and Pseudo-Terminal (PTY)."
	/>
</svelte:head>

<div class="container page-hero">
	<p class="eyebrow" style="margin-bottom: 0.75rem">v1 catalog</p>
	<h1>Features</h1>
	<p>
		Each feature is implemented and tested. Open a feature to see what it does, how you use it, and
		which packages own it.
	</p>
	<p style="margin-top: 0.75rem">
		<a href="/docs/features">Docs feature index</a>
		·
		<a href="/packages">Packages</a>
	</p>
</div>

<section class="section" style="padding-top: 0">
	<div class="container">
		{#each featureAreas as area}
			<h2 class="area-title">{area.title}</h2>
			<p class="area-sum">{area.summary}</p>
			<div class="feat-grid">
				{#each area.featureSlugs as slug}
					{@const feat = featureDocs.find((f) => f.slug === slug)}
					{#if feat}
						<a class="feat-card" href={featureHref(feat.slug)}>
							<span class="tag">{feat.status}</span>
							<h3>{feat.title}</h3>
							<p>{feat.summary}</p>
							<div class="pkgs">
								{#each feat.packages as name}
									<code>{name}</code>
								{/each}
							</div>
						</a>
					{/if}
				{/each}
			</div>
		{/each}
		<p class="feat-note">
			Source of truth: <code>spec/20-catalog/FEATURE_CATALOG.md</code>. Package pages live under
			<a href="/packages">/packages</a>.
		</p>
	</div>
</section>

<style>
	.area-title {
		margin: 0 0 0.4rem;
		font-size: 1.2rem;
		letter-spacing: -0.02em;
	}

	.area-title:not(:first-child) {
		margin-top: 2rem;
	}

	.area-sum {
		margin: 0 0 0.85rem;
		color: var(--text-muted);
		max-width: 40rem;
	}

	.feat-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.85rem;
	}

	@media (max-width: 700px) {
		.feat-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.feat-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.15rem 1.25rem;
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.12s ease,
			transform 0.12s ease;
	}

	.feat-card:hover {
		border-color: rgba(52, 211, 153, 0.4);
		transform: translateY(-1px);
		text-decoration: none;
	}

	.feat-card h3 {
		margin: 0 0 0.4rem;
		font-size: 1.05rem;
	}

	.feat-card p {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.95rem;
		flex: 1;
	}

	.tag {
		display: inline-block;
		margin-bottom: 0.5rem;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.pkgs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.85rem;
	}

	.pkgs code {
		font-size: 0.75rem;
		color: var(--cyan);
		background: var(--bg-elevated);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
	}

	.feat-note {
		margin-top: 1.5rem;
		color: var(--text-muted);
	}
</style>
