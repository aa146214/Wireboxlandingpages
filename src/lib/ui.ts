/** Shared UI type aliases (kept in .ts — Astro frontmatter can't export type unions). */

export type ButtonVariant =
	| 'primary' // filled yellow, purple text
	| 'outline' // yellow border + text (on dark/purple)
	| 'outline-dark' // dark border + text (on light)
	| 'solid' // filled purple, white text
	| 'fuchsia' // filled fuchsia/pink, white text
	| 'deep' // filled dark-blue, white text
	| 'outline-lavender'; // lavender border, purple text (on light)
