export {
	createCliRenderer,
	createRoot,
	wrapWithViewport,
	type CliRenderer,
	type CreateCliRendererOptions,
	type TuixRoot
} from './create-root.ts';

export {
	useKeyboard,
	useViewport,
	useRenderer,
	useSelectionHandler,
	useTimeline,
	extend,
	dispatchKey,
	resetKeyboardListeners,
	ViewportContext,
	type ViewportSize,
	type KeyEvent,
	type KeyboardHandler
} from './hooks.ts';

export { nodeToView, renderViewSync } from './json-to-view.ts';
