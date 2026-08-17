import { createAppDeployment } from '@vibesdotdev/infra-core/deployment'
import { createCloudflareWebAppDeployment } from '@vibesdotdev/infra-cloudflare/web-app'

const baseDomain = 'vibes.dev'
const tuixOrigin = `https://tuix.${baseDomain}`

/**
 * Tuix product site (marketing + docs) — Cloudflare Workers edge app.
 *
 * Host: https://tuix.vibes.dev
 * Source: apps/www (SvelteKit 5 + adapter-cloudflare)
 */
const deployment = createAppDeployment({
  appId: 'tuix',
  appName: 'Tuix',
  provider: 'cloudflare-workers',
  runtime: 'edge',
  build: {
    // Runner chdirs into the app dir before build; commands must be
    // relative to apps/www. Install still runs at the repo root
    // (workspaceRootDir below) where the bun lockfile lives.
    workspaceRootDir: '../..',
    appDir: 'apps/www',
    installCommand: 'bun install --frozen-lockfile',
    buildCommand: 'bun run build',
    outputDir: 'apps/www/.svelte-kit/cloudflare',
  },
  origins: [
    {
      hostname: `tuix.${baseDomain}`,
      origin: tuixOrigin,
      kind: 'primary',
      description: 'Canonical Tuix product site (docs + marketing)',
    },
  ],
  env: [
    {
      name: 'PUBLIC_TUIX_ORIGIN',
      public: true,
      value: tuixOrigin,
      description: 'Canonical Tuix site origin',
    },
    {
      name: 'PUBLIC_VIBES_BASE_DOMAIN',
      public: true,
      value: baseDomain,
      description: 'Base domain for shared Vibes assets and fleet links',
    },
    {
      name: 'PUBLIC_VIBES_ASSETS_ORIGIN',
      public: true,
      value: `https://assets.${baseDomain}`,
      description: 'Shared static assets origin',
    },
    {
      name: 'NODE_ENV',
      public: true,
      value: 'production',
      description: 'Runtime mode for edge deployment',
    },
  ],
  dependsOn: [],
  upstreams: [],
  tags: ['tuix', 'docs', 'marketing', 'tui', 'cloudflare-workers', 'public-presence'],
})

const webAppDeployment = createCloudflareWebAppDeployment({
  deployment,
  workerName: 'tuix-www',
  compatibilityDate: '2026-04-15',
  observability: { enabled: true, head_sampling_rate: 0.1 },
})

export default webAppDeployment
