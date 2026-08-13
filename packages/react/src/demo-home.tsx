import { createElement } from 'react';
import { createCliRenderer, createRoot } from './index.ts';

function DemoHome() {
	return createElement(
		'box',
		{ flexDirection: 'column', padding: 1 },
		createElement('text', { bold: true }, 'Make something real'),
		createElement('text', null, 'Describe what you want to build'),
		createElement('text', null, 'Start · Chat · Code Sessions · Workers · MCP'),
		createElement('text', null, '? help · / commands')
	);
}

const renderer = await createCliRenderer({
	width: Number(process.env.COLUMNS ?? 100),
	height: Number(process.env.LINES ?? 30)
});
await renderer.start();
const root = createRoot(renderer);
root.render(createElement(DemoHome));
setInterval(() => {
	root.render(createElement(DemoHome));
}, 1000);
