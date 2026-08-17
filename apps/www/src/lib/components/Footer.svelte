<script lang="ts">
import { SITE_VERSION } from '$lib/version'
</script>

<footer class="site-footer">
	<div class="container inner">
		<div class="footer-copy">
			<strong class="footer-brand">Tuix</strong>
			<span class="footer-sep">—</span>
			<span>Bun-native terminal UI · JSX · Effect MVU · v{SITE_VERSION}</span>
		</div>
		<nav class="footer-nav" aria-label="Footer">
			<a href="/docs">Docs</a>
			<a href="/docs/tutorials">Tutorials</a>
			<a href="/docs/architecture">Architecture</a>
			<a href="https://github.com/vibesdotdev/tuix" rel="noopener noreferrer">GitHub</a>
			<span class="footer-meta">MIT License</span>
		</nav>
	</div>
</footer>

<style>
	.footer-brand {
		color: var(--text);
		font-weight: 700;
	}

	.footer-sep {
		margin: 0 0.25rem;
		opacity: 0.7;
	}

	.footer-copy {
		max-width: 36rem;
		line-height: 1.5;
	}

	.footer-nav {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem 1.1rem;
	}

	.footer-nav a {
		color: var(--text-muted);
		text-decoration: none;
		font-weight: 500;
	}

	.footer-nav a:hover {
		color: var(--accent);
		text-decoration: none;
	}

	.footer-meta {
		color: var(--text-muted);
		opacity: 0.85;
	}
</style>

