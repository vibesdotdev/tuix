<script lang="ts">
import DocsSidebar from '$lib/components/DocsSidebar.svelte'
import DocsNav from '$lib/components/DocsNav.svelte'
import CodeBlock from '$lib/components/CodeBlock.svelte'

let { data } = $props()
const doc = $derived(data.doc)
</script>

<svelte:head>
	<title>{doc.title} · Tuix Docs</title>
	<meta name="description" content={doc.description} />
</svelte:head>

<div class="container docs-layout">
	<DocsSidebar />
	<article class="prose">
		<p class="docs-kicker">Docs</p>
		<h1>{doc.title}</h1>
		<p class="docs-lead">{doc.description}</p>
		{#each doc.sections as section}
			<h2 id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>{section.heading}</h2>
			<p>{section.body}</p>
			{#if section.code}
				<CodeBlock
					code={section.code}
					lang={section.lang ?? 'typescript'}
					filename={section.filename}
					terminal={section.lang === 'bash' || section.filename === 'terminal'}
					label={`${section.heading} code`}
				/>
			{/if}
		{/each}
		<DocsNav />
	</article>
</div>
