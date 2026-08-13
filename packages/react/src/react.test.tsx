import { describe, expect, it } from 'bun:test';
import { createElement } from 'react';
import { testRender } from './test-utils.ts';

function Box(props: { children?: unknown; flexDirection?: string }) {
	return createElement('box', props, props.children as never);
}
function Text(props: { children?: unknown; color?: string; bold?: boolean }) {
	return createElement('text', props, props.children as never);
}

describe('@tuix/react', () => {
	it('paints React box/text through Tuix views', async () => {
		const tree = createElement(
			Box,
			null,
			createElement(Text, { bold: true }, 'Hello Tuix'),
			createElement(Text, null, 'second line')
		);
		const renderer = await testRender(tree, { width: 40, height: 10 });
		await renderer.renderOnce();
		const frame = renderer.captureCharFrame();
		expect(frame).toContain('Hello Tuix');
		expect(frame).toContain('second line');
		renderer.destroy();
	});
});
