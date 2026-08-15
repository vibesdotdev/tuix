<script lang="ts">
import { docsNav } from '$lib/content/docs'
import { page } from '$app/stores'

const path = $derived($page.url.pathname)

const index = $derived(docsNav.findIndex(item => item.href === path))
const prev = $derived(index > 0 ? docsNav[index - 1] : null)
const next = $derived(index >= 0 && index < docsNav.length - 1 ? docsNav[index + 1] : null)
</script>

{#if prev || next}
  <nav class="docs-pager" aria-label="Docs pagination">
    {#if prev}
      <a class="pager-link prev" href={prev.href}>
        <span class="dir">Previous</span>
        <span class="title">{prev.label}</span>
      </a>
    {:else}
      <span></span>
    {/if}
    {#if next}
      <a class="pager-link next" href={next.href}>
        <span class="dir">Next</span>
        <span class="title">{next.label}</span>
      </a>
    {/if}
  </nav>
{/if}

<style>
  .docs-pager {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .pager-link {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.9rem 1rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--bg-card);
    text-decoration: none;
    color: var(--text);
    transition:
      border-color 0.12s ease,
      background 0.12s ease;
  }

  .pager-link:hover {
    border-color: var(--accent);
    background: var(--accent-soft);
    text-decoration: none;
  }

  .pager-link.next {
    text-align: right;
    margin-left: auto;
    width: 100%;
  }

  .dir {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    font-weight: 600;
  }

  .title {
    font-weight: 600;
    color: var(--accent);
  }

  @media (max-width: 560px) {
    .docs-pager {
      grid-template-columns: 1fr;
    }
    .pager-link.next {
      text-align: left;
    }
  }
</style>
