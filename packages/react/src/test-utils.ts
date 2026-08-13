import { createElement, type ReactElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ViewportContext } from './hooks.ts';
import { dispatchKey, resetKeyboardListeners, type KeyEvent } from './hooks.ts';
import { nodeToView, renderViewSync, type ReactTestNode } from './json-to-view.ts';

export interface TestRenderOptions {
	width?: number;
	height?: number;
}

export interface TestRendererHandle {
	renderOnce(): Promise<void>;
	captureCharFrame(): string;
	captureSpans(): unknown[];
	mockInput: {
		pressEnter(): Promise<void>;
		pressEscape(): Promise<void>;
		typeText(text: string): Promise<void>;
		pressTab(): Promise<void>;
	};
	destroy(): void;
}

function paint(host: TestRenderer.ReactTestRenderer): string {
	const json = host.toJSON() as ReactTestNode | ReactTestNode[] | string | null;
	const node = Array.isArray(json) ? { type: 'box', children: json } : json;
	return renderViewSync(nodeToView(node));
}

export async function testRender(
	element: ReactElement,
	options: TestRenderOptions = {}
): Promise<TestRendererHandle> {
	resetKeyboardListeners();
	const size = { width: options.width ?? 80, height: options.height ?? 24 };
	const tree = createElement(ViewportContext.Provider, { value: size }, element);
	let host!: TestRenderer.ReactTestRenderer;
	await act(() => {
		host = TestRenderer.create(tree);
	});
	let last = paint(host);

	const send = async (key: KeyEvent) => {
		await act(() => {
			dispatchKey(key);
			host.update(tree);
		});
		last = paint(host);
	};

	return {
		async renderOnce() {
			await act(() => {
				host.update(tree);
			});
			last = paint(host);
		},
		captureCharFrame() {
			return last;
		},
		captureSpans() {
			return [];
		},
		mockInput: {
			pressEnter: () => send({ name: 'return' }),
			pressEscape: () => send({ name: 'escape' }),
			pressTab: () => send({ name: 'tab' }),
			typeText: async (value: string) => {
				for (const ch of value) {
					await send({ name: ch, raw: ch });
				}
			}
		},
		destroy() {
			act(() => {
				host.unmount();
			});
			resetKeyboardListeners();
		}
	};
}
