/** Shared text helpers. */

/**
 * Split a heading around an accent substring so the accent can be wrapped in a
 * coloured <span> without injecting raw HTML. Returns the three pieces; if the
 * accent isn't found, `mid`/`post` are empty and `pre` is the whole string.
 */
export function splitHighlight(
	text: string,
	accent?: string
): { pre: string; mid: string; post: string } {
	if (!accent) return { pre: text, mid: '', post: '' };
	const i = text.indexOf(accent);
	if (i === -1) return { pre: text, mid: '', post: '' };
	return {
		pre: text.slice(0, i),
		mid: accent,
		post: text.slice(i + accent.length),
	};
}
