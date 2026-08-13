/**
 * One-line status bar: ordered facts plus key hints.
 * Consumed by any Tuix app that wants a single owner per fact slot.
 */
export interface StatusFact {
	slot: string;
	value: string;
	tone?: 'default' | 'muted' | 'warning' | 'danger' | 'success';
}

export interface StatusHint {
	keys: string;
	label: string;
}

export interface StatusBarProps {
	facts?: StatusFact[];
	hints?: StatusHint[];
}

export function formatStatusBar(props: StatusBarProps): string {
	const facts = (props.facts ?? []).map((fact) => fact.value).filter((value) => value.trim().length > 0);
	const hints = (props.hints ?? [])
		.filter((hint) => hint.keys && hint.label)
		.map((hint) => `${hint.keys} ${hint.label}`);
	return [...facts, ...hints].join(' · ');
}

export function StatusBar(props: StatusBarProps): JSX.Element {
	return <text>{formatStatusBar(props)}</text>;
}
