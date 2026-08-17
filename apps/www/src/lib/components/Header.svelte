<script lang="ts">
import { page } from '$app/stores'

const links = [
  { href: '/features', label: 'Features' },
  { href: '/get-started', label: 'Get started' },
  { href: '/docs', label: 'Docs' },
  { href: '/packages', label: 'Packages' },
  { href: '/search', label: 'Search' },
]

let open = $state(false)

function current(href: string, path: string) {
  if (href === '/docs') return path === '/docs' || path.startsWith('/docs/')
  return path === href
}

$effect(() => {
  // close mobile menu on navigation
  void $page.url.pathname
  open = false
})
</script>

<header class="site-header">
	<div class="container inner">
		<a class="brand" href="/">
			<span class="brand-mark">TX</span>
			<span>Tuix</span>
		</a>

		<button
			type="button"
			class="nav-toggle"
			aria-expanded={open}
			aria-controls="primary-nav"
			onclick={() => (open = !open)}
		>
			<span class="sr-only">Menu</span>
			<span class="burger" class:open aria-hidden="true"></span>
		</button>

		<nav class="nav" class:open id="primary-nav" aria-label="Primary">
			{#each links as link}
				<a
					href={link.href}
					aria-current={current(link.href, $page.url.pathname) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
			<a class="btn btn-primary nav-cta" href="/get-started">Install</a>
		</nav>
	</div>
</header>

<style>
	.nav-toggle {
		display: none;
		appearance: none;
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		border-radius: 8px;
		width: 2.4rem;
		height: 2.4rem;
		place-items: center;
		cursor: pointer;
		padding: 0;
	}

	.burger {
		display: block;
		width: 1rem;
		height: 1.5px;
		background: var(--text);
		position: relative;
		transition: background 0.15s ease;
	}

	.burger::before,
	.burger::after {
		content: '';
		position: absolute;
		left: 0;
		width: 1rem;
		height: 1.5px;
		background: var(--text);
		transition: transform 0.15s ease;
	}

	.burger::before {
		top: -5px;
	}
	.burger::after {
		top: 5px;
	}

	.burger.open {
		background: transparent;
	}
	.burger.open::before {
		top: 0;
		transform: rotate(45deg);
	}
	.burger.open::after {
		top: 0;
		transform: rotate(-45deg);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	.nav-cta {
		margin-left: 0.5rem;
		/* Reinforce ink on green — global CSS also sets this; keep local belt */
		color: var(--accent-ink) !important;
		background: var(--accent);
		font-weight: 700;
	}

	.nav-cta:hover {
		color: var(--accent-ink) !important;
		background: var(--accent-hover);
		text-decoration: none;
	}

	@media (max-width: 760px) {
		.nav-toggle {
			display: grid;
		}

		.nav {
			display: none;
			position: absolute;
			top: var(--nav-h);
			left: 0;
			right: 0;
			flex-direction: column;
			align-items: stretch;
			gap: 0.15rem;
			padding: 0.75rem 1rem 1rem;
			background: rgba(11, 15, 20, 0.96);
			border-bottom: 1px solid var(--border);
			backdrop-filter: blur(12px);
		}

		.nav.open {
			display: flex;
		}

		.nav a:not(.btn) {
			padding: 0.7rem 0.85rem;
		}

		.nav-cta {
			margin: 0.65rem 0 0;
			justify-content: center;
			width: 100%;
		}
	}
</style>

