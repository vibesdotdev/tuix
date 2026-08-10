<script lang="ts">
import { page } from '$app/stores'
import { docsNav } from '$lib/content/docs'
import { packageDocs, packageHref } from '$lib/content/packages'
import { tutorialNav } from '$lib/content/tutorials'

const path = $derived($page.url.pathname)

const corePackages = packageDocs.filter((p) =>
	['core', 'platform', 'jsx', 'reactive', 'runtime', 'ui', 'process-manager', 'testing'].includes(
		p.slug,
	),
)
</script>

<aside class="docs-side">
	<h2>Guides</h2>
	{#each docsNav as item}
		<a href={item.href} aria-current={path === item.href ? 'page' : undefined}>
			{item.label}
		</a>
	{/each}

	<h2 class="section">Tutorial path</h2>
	{#each tutorialNav as item}
		<a href={item.href} aria-current={path === item.href ? 'page' : undefined}>
			{item.label}
		</a>
	{/each}

	<h2 class="section">Unique patterns</h2>
	<a href="/docs/patterns" aria-current={path === '/docs/patterns' ? 'page' : undefined}
		>All patterns</a
	>
	<a href="/docs/patterns/jsx-to-mvu">JSX → MVU</a>
	<a href="/docs/patterns/named-state">Named state</a>
	<a href="/docs/patterns/cli-routing">CLI routing</a>
	<a href="/docs/patterns/async-cmd-sub">Async Cmd/Sub</a>
	<a href="/docs/patterns/platform-live">Platform Live</a>

	<h2 class="section">Packages</h2>
	<a href="/packages" aria-current={path === '/packages' ? 'page' : undefined}>All packages</a>
	{#each corePackages as pkg}
		<a
			href={packageHref(pkg.slug)}
			aria-current={path === packageHref(pkg.slug) ? 'page' : undefined}
		>
			{pkg.slug}
		</a>
	{/each}
</aside>

<style>
	.section {
		margin-top: 1.1rem !important;
	}
</style>
