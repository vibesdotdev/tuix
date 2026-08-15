<script lang="ts">
import CodeBlock from './CodeBlock.svelte'

export type TabSample = {
  id: string
  label: string
  lang?: string
  filename?: string
  code: string
  note?: string
}

let {
  tabs,
  label = 'Code samples',
}: {
  tabs: TabSample[]
  label?: string
} = $props()

let active = $state(tabs[0]?.id ?? '')

$effect(() => {
  if (!tabs.find(t => t.id === active) && tabs[0]) {
    active = tabs[0].id
  }
})

const current = $derived(tabs.find(t => t.id === active) ?? tabs[0])
</script>

<div class="code-tabs" role="region" aria-label={label}>
	<div class="tab-list" role="tablist" aria-label={label}>
		{#each tabs as tab}
			<button
				type="button"
				role="tab"
				class="tab"
				class:active={tab.id === active}
				aria-selected={tab.id === active}
				id="tab-{tab.id}"
				onclick={() => (active = tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	{#if current}
		<div class="tab-panel" role="tabpanel" aria-labelledby="tab-{current.id}">
			{#if current.note}
				<p class="tab-note">{current.note}</p>
			{/if}
			<CodeBlock
				code={current.code}
				lang={current.lang ?? 'tsx'}
				filename={current.filename ?? current.label}
				terminal={current.lang === 'bash'}
				label={`${label}: ${current.label}`}
			/>
		</div>
	{/if}
</div>

<style>
	.code-tabs {
		margin: 1.15rem 0 1.75rem;
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: hidden;
		background: var(--bg-card);
		box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
	}

	.tab-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		padding: 0.65rem 0.7rem;
		border-bottom: 1px solid var(--border);
		background: #0d131b;
	}

	.tab {
		appearance: none;
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-muted);
		font-family: var(--font);
		font-size: 0.86rem;
		font-weight: 600;
		padding: 0.5rem 0.85rem;
		border-radius: 8px;
		cursor: pointer;
		transition:
			color 0.12s ease,
			background 0.12s ease,
			border-color 0.12s ease;
	}

	.tab:hover {
		color: var(--text);
		background: var(--bg-elevated);
	}

	.tab.active {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: rgba(52, 211, 153, 0.35);
	}

	.tab:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.tab-panel {
		padding: 0;
	}

	.tab-panel :global(.code-block) {
		margin: 0;
		border: 0;
		border-radius: 0;
		box-shadow: none;
	}

	.tab-note {
		margin: 0;
		padding: 0.85rem 1.1rem 0.15rem;
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--text-muted);
		border-bottom: 1px solid transparent;
	}
</style>
