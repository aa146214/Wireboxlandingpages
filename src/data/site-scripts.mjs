/**
 * Third-party scripts, managed in Storyblok.
 *
 * Editors add snippets to the "Site settings" story (slug `settings`) as
 * `site_script` blocks; every page's <Layout> reads that story and injects each
 * enabled block at its placement. The list below is the fallback the layout
 * uses when the story can't be fetched, so an outage never silently drops
 * analytics — and it is also what the seed puts into a fresh space, so a new
 * space starts with exactly what the code used to hardcode.
 *
 * Plain JS so both the seed script and Astro can import it.
 */

export const GTM_ID = 'GTM-5MQDMD38';
export const CRAZY_EGG_SRC = '//script.crazyegg.com/pages/scripts/0132/1340.js';

/** Where a snippet is injected. */
export const PLACEMENTS = ['head', 'body_start', 'body_end'];

export const DEFAULT_SITE_SCRIPTS = [
	{
		name: 'Google Tag Manager',
		placement: 'head',
		enabled: true,
		code: `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');</script>`,
	},
	{
		name: 'Google Tag Manager (noscript)',
		placement: 'body_start',
		enabled: true,
		code: `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
	},
	{
		name: 'Crazy Egg',
		placement: 'head',
		enabled: true,
		code: `<script type="text/javascript" src="${CRAZY_EGG_SRC}" async="async"></script>`,
	},
];

/**
 * The HTML to inject at one placement: every enabled snippet with code, in
 * list order, each preceded by a comment naming it so it's easy to find in
 * view-source.
 */
export function renderScripts(scripts, placement) {
	return (scripts || [])
		.filter((s) => s && s.enabled !== false && (s.placement || 'head') === placement && String(s.code || '').trim())
		.map((s) => `<!-- ${String(s.name || 'script').replace(/-->/g, '')} -->\n${String(s.code).trim()}`)
		.join('\n');
}
