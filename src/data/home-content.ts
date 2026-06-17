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
		{ quote: 'Despite the lack of a formal commitment from us, they always get the job done on time.', name: 'Ben Hallifax', role: 'HR Business Partner, Northgate Industries' },
		{ quote: 'They are friendly, competent, and most importantly, finish projects within the time frame agreed.', name: 'Melanie Pizzey', role: 'Operations Director, KPF LTD.' },
		{ quote: 'We have been using Wirebox for a few months now to help improve and maintain our website. The team are easy to deal with and have a great system for ensuring tasks are prioritised and completed on time. Would recommend to anyone!', name: 'Alexander Girvan', role: 'Client Services Lead, Orion Partners' },
		{ video: { filename: 'https://a.storyblok.com/f/293147646055661/36434ef311/testimonial-video.png' }, name: 'John Smith', role: 'Marketing Manager, Veritas Group' },
		{ quote: "They understand our business and they're able to put the right suggestions forward that help enhance our operations.", name: 'Jack Stubbs', role: 'Project Manager, Horizon Dynamics' },
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
