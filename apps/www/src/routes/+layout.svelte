<script lang="ts">
import { page } from '$app/state'
import Header from '$lib/components/Header.svelte'
import Footer from '$lib/components/Footer.svelte'
import '$lib/styles/app.css'

let { children } = $props()

const siteOrigin = 'https://tuix.vibes.dev'
const canonical = $derived(`${siteOrigin}${page.url.pathname === '/' ? '' : page.url.pathname}`)
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<title>Tuix</title>
	<meta name="description" content="Tuix — Bun-native terminal UI framework with JSX, reactive runes, and Effect MVU." />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Tuix" />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={`${siteOrigin}/og.jpg`} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={`${siteOrigin}/og.jpg`} />
</svelte:head>

<Header />
<main>
	{@render children()}
</main>
<Footer />
