<script lang="ts">
import Header from '$lib/components/Header.svelte'
import Footer from '$lib/components/Footer.svelte'
import '$lib/styles/app.css'

let { children } = $props()
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<meta name="description" content="Tuix — Bun-native terminal UI framework with JSX, reactive runes, and Effect MVU." />
	<title>Tuix</title>
</svelte:head>

<Header />
<main>
	{@render children()}
</main>
<Footer />
