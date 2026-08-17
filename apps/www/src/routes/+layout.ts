// All site content is build-time data (no per-request rendering needed).
// SvelteKit emits static HTML/assets; the Worker serves them and still
// handles unknown URLs dynamically (error pages).
export const prerender = true
