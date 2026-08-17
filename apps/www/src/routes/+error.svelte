<script lang="ts">
import Header from '$lib/components/Header.svelte'
import Footer from '$lib/components/Footer.svelte'
import '$lib/styles/app.css'

let { status, message } = $props()
</script>

<svelte:head>
	<title>{status} · Tuix</title>
	<meta name="description" content="Page not found on tuix.vibes.dev." />
	<meta name="robots" content="noindex" />
</svelte:head>

<Header />
<main>
	<section class="error-page">
		<p class="error-code">{status}</p>
		<h1>{status === 404 ? 'Nothing at this address' : 'Something broke'}</h1>
		<p class="error-message">
			{status === 404
				? 'The page you asked for does not exist. It may have moved.'
				: (message ?? 'An unexpected error occurred.')}
		</p>
		<div class="error-actions">
			<a href="/">Back to the homepage</a>
			<a href="/docs">Read the docs</a>
			<a href="/get-started">Get started</a>
		</div>
	</section>
</main>
<Footer />

<style>
	.error-page {
		max-width: 640px;
		margin: 0 auto;
		padding: 6rem 1.5rem 8rem;
		text-align: center;
	}

	.error-code {
		font-family: var(--font-mono, monospace);
		font-size: 0.875rem;
		letter-spacing: 0.2em;
		color: #34d399;
		margin: 0 0 0.75rem;
	}

	h1 {
		font-size: 2rem;
		margin: 0 0 0.75rem;
		color: #e8eef7;
	}

	.error-message {
		color: #8fa3ba;
		margin: 0 0 2rem;
	}

	.error-actions {
		display: flex;
		gap: 1.25rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.error-actions a {
		color: #22d3ee;
		text-decoration: none;
	}

	.error-actions a:hover {
		text-decoration: underline;
	}
</style>
