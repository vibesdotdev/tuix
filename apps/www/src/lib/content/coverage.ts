/**
 * Honest documentation coverage map for the product site.
 * Package code status is Complete in MODULE_CATALOG; this tracks *docs* depth.
 */

export type CoverageRow = {
  area: string
  item: string
  docs: 'full' | 'partial' | 'gap'
  note: string
  href?: string
}

export const coverageRows: CoverageRow[] = [
  // Packages — all have STE package pages
  {
    area: 'Packages',
    item: 'All 22 @tuix/* packages',
    docs: 'full',
    note: 'Purpose, when to use, concepts, exports, example on each package page.',
    href: '/packages',
  },
  // Features
  {
    area: 'Features',
    item: 'FEATURE_CATALOG (10 features)',
    docs: 'full',
    note: 'What / how / subfeatures / example for each catalog feature.',
    href: '/docs/features',
  },
  // Guides
  {
    area: 'Guides',
    item: 'Install, quickstart, architecture, CLI, caps, testing, packages',
    docs: 'full',
    note: 'STE guides with code samples.',
    href: '/docs',
  },
  // Tutorials
  {
    area: 'Tutorials',
    item: 'Progressive path (hello → PTY → theming)',
    docs: 'full',
    note: 'Ten tutorials: routing, keys, forms, layout, async, live, PTY, theming.',
    href: '/docs/tutorials',
  },
  // Patterns
  {
    area: 'Patterns',
    item: 'Unique + common CLI/TUI paradigms',
    docs: 'full',
    note: 'JSX→MVU, named state, routing, async Cmd/Sub, layout, keys, platform Live, hooks.',
    href: '/docs/patterns',
  },
  {
    area: 'Patterns',
    item: 'Method-level Cmd/Sub/hooks API tables',
    docs: 'partial',
    note: 'Patterns and package pages cover shape. Full param tables still thin.',
    href: '/docs/patterns/async-cmd-sub',
  },
  // Components
  {
    area: 'UI components',
    item: 'Catalog index (display, layout, forms, data, feedback, …)',
    docs: 'partial',
    note: 'Every major export is listed with summary. Deep prop docs still gap.',
    href: '/docs/components',
  },
  {
    area: 'UI components',
    item: 'Form, TextInput, List, Checkbox (tutorial + brief pages)',
    docs: 'partial',
    note: 'Forms and lists tutorial uses real widgets. Prop tables still thin.',
    href: '/docs/tutorials/forms-and-lists',
  },
  {
    area: 'UI components',
    item: 'Tabs, Toast, Spinner, FilePicker, Toggle, …',
    docs: 'partial',
    note: 'Every catalog component now has a page with a usage example. Prop tables still thin.',
    href: '/docs/components',
  },
  // Methods / APIs
  {
    area: 'Methods / APIs',
    item: 'Package keyExports lists',
    docs: 'partial',
    note: 'Named exports with one-line STE phrases. Not full JSDoc tables.',
    href: '/packages/core',
  },
  {
    area: 'Methods / APIs',
    item: 'Cmd.* / Sub.* / RuntimeHooks / registerKeyHandler',
    docs: 'gap',
    note: 'Mentioned in features and package pages; no dedicated method reference.',
    href: '/packages/runtime',
  },
  {
    area: 'Methods / APIs',
    item: 'ansi style builders, view layout helpers, storage adapters',
    docs: 'gap',
    note: 'Use package pages + source. No per-function doc site yet.',
    href: '/packages/ansi',
  },
  // Use cases
  {
    area: 'Use cases',
    item: 'Hello, counter, CLI, forms, live caps, PTY',
    docs: 'full',
    note: 'Covered by tutorials.',
    href: '/docs/tutorials',
  },
  {
    area: 'Use cases',
    item: 'AI chat demos, config plugin UX, debug TUI walkthrough',
    docs: 'gap',
    note: 'Demos exist under apps/demo; no site tutorial yet.',
    href: '/docs/tutorials',
  },
  {
    area: 'Use cases',
    item: 'Graphics encode write path, bracketed paste UX',
    docs: 'partial',
    note: 'Feature pages exist; no end-to-end tutorial.',
    href: '/docs/features/graphics-encode-decode',
  },
  // Ecosystem depth
  {
    area: 'Ecosystem depth',
    item: 'coordination, telemetry, update, app-presets, debug panes',
    docs: 'partial',
    note: 'Package STE pages only. Few recipes.',
    href: '/packages/coordination',
  },
]

export const coverageSummary = {
  full: coverageRows.filter(r => r.docs === 'full').length,
  partial: coverageRows.filter(r => r.docs === 'partial').length,
  gap: coverageRows.filter(r => r.docs === 'gap').length,
}

export const docModel = {
  title: 'How docs are organized',
  layers: [
    {
      name: '1. Guides',
      body: 'Read guides for install, architecture, and testing. Guides answer “how does the system fit together?”',
      href: '/docs',
    },
    {
      name: '2. Tutorials',
      body: 'Build common products step by step. Each tutorial grows in difficulty. Tabs show JSX and Effect MVU styles.',
      href: '/docs/tutorials',
    },
    {
      name: '3. Packages',
      body: 'Open a package when you need purpose, exports, and a minimal example.',
      href: '/packages',
    },
    {
      name: '4. Features',
      body: 'Open a catalog feature when you need a Complete product capability and its subfeatures.',
      href: '/docs/features',
    },
    {
      name: '5. Components',
      body: 'Browse UI and JSX building blocks. Use this when you pick widgets for a screen.',
      href: '/docs/components',
    },
    {
      name: '6. Coverage',
      body: 'See what the site documents well and what still needs work.',
      href: '/docs/coverage',
    },
  ],
}
