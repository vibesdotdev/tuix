import { createContext, useContext, useEffect, type Context } from 'react';

export interface ViewportSize {
	width: number;
	height: number;
}

export interface KeyEvent {
	name: string;
	ctrl?: boolean;
	meta?: boolean;
	shift?: boolean;
	raw?: string;
}

export type KeyboardHandler = (key: KeyEvent) => boolean | void;

export const ViewportContext: Context<ViewportSize> = createContext<ViewportSize>({
	width: 80,
	height: 24
});

const keyboardListeners = new Set<KeyboardHandler>();

export function useViewport(): ViewportSize {
	return useContext(ViewportContext);
}

export function useKeyboard(handler: KeyboardHandler): void {
	useEffect(() => {
		keyboardListeners.add(handler);
		return () => {
			keyboardListeners.delete(handler);
		};
	}, [handler]);
}

export function dispatchKey(key: KeyEvent): boolean {
	for (const listener of [...keyboardListeners].reverse()) {
		if (listener(key) === true) return true;
	}
	return false;
}

export function resetKeyboardListeners(): void {
	keyboardListeners.clear();
}

/** OpenTUI-shaped no-ops so existing product hooks compile against this backend. */
export function useRenderer(): null {
	return null;
}

export function useSelectionHandler(): void {}

export function useTimeline(): { start(): void; stop(): void } {
	return { start() {}, stop() {} };
}

export function extend(_components: Record<string, unknown>): void {}
