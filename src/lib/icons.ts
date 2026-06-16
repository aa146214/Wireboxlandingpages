/**
 * Inline SVG icon set. Glyphs use a 24x24 viewBox and `currentColor`.
 * Add new glyphs here as sections need them; render via <Icon name="..." />.
 */
export type IconName =
	| 'search'
	| 'arrow-right'
	| 'arrow-up-right'
	| 'menu'
	| 'close'
	| 'play'
	| 'plus'
	| 'minus'
	| 'facebook'
	| 'twitter'
	| 'vimeo'
	| 'linkedin'
	| 'github'
	| 'instagram'
	| 'tiktok'
	| 'youtube';

export const icons: Record<IconName, string> = {
	search:
		'<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
	'arrow-right':
		'<path d="M4 12h15m0 0-6-6m6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
	'arrow-up-right':
		'<path d="M7 17 17 7m0 0H8m9 0v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
	menu: '<path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
	close:
		'<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
	play: '<path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor"/>',
	plus: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
	minus: '<path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
	facebook:
		'<path d="M14 8.5h2.5V5.5H14c-2.2 0-3.5 1.4-3.5 3.6V11H8v3h2.5v6.5h3V14H16l.5-3h-3V9.3c0-.5.3-.8 1-.8Z" fill="currentColor"/>',
	twitter:
		'<path d="M21 6.1c-.7.3-1.4.5-2.1.6.8-.5 1.3-1.2 1.6-2-.7.4-1.5.7-2.4.9A3.6 3.6 0 0 0 12 8.9c0 .3 0 .6.1.8A10.3 10.3 0 0 1 4.6 5.9a3.6 3.6 0 0 0 1.1 4.8c-.6 0-1.1-.2-1.6-.4v.1c0 1.7 1.2 3.2 2.9 3.5a3.6 3.6 0 0 1-1.6.1 3.6 3.6 0 0 0 3.4 2.5A7.3 7.3 0 0 1 3 18a10.3 10.3 0 0 0 5.6 1.6c6.7 0 10.3-5.5 10.3-10.3v-.5c.7-.5 1.3-1.1 1.8-1.8Z" fill="currentColor"/>',
	vimeo:
		'<path d="M21 8.1c-.1 2-1.5 4.7-4.2 8.2C14 19.9 11.7 21.7 9.9 21.7c-1.1 0-2-1-2.8-3.1L5.6 12c-.5-2-1.1-3.1-1.7-3.1-.1 0-.6.3-1.4.9L1.6 8.6c.9-.8 1.8-1.6 2.7-2.4 1.2-1 2.1-1.6 2.7-1.7 1.4-.1 2.3.8 2.6 2.9.3 2.2.6 3.6.7 4.2.4 2 .9 3 1.4 3 .4 0 1-.6 1.8-1.9.8-1.3 1.2-2.2 1.3-2.9.1-1-.3-1.4-1.3-1.4-.4 0-.9.1-1.4.3 1-3.1 2.8-4.6 5.4-4.5 2 .1 2.9 1.3 2.8 3.8Z" fill="currentColor"/>',
	linkedin:
		'<path d="M8.3 18.5H5.5V9.7h2.8v8.8ZM6.9 8.5a1.6 1.6 0 1 1 0-3.3 1.6 1.6 0 0 1 0 3.3Zm11.6 10h-2.8v-4.3c0-1 0-2.4-1.5-2.4s-1.7 1.1-1.7 2.3v4.4H9.7V9.7h2.7v1.2h.1c.4-.7 1.3-1.5 2.7-1.5 2.9 0 3.4 1.9 3.4 4.3v4.8Z" fill="currentColor"/>',
	github:
		'<path d="M12 3a9 9 0 0 0-2.8 17.5c.4.1.6-.2.6-.4v-1.6c-2.5.5-3-1.2-3-1.2-.4-1-1-1.3-1-1.3-.8-.6 0-.6 0-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-2-.2-4.1-1-4.1-4.4 0-1 .3-1.8.9-2.4-.1-.3-.4-1.2.1-2.4 0 0 .7-.2 2.4.9a8.3 8.3 0 0 1 4.4 0c1.7-1.1 2.4-.9 2.4-.9.5 1.2.2 2.1.1 2.4.6.6.9 1.4.9 2.4 0 3.4-2.1 4.2-4.1 4.4.3.3.6.8.6 1.7v2.5c0 .2.2.5.6.4A9 9 0 0 0 12 3Z" fill="currentColor"/>',
	instagram:
		'<rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16.5" cy="7.5" r="1.2" fill="currentColor"/>',
	tiktok:
		'<path d="M14 4c.3 2 1.5 3.5 3.5 3.8v2.6c-1.2 0-2.4-.4-3.5-1.1v5.4a4.8 4.8 0 1 1-4.8-4.8c.3 0 .5 0 .8.1v2.7a2.1 2.1 0 1 0 1.5 2V4H14Z" fill="currentColor"/>',
	youtube:
		'<path d="M21.5 8.3c-.2-1-.9-1.7-1.9-2C17.9 6 12 6 12 6s-5.9 0-7.6.4c-1 .2-1.7.9-1.9 2C2 10 2 12 2 12s0 2 .4 3.7c.2 1 .9 1.7 1.9 2C6 18 12 18 12 18s5.9 0 7.6-.4c1-.2 1.7-.9 1.9-2C22 14 22 12 22 12s0-2-.5-3.7ZM10 15V9l5.2 3L10 15Z" fill="currentColor"/>',
};
