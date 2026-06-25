/**
 * Local content fixture for the Wirebox **website-support** landing page.
 *
 * The page is composed of the support-page bloks (see `astro.config.mjs` and
 * `src/storyblok/*`). Each section component carries the design's copy and
 * imagery as its defaults, so this fixture only needs to list the bloks in
 * order — overriding a field here (or in Storyblok) takes precedence over the
 * component default. The shape mirrors the Storyblok `page` story 1:1.
 */

export interface SbBlok {
	component: string;
	_uid?: string;
	[key: string]: unknown;
}

let uid = 0;
const u = (name: string) => `fixture-${name}-${++uid}`;

// Minimal header: logo + "call us on" pill only (no nav / search / socials).
const header: SbBlok = {
	component: 'header',
	_uid: u('header'),
	nav: [],
	socials: [],
	phone_label: 'call us on:',
	phone_number: '0207 993 5485',
};

const supportHero: SbBlok = { component: 'support_hero', _uid: u('support-hero') };
const trustBar: SbBlok = { component: 'trust_bar', _uid: u('trust-bar') };
const riskStats: SbBlok = { component: 'risk_stats', _uid: u('risk-stats') };
const valueProps: SbBlok = { component: 'value_props', _uid: u('value-props') };
const slaTiers: SbBlok = { component: 'sla_tiers', _uid: u('sla-tiers') };
const pricing: SbBlok = { component: 'pricing', _uid: u('pricing') };
const supportCases: SbBlok = { component: 'support_cases', _uid: u('support-cases') };

const testimonials: SbBlok = {
	component: 'testimonials',
	_uid: u('testimonials'),
	eyebrow: 'What our clients say',
	heading: 'The kind of partner you keep for years',
	heading_accent: 'keep for years',
	items: [
		{ name: 'James Randall', role: 'Co-founder, Kids Party Finder', vimeo: '1119462004' },
		{ name: 'Stephen Makinde', role: 'Owner, The Oak Practice & Perfect Balance Clinic', vimeo: '1127563818' },
		{ name: 'Glen Hempenstall', role: 'Communications Manager, Watford Town Centre BID', vimeo: '996278084' },
		{ name: 'Alison Hutchinson CBE', role: 'CEO, Pennies', vimeo: '1125445378' },
		{ quote: 'John and his team have been punctual, helpful and supportive showing both excellent knowledge of WordPress as well as a strong creative and design skill set. I would have no reservation in recommending Wirebox for WordPress development.', name: 'Nina Innocenti', role: 'Project Manager, Middlesex University' },
		{ quote: 'Wirebox went above and beyond, delivering a brilliant website with an attractive design, web governance conformity and smooth functionality – and it all went from brief to finished product within about two months.', name: 'Sweta Rana', role: 'Web Manager, Middlesex University' },
		{ quote: 'The Wirebox team worked from the initial scope and developed a fantastic solution which is interactive, fast, clear and allows full transparency and consistency across the business. We are delighted with the end result.', name: 'Kathryn Boyd', role: 'Director of HR, Search Consultancy' },
		{ quote: 'Wirebox were able to analyse reports and offer solutions to improve the site. It took a few weeks, but our score is 95+ which is the best in our industry. Really happy with the work and always will recommend Wirebox.', name: 'Mr Clutch', role: 'Marketing Manager' },
		{ quote: 'Great service – great knowledge throughout the company, very quick response and always have the solution to our problems in a professional and timely manner.', name: 'Chevin Fleet', role: 'Marketing Manager' },
	],
};

const faq: SbBlok = { component: 'faq', _uid: u('faq') };
const ctaContact: SbBlok = { component: 'cta_contact', _uid: u('cta-contact') };
const locations: SbBlok = { component: 'locations', _uid: u('locations') };
const footer: SbBlok = { component: 'footer', _uid: u('footer') };

export const homeContent: SbBlok = {
	component: 'page',
	_uid: u('page'),
	body: [
		header,
		supportHero,
		trustBar,
		riskStats,
		valueProps,
		slaTiers,
		pricing,
		supportCases,
		testimonials,
		faq,
		ctaContact,
		locations,
		footer,
	],
};

export function getHomeContent(): SbBlok {
	return homeContent;
}
