import { createElement, type ReactElement, type ReactNode } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ViewportContext, type ViewportSize } from './hooks.ts';
import { nodeToView, renderViewSync, type ReactTestNode } from './json-to-view.ts';

export interface CliRenderer {
	width: number;
	height: number;
	start(): Promise<void> | void;
	stop(): void;
	destroy(): void;
	write?(frame: string): void;
	waitForThemeMode?(ms?: number): Promise<'dark' | 'light' | null>;
	on?(event: string, fn: (mode: 'dark' | 'light') => void): void;
}

export interface CreateCliRendererOptions {
	width?: number;
	height?: number;
	useMouse?: boolean;
	enableMouseMovement?: boolean;
	backgroundColor?: string;
}

export async function createCliRenderer(options: CreateCliRendererOptions = {}): Promise<CliRenderer> {
	const width = options.width ?? process.stdout.columns ?? 80;
	const height = options.height ?? process.stdout.rows ?? 24;
	return {
		width,
		height,
		start() {},
		stop() {},
		destroy() {},
		write(frame: string) {
			process.stdout.write(`\x1b[?1049h\x1b[H${frame}`);
		}
	};
}

export interface TuixRoot {
	render(element: ReactElement): void;
	unmount(): void;
}

export function createRoot(renderer: CliRenderer): TuixRoot {
	let host: TestRenderer.ReactTestRenderer | null = null;
	const size: ViewportSize = { width: renderer.width, height: renderer.height };

	const paint = (): void => {
		if (!host) return;
		const json = host.toJSON() as ReactTestNode | ReactTestNode[] | string | null;
		const node = Array.isArray(json) ? { type: 'box', children: json } : json;
		const frame = renderViewSync(nodeToView(node));
		renderer.write?.(frame);
	};

	return {
		render(element: ReactElement) {
			const tree = createElement(ViewportContext.Provider, { value: size }, element);
			if (!host) {
				act(() => {
					host = TestRenderer.create(tree);
				});
			} else {
				act(() => {
					host!.update(tree);
				});
			}
			paint();
		},
		unmount() {
			act(() => {
				host?.unmount();
			});
			host = null;
			renderer.stop();
			renderer.destroy();
		}
	};
}

export function wrapWithViewport(node: ReactNode, size: ViewportSize): ReactElement {
	return createElement(ViewportContext.Provider, { value: size }, node);
}
