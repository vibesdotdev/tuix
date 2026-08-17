<script lang="ts">
import { page } from '$app/state'
</script>

<a class="edit-link" href={`https://github.com/vibesdotdev/tuix/edit/main/apps/www/src/routes${page.url.pathname}/+page.svelte`}>
	Edit this page on GitHub
</a>

<style>
	.edit-link {
		display: inline-block;
		margin-top: 2.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border, #243041);
		font-family: var(--mono, monospace);
		font-size: 0.8rem;
		color: var(--text-muted, #a8b8cc);
		text-decoration: none;
	}

	.edit-link:hover {
		color: var(--accent, #34d399);
		text-decoration: underline;
	}
</style>
