<script lang="ts">
import { highlightCode, type CodeLang } from '$lib/highlight'

type Props = {
  code: string
  lang?: CodeLang
  /** Filename or short title shown in the chrome bar */
  filename?: string
  /** Window-dot terminal chrome */
  terminal?: boolean
  /** Optional aria label */
  label?: string
}

let {
  code,
  lang = 'typescript',
  filename = '',
  terminal = false,
  label = 'Code sample',
}: Props = $props()

let html = $state('')
let copied = $state(false)
let ready = $state(false)

const displayLang = $derived(filename || lang || 'code')

$effect(() => {
  let cancelled = false
  ready = false
  highlightCode(code, lang).then((result) => {
    if (!cancelled) {
      html = result
      ready = true
    }
  })
  return () => {
    cancelled = true
  }
})

async function copy() {
  try {
    await navigator.clipboard.writeText(code)
    copied = true
    setTimeout(() => {
      copied = false
    }, 1600)
  } catch {
    /* clipboard unavailable */
  }
}
</script>

<div
  class="code-block"
  class:is-terminal={terminal}
  class:is-ready={ready}
  role="region"
  aria-label={label}
>
  <div class="code-chrome">
    {#if terminal}
      <div class="dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    {/if}
    <span class="code-meta">{displayLang}</span>
    <button type="button" class="copy-btn" onclick={copy} aria-label="Copy code">
      {copied ? 'Copied' : 'Copy'}
    </button>
  </div>
  {#if ready && html}
    <div class="code-body shiki-host">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html html}
    </div>
  {:else}
    <pre class="code-fallback"><code>{code}</code></pre>
  {/if}
</div>

<style>
  .code-block {
    background: #070b10;
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
    margin: 1rem 0 1.35rem;
  }

  .code-block.is-terminal {
    border-radius: 14px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
  }

  .code-chrome {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.55rem 0.75rem 0.55rem 0.9rem;
    border-bottom: 1px solid var(--border);
    background: #0d131b;
    min-height: 2.4rem;
  }

  .dots {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .dots span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #334155;
  }

  .dots span:nth-child(1) {
    background: #f87171;
  }
  .dots span:nth-child(2) {
    background: #fbbf24;
  }
  .dots span:nth-child(3) {
    background: #34d399;
  }

  .code-meta {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--text-muted);
    letter-spacing: 0.02em;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-btn {
    appearance: none;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.28rem 0.55rem;
    border-radius: 6px;
    cursor: pointer;
    transition:
      color 0.12s ease,
      border-color 0.12s ease,
      background 0.12s ease;
  }

  .copy-btn:hover {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  .code-body,
  .code-fallback {
    margin: 0;
    overflow-x: auto;
  }

  .code-fallback {
    padding: 1rem 1.15rem 1.15rem;
    font-family: var(--mono);
    font-size: 0.82rem;
    line-height: 1.55;
    color: #c5d4e8;
  }

  .code-fallback code {
    font-family: inherit;
    background: none;
    padding: 0;
    color: inherit;
  }

  :global(.shiki-host pre) {
    margin: 0;
    padding: 1rem 1.15rem 1.15rem;
    background: transparent !important;
    overflow-x: auto;
    font-size: 0.82rem;
    line-height: 1.55;
  }

  :global(.shiki-host code) {
    font-family: var(--mono);
    font-size: inherit;
    background: transparent;
    padding: 0;
    color: inherit;
  }
</style>
