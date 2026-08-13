import { describe, expect, it } from 'bun:test';
import { formatStatusBar } from './StatusBar.tsx';

describe('StatusBar', () => {
	it('joins facts and hints into one line', () => {
		expect(
			formatStatusBar({
				facts: [{ slot: 'context', value: 'main · dirty' }],
				hints: [{ keys: '?', label: 'help' }]
			})
		).toBe('main · dirty  ·  [?] help');
	});

	it('drops blank facts', () => {
		expect(formatStatusBar({ facts: [{ slot: 'context', value: '  ' }] })).toBe('');
	});
});
