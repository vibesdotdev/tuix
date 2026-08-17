<script lang="ts">
import { searchSite } from '$lib/search'
import DocsSidebar from '$lib/components/DocsSidebar.svelte'

let query = $state('')

const results = $derived(query.trim() ? searchSite(query) : [])
</script>

<svelte:head>
	<title>Search · Tuix</title>
	<meta name="description" content="Search every Tuix guide, tutorial, package, pattern, and component." />
</svelte:head>

<div class="container docs-layout">
	<DocsSidebar />
	<article class="prose">
		<p class="docs-kicker">Find</p>
		<h1>Search</h1>
		<p class="docs-lead">
			Type to filter every guide, tutorial, package, pattern, component, and feature page. The
			index ships with the page — nothing leaves your browser.
		</p>

		<input
			class="search-input"
			type="search"
			placeholder="runes, PTY, theme, command palette…"
			autocomplete="off"
			bind:value={query}
			aria-label="Search the Tuix docs"
		/>

		{#if query.trim() && results.length === 0}
			<p class="no-results">No pages match “{query}”.</p>
		{/if}

		{#if results.length > 0}
			<p class="result-count">{results.length} result{results.length === 1 ? '' : 's'}</p>
			<ul class="results">
				{#each results as result (result.href)}
					<li>
						<a href={result.href}>
							<span class="section-chip">{result.section}</span>
							<span class="result-title">{result.title}</span>
						</a>
						<p class="result-blurb">{result.blurb}</p>
					</li>
				{/each}
			</ul>
		{/if}
	</article>
</div>

<style>
	.search-input {
		width: 100%;
		font: inherit;
		font-family: var(--mono);
		font-size: 1rem;
		color: var(--text);
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.75rem 1rem;
		outline: none;
	}

	.search-input:focus-visible {
		border-color: var(--accent);
		box-shadow: var(--focus-ring);
	}

	.no-results,
	.result-count {
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.results {
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
	}

	.results li {
		padding: 0.85rem 0;
		border-bottom: 1px solid var(--border);
	}

	.results a {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--text);
		text-decoration: none;
	}

	.results a:hover .result-title {
		color: var(--accent);
	}

	.section-chip {
		font-family: var(--mono);
		font-size: 0.72rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--cyan);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.1rem 0.55rem;
		white-space: nowrap;
	}

	.result-title {
		font-weight: 600;
	}

	.result-blurb {
		margin: 0.35rem 0 0;
		color: var(--text-muted);
		font-size: 0.92rem;
	}
</style>
