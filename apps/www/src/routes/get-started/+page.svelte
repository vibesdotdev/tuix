<script lang="ts">
import CodeBlock from '$lib/components/CodeBlock.svelte'

const steps = [
	{
		title: '1. Install Bun & clone',
		lang: 'bash',
		filename: 'terminal',
		code: `curl -fsSL https://bun.sh/install | bash
git clone https://github.com/tuix/tuix.git
cd tuix && bun install`,
	},
	{
		title: '2. Verify the product suite',
		lang: 'bash',
		filename: 'terminal',
		code: `bun test
bun run typecheck
bun run lint
bun packages/bin/src/bin/tuix.ts version`,
	},
	{
		title: '3. Run a minimal app',
		lang: 'tsx',
		filename: 'hello.tsx',
		code: `import { $state } from '@tuix/reactive'
import { runApp } from '@tuix/jsx'

function Hello() {
  const name = $state('world', 'name')
  return <text>Hello, {name()}!</text>
}

await runApp(Hello, { interactive: false })`,
	},
	{
		title: '4. Read the docs',
		lang: 'bash',
		filename: 'paths',
		code: `# In the browser (this site)
# /docs/quickstart
# /docs/architecture

# In the repo
# docs/guides/quickstart.md
# spec/`,
	},
]
</script>

<svelte:head>
	<title>Get started · Tuix</title>
	<meta name="description" content="From zero to a running Tuix CLI or app on Bun." />
</svelte:head>

<div class="container page-hero">
	<p class="eyebrow" style="margin-bottom: 0.75rem">Onboarding</p>
	<h1>Get started</h1>
	<p>From zero to a running Tuix CLI or app on Bun.</p>
</div>

<section class="section" style="padding-top: 0">
	<div class="container prose">
		{#each steps as step, i}
			<div class="step-block">
				<div class="step-num" aria-hidden="true">{i + 1}</div>
				<div class="step-body">
					<h2 style="margin-top: 0">{step.title}</h2>
					<CodeBlock
						code={step.code}
						lang={step.lang}
						filename={step.filename}
						terminal={step.lang === 'bash'}
						label={step.title}
					/>
				</div>
			</div>
		{/each}

		<h2>Next steps</h2>
		<ul class="next-links">
			<li><a href="/docs/quickstart">Quickstart guide</a> — counter, commands, Live services</li>
			<li><a href="/docs/architecture">Architecture</a> — layers and ownership</li>
			<li><a href="/docs/cli">CLI reference</a> — version, help, dashboard</li>
			<li><a href="/features">Feature matrix</a> — full product surface</li>
		</ul>
	</div>
</section>

<style>
	.step-block {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1rem;
		margin-bottom: 0.5rem;
		align-items: start;
	}

	.step-num {
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		background: var(--accent-soft);
		border: 1px solid rgba(52, 211, 153, 0.35);
		color: var(--accent);
		font-family: var(--mono);
		font-weight: 700;
		font-size: 0.85rem;
		display: grid;
		place-items: center;
		margin-top: 0.15rem;
	}

	.next-links {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.next-links li {
		padding: 0.65rem 0;
		border-bottom: 1px solid var(--border);
	}

	.next-links li:last-child {
		border-bottom: 0;
	}

	@media (max-width: 560px) {
		.step-block {
			grid-template-columns: 1fr;
		}
		.step-num {
			margin-bottom: 0.25rem;
		}
	}
</style>
