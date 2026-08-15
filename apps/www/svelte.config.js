import adapter from '@sveltejs/adapter-cloudflare'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
  },
  kit: {
    adapter: adapter({
      // Platform Worker Assets + Worker for SvelteKit
      routes: {
        include: ['/*'],
        exclude: ['<all>'],
      },
    }),
    prerender: {
      origin: 'https://tuix.vibes.dev',
      handleHttpError: 'warn',
    },
  },
}

export default config
