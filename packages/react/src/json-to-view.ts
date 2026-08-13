import { Effect } from 'effect';
import { box as styledBox, text, vstack, hstack, empty, type View } from '@tuix/view';
import { parseColor, renderStyledSync, style } from '@tuix/ansi';

export interface ReactTestNode {
	type?: string | unknown;
	props?: Record<string, unknown>;
	children?: Array<ReactTestNode | string | number | null>;
}

function asString(value: unknown): string {
	if (value == null || typeof value === 'boolean') return '';
	return String(value);
}

function childrenOf(node: ReactTestNode): Array<ReactTestNode | string | number> {
	const raw = node.children ?? [];
	return raw.filter((child): child is ReactTestNode | string | number => child != null && child !== false);
}

function childViews(node: ReactTestNode): View[] {
	const views: View[] = [];
	for (const child of childrenOf(node)) {
		if (typeof child === 'string' || typeof child === 'number') {
			views.push(text(asString(child)));
			continue;
		}
		views.push(nodeToView(child));
	}
	return views.length > 0 ? views : [empty()];
}

function styledText(content: string, props: Record<string, unknown>): View {
	const inline = (props.style ?? {}) as Record<string, unknown>;
	const fg = asString(inline.fg || props.color || '') || undefined;
	const bold = Boolean(inline.fontWeight === 'bold' || props.bold);
	const italic = Boolean(inline.fontStyle === 'italic' || props.italic);
	let painted = text(content);
	if (fg || bold || italic) {
		let s = style();
		if (fg) {
			const parsed = parseColor(fg);
			if (parsed) s = s.foreground(parsed);
		}
		if (bold) s = s.bold();
		if (italic) s = s.italic();
		const paintedStyle = s;
		painted = {
			width: text(content).width,
			height: text(content).height,
			render: () => Effect.succeed(renderStyledSync(content, paintedStyle))
		};
	}
	return painted;
}

export function nodeToView(node: ReactTestNode | string | number | null | undefined): View {
	if (node == null) return empty();
	if (typeof node === 'string' || typeof node === 'number') return text(asString(node));
	const type = typeof node.type === 'string' ? node.type : 'box';
	const props = node.props ?? {};
	if (type === 'text') {
		const bits = childrenOf(node).map((child) =>
			typeof child === 'string' || typeof child === 'number' ? asString(child) : ''
		);
		return styledText(bits.join(''), props);
	}
	const kids = childViews(node);
	const direction = String(props.flexDirection ?? props.direction ?? 'column');
	const stacked = direction === 'row' || direction === 'horizontal' ? hstack(kids) : vstack(kids);
	const border = props.borderStyle || props.border ? true : false;
	if (border) {
		return styledBox(stacked, { padding: typeof props.padding === 'number' ? props.padding : 0 });
	}
	return stacked;
}

export function renderViewSync(view: View): string {
	const result = Effect.runSync(view.render());
	return typeof result === 'string' ? result : result.content;
}
