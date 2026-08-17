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
	<link rel="preload" href="/fonts/ibmplexsans-var.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href="/fonts/ibmplexmono-400.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
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
