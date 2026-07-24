/**
 * Reseed the Wirebox Home story as the **website-support landing page**.
 *
 * The support-page section components (src/storyblok/Support*.astro, Pricing,
 * Faq, …) each carry the design's copy and imagery as their defaults, and the
 * Storyblok Delivery API returns whatever blok JSON is stored regardless of the
 * editor schema. So this script simply sets the Home story `body[]` to the
 * support-page bloks: most are "marker" bloks (component name only) that render
 * from their defaults, plus the two that need explicit content — the minimal
 * header (no nav / socials) and the testimonials list.
 *
 * Imagery: case-study + team images are served from /public/seed-assets (which
 * is deployed), and the testimonial video + location maps from the Storyblok
 * CDN — so no asset upload step is needed here.
 *
 * Usage (token is NOT stored in the repo):
 *   SB_MANAGEMENT_TOKEN=sb_pat_xxx node scripts/seed-support-home.mjs
 */

import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED_ASSETS = fileURLToPath(new URL('../public/seed-assets/support', import.meta.url));

const TOKEN = process.env.SB_MANAGEMENT_TOKEN;
const SPACE = process.env.SB_SPACE_ID || '293147646055661';
const HOME_STORY_ID = process.env.SB_HOME_STORY_ID || '186762709919814';
const MAPI = `https://mapi.storyblok.com/v1/spaces/${SPACE}`;

if (!TOKEN) {
	console.error('Missing SB_MANAGEMENT_TOKEN env var.');
	process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function mapi(method, path, body) {
	for (let attempt = 0; attempt < 6; attempt++) {
		const res = await fetch(MAPI + path, {
			method,
			headers: { Authorization: TOKEN, 'Content-Type': 'application/json' },
			body: body ? JSON.stringify(body) : undefined,
		});
		if (res.status === 429) {
			await sleep(1500 * (attempt + 1));
			continue;
		}
		const text = await res.text();
		if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
		return text ? JSON.parse(text) : {};
	}
	throw new Error(`${method} ${path} -> rate limited after retries`);
}

/* ------------------------------------------------------------------ *
 * Asset upload — push the support-page imagery to the Asset Manager so
 * the live site serves it from the Storyblok CDN (not /public). Reuses
 * any asset already in the space, matched by basename.
 * ------------------------------------------------------------------ */

const ASSET_DEFS = {
	'support-mrclutch.png': 'Mr Clutch – Wirebox client',
	'support-bulgin.png': 'Bulgin – Wirebox client',
	'support-penguin.png': 'Penguin Cold Caps – Wirebox client',
	'support-pennies.png': 'Pennies – Wirebox client',
	'support-middlesex.png': 'Middlesex University – Wirebox client',
	'support-sapphire.png': 'Sapphire Gymnastics – Wirebox client',
	'support-team.png': 'A Wirebox support specialist working with a client',
	'hero-building.png': 'The Wirebox building',
	'biz4biz.png': 'biz4Biz Awards 2023 Winner',
	'sme.png': 'SME Hertfordshire Business Awards',
	'watford-pledge.png': 'Watford Business Pledge Member',
	'aws-partner.png': 'AWS Partner',
};
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml' };
const mimeOf = (f) => MIME[f.split('.').pop().toLowerCase()] || 'application/octet-stream';

/** basename -> { id, filename(cdn url), alt } */
const assets = {};

async function uploadAssets() {
	console.log('\n=== Assets ===');
	const existingByBase = new Map();
	let page = 1;
	for (;;) {
		const res = await mapi('GET', `/assets/?per_page=100&page=${page}`);
		const list = res.assets || [];
		for (const a of list) existingByBase.set(basename(a.filename.split('?')[0]), a);
		if (list.length < 100) break;
		page++;
	}
	for (const [name, alt] of Object.entries(ASSET_DEFS)) {
		const reuse = existingByBase.get(name);
		if (reuse) {
			assets[name] = { id: reuse.id, filename: reuse.filename, alt };
			console.log(`  reused   ${name}`);
			continue;
		}
		const file = join(SEED_ASSETS, name);
		if (!existsSync(file)) {
			console.warn(`  MISSING  ${name} (not in space and not in seed-assets/support — skipped)`);
			continue;
		}
		const buf = readFileSync(file);
		const sign = await mapi('POST', '/assets/', { filename: name });
		const form = new FormData();
		for (const [k, v] of Object.entries(sign.fields)) form.append(k, String(v));
		form.append('file', new Blob([buf], { type: mimeOf(name) }), name);
		const up = await fetch(sign.post_url, { method: 'POST', body: form });
		if (!up.ok && up.status !== 204) throw new Error(`S3 ${name} -> ${up.status} ${await up.text()}`);
		const got = await mapi('GET', `/assets/${sign.id}`);
		const filename = got.filename || got.asset?.filename || sign.pretty_url;
		assets[name] = { id: sign.id, filename, alt };
		existingByBase.set(name, { id: sign.id, filename });
		console.log(`  uploaded ${name}`);
		await sleep(150);
	}
}

/** Build a Storyblok asset field object from an uploaded basename. */
function A(name) {
	const a = assets[name];
	if (!a) return { fieldtype: 'asset', filename: `/seed-assets/support/${name}`, alt: '' };
	return { id: a.id, filename: a.filename, alt: a.alt ?? '', fieldtype: 'asset', is_external_url: false };
}

/* ------------------------------------------------------------------ *
 * Component schemas — the Management API rejects a story that references
 * components that don't exist in the space, so make sure the support-page
 * components are present. Bloks are seeded as markers (content comes from the
 * component defaults), so these schemas only need the primary fields editors
 * would reach for; everything else falls back to the component default.
 * ------------------------------------------------------------------ */

const text = (pos, extra = {}) => ({ type: 'text', pos, ...extra });
const area = (pos, extra = {}) => ({ type: 'textarea', pos, ...extra });
const bool = (pos) => ({ type: 'boolean', pos });
const asset = (pos) => ({ type: 'asset', filetypes: ['images'], pos });
const multiasset = (pos) => ({ type: 'multiasset', filetypes: ['images'], pos });
const link = (pos) => ({ type: 'multilink', pos });
const bloks = (pos, whitelist) => ({ type: 'bloks', restrict_components: true, component_whitelist: whitelist, pos });
const opt = (pos, values, def) => ({
	type: 'option',
	use_uuid: false,
	options: values.map((v) => (typeof v === 'string' ? { name: v, value: v } : v)),
	...(def !== undefined ? { default_value: def } : {}),
	pos,
});

const SUPPORT_COMPONENTS = [
	// leaves
	{ name: 'hero_stat', schema: { value: text(0), label: text(1), tone: opt(2, ['pink', 'green'], 'pink') } },
	{ name: 'trust_item', schema: { text: text(0) } },
	{ name: 'risk_stat', schema: { value: text(0), description: area(1) } },
	{ name: 'vp_feature', schema: { title: text(0), description: area(1), tone: opt(2, ['dark', 'fuchsia', 'purple'], 'dark') } },
	{ name: 'vp_chip', schema: { label: text(0) } },
	{ name: 'sla_tier', schema: { value: text(0), label: text(1), description: area(2), tone: opt(3, ['pink', 'yellow', 'green', 'cyan'], 'pink') } },
	{ name: 'pricing_plan', schema: { tier: text(0), name: text(1), badge: text(2), price_prefix: text(3), price: text(4), meta: text(5), features: area(6, { description: 'One feature per line' }), cta_label: text(7), cta_variant: opt(8, ['outline-lavender', 'solid', 'fuchsia', 'deep'], 'outline-lavender'), cta_link: text(9), featured: bool(10) } },
	{ name: 'support_case', schema: { title: text(0), duration: text(1), description: area(2), tags: area(3, { description: 'One tag per line' }), image: asset(4), link: link(5) } },
	{ name: 'faq_item', schema: { question: text(0), answer: area(1), open: bool(2) } },
	{ name: 'cta_phone', schema: { number: text(0), label: text(1) } },
	{ name: 'map_place', schema: { label: text(0), query: text(1, { description: 'Address or lat,lng the Google Map centres on' }), link: text(2) } },
	{ name: 'testimonial', schema: { quote: area(0), name: text(1), role: text(2), vimeo: text(3, { description: 'Vimeo video id or URL — set for video reviews' }) } },
	// Shared leaves (header/footer/hero) — created here so a fresh space seeds cleanly.
	{ name: 'nav_item', schema: { label: text(0), link: link(1), highlight: bool(2) } },
	{ name: 'social_link', schema: { platform: opt(0, ['facebook', 'twitter', 'vimeo', 'linkedin', 'github', 'instagram', 'tiktok', 'youtube']), url: text(1) } },
	{ name: 'cta', schema: { label: text(0), link: link(1), variant: opt(2, ['primary', 'outline', 'outline-dark', 'solid', 'fuchsia', 'deep', 'outline-lavender'], 'primary'), icon: opt(3, [{ name: 'None', value: '' }, { name: 'Arrow right', value: 'arrow-right' }], '') } },
	{ name: 'footer_link', schema: { label: text(0), link: text(1) } },
	{ name: 'footer_office', schema: { name: text(0), address: area(1), phone: text(2), email: text(3) } },
	{ name: 'footer_service', schema: { label: text(0), link: text(1), expanded: bool(2), children: bloks(3, ['footer_link']) } },
	// Shared sections.
	{ name: 'header', schema: { logo: asset(0), nav: bloks(1, ['nav_item']), phone_label: text(2), phone_number: text(3), socials: bloks(4, ['social_link']) } },
	{ name: 'testimonials', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), items: bloks(3, ['testimonial']) } },
	{ name: 'footer', schema: { offices: bloks(0, ['footer_office']), services: bloks(1, ['footer_service']), links: bloks(2, ['footer_link']), credentials: multiasset(3), socials: bloks(4, ['social_link']), privacy_label: text(5), copyright: text(6) } },
	// sections
	{ name: 'support_hero', schema: { eyebrow: text(0), heading: area(1), heading_accent: text(2), body: area(3), ctas: bloks(4, ['cta']), card_title: text(5), stats: bloks(6, ['hero_stat']), form_title: text(7), form_cta_label: text(8), form_note: text(9), bg_image: asset(10) } },
	{ name: 'trust_bar', schema: { items: bloks(0, ['trust_item']) } },
	{ name: 'risk_stats', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), stats: bloks(3, ['risk_stat']), footnote: text(4), cta_label: text(5), cta_link: text(6) } },
	{ name: 'value_props', schema: { eyebrow: text(0), heading: text(1), body: area(2), cta_label: text(3), cta_link: text(4), image: asset(5), toolkit_title: text(6), toolkit: area(7, { description: 'One tool per line' }), features: bloks(8, ['vp_feature']) } },
	{ name: 'sla_tiers', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), subtitle: area(3), tiers: bloks(4, ['sla_tier']) } },
	{ name: 'pricing', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), subtitle: area(3), plans: bloks(4, ['pricing_plan']), footnote: text(5), foot_link_label: text(6), foot_link: text(7), foot_trail: text(8) } },
	{ name: 'support_cases', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), subtitle: area(3), items: bloks(4, ['support_case']) } },
	{ name: 'faq', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), items: bloks(3, ['faq_item']) } },
	{ name: 'cta_contact', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), body: area(3), phones: bloks(4, ['cta_phone']), form_cta_label: text(5) } },
	{ name: 'locations', schema: { places: bloks(0, ['map_place']) } },
];

async function syncComponents() {
	const { components: existing } = await mapi('GET', '/components/');
	const byName = new Map(existing.map((c) => [c.name, c]));
	for (const def of SUPPORT_COMPONENTS) {
		const payload = {
			name: def.name,
			display_name: def.name.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
			is_root: false,
			is_nestable: true,
			schema: def.schema,
		};
		const found = byName.get(def.name);
		if (found) {
			await mapi('PUT', `/components/${found.id}`, { component: { ...payload, id: found.id } });
			console.log(`  updated  ${def.name}`);
		} else {
			await mapi('POST', '/components/', { component: payload });
			console.log(`  created  ${def.name}`);
		}
	}
}

const sb = (component, fields = {}) => ({ _uid: randomUUID(), component, ...fields });
const mlink = (url) => ({ id: '', url, linktype: 'url', fieldtype: 'multilink', cached_url: url });

const header = sb('header', {
	nav: [],
	socials: [],
	phone_label: 'call us on:',
	phone_number: '0207 993 5485',
});

// Real reviews from wirebox.co.uk — 4 Vimeo video reviews then text reviews.
const testimonials = sb('testimonials', {
	eyebrow: 'What our clients say',
	heading: 'The kind of partner you keep for years',
	heading_accent: 'keep for years',
	items: [
		sb('testimonial', { name: 'James Randall', role: 'Co-founder, Kids Party Finder', vimeo: '1119462004' }),
		sb('testimonial', { name: 'Stephen Makinde', role: 'Owner, The Oak Practice & Perfect Balance Clinic', vimeo: '1127563818' }),
		sb('testimonial', { name: 'Glen Hempenstall', role: 'Communications Manager, Watford Town Centre BID', vimeo: '996278084' }),
		sb('testimonial', { name: 'Alison Hutchinson CBE', role: 'CEO, Pennies', vimeo: '1125445378' }),
		sb('testimonial', { quote: 'John and his team have been punctual, helpful and supportive showing both excellent knowledge of WordPress as well as a strong creative and design skill set. I would have no reservation in recommending Wirebox for WordPress development.', name: 'Nina Innocenti', role: 'Project Manager, Middlesex University' }),
		sb('testimonial', { quote: 'Wirebox went above and beyond, delivering a brilliant website with an attractive design, web governance conformity and smooth functionality – and it all went from brief to finished product within about two months.', name: 'Sweta Rana', role: 'Web Manager, Middlesex University' }),
		sb('testimonial', { quote: 'The Wirebox team worked from the initial scope and developed a fantastic solution which is interactive, fast, clear and allows full transparency and consistency across the business. We are delighted with the end result.', name: 'Kathryn Boyd', role: 'Director of HR, Search Consultancy' }),
		sb('testimonial', { quote: 'Wirebox were able to analyse reports and offer solutions to improve the site. It took a few weeks, but our score is 95+ which is the best in our industry. Really happy with the work and always will recommend Wirebox.', name: 'Mr Clutch', role: 'Marketing Manager' }),
		sb('testimonial', { quote: 'Great service – great knowledge throughout the company, very quick response and always have the solution to our problems in a professional and timely manner.', name: 'Chevin Fleet', role: 'Marketing Manager' }),
	],
});

const CDN = 'https://a.storyblok.com/f/293147646055661';
const cdnAsset = (filename, alt = '') => ({ fieldtype: 'asset', filename, alt });

function supportHero() {
	return sb('support_hero', {
		eyebrow: '245 sites protected & monitored',
		heading: 'Never lose a sale to a\nbroken website again',
		heading_accent: 'broken website',
		body: 'Wirebox is your dedicated website support partner – monitoring, protecting, and improving your site 24/7 so you can focus on running your business.',
		ctas: [
			sb('cta', { label: 'get a free site review', link: mlink('#contact'), variant: 'primary', icon: 'arrow-right' }),
			sb('cta', { label: 'see plans & pricing', link: mlink('#pricing'), variant: 'outline', icon: 'arrow-right' }),
		],
		card_title: 'Our response commitments',
		bg_image: A('hero-building.png'),
		stats: [
			['1hr', 'critical issue response', 'pink'],
			['4hrs', 'standard issue response', 'green'],
			['24/7', 'uptime monitoring', 'pink'],
			['99.9%', 'target uptime', 'green'],
		].map(([value, label, tone]) => sb('hero_stat', { value, label, tone })),
		form_title: 'Get your free site review',
		form_cta_label: 'review my site',
		form_note: "No obligation · We'll respond within 1 business day",
	});
}

function trustBar() {
	return sb('trust_bar', {
		items: ['1-hour critical response', 'No long-term contracts', 'Award-winning team', '5★ Google rated', 'Laravel certified'].map((t) => sb('trust_item', { text: t })),
	});
}

function riskStats() {
	return sb('risk_stats', {
		eyebrow: 'The risk of doing nothing',
		heading: 'The threats are real – is your site ready?',
		heading_accent: 'real',
		stats: [
			['7.78m', 'Cyber attacks recorded in the UK last year alone – up 77% year on year'],
			['84%', 'of UK businesses reported a phishing attack – the most common entry point'],
			['94%', 'of organisations experienced an email-borne security incident in the last year'],
			['£17.5m', 'Maximum GDPR fine for a data breach – or 4% of global annual turnover'],
		].map(([value, description]) => sb('risk_stat', { value, description })),
		footnote: "Don't leave your site unprotected.",
		cta_label: 'Get a free security review',
		cta_link: '#contact',
	});
}

function valueProps() {
	return sb('value_props', {
		eyebrow: 'Why Wirebox',
		heading: 'More than just a support ticket',
		heading_accent: 'support ticket',
		body: "We're not an hourly-rate helpdesk. We're your proactive digital partner – actively seeking improvements, spotting risks before they become problems, and helping your site grow alongside your business.",
		cta_label: 'get a free site review',
		cta_link: '#contact',
		image: A('support-team.png'),
		toolkit_title: 'Our monitoring toolkit',
		toolkit: ['Pingdom', 'Airbrake', 'SEMrush', 'AWS CloudWatch', 'Sentry', 'Cloudflare'].join('\n'),
		features: [
			['Security & penetration testing', 'We run regular penetration tests and vulnerability scans to find weaknesses before attackers do – then fix them.', 'dark'],
			['Performance optimisation', 'Slow sites lose customers. We actively monitor and improve load times, keeping Google happy and users engaged.', 'fuchsia'],
			['Plugin & platform updates', 'We keep WordPress, Magento, Laravel and PHP on supported, secure versions – tested in staging before going live.', 'dark'],
			['Proactive improvement recommendations', "We're your advocate – regularly suggesting improvements to grow your business online, not just keeping the lights on.", 'fuchsia'],
			['Staging environment for all changes', 'Every update is tested and signed off in a secure staging environment before it ever touches your live site.', 'purple'],
		].map(([title, description, tone]) => sb('vp_feature', { title, description, tone })),
	});
}

function slaTiers() {
	return sb('sla_tiers', {
		eyebrow: 'Response times & SLA',
		heading: "You'll never wonder where we are",
		heading_accent: 'where we are',
		subtitle: "When something goes wrong, speed matters. Here's exactly what to expect from us – in writing, not just promises.",
		tiers: [
			['1 hour', 'critical issues', "Site down, major security breach, checkout broken. We're on it within the hour, any day of the week.", 'pink'],
			['4 hours', 'high priority issues', 'Broken features, performance degradation, failed integrations. Responded to and triaged same day.', 'yellow'],
			['1 day', 'standard requests', "Content updates, minor bugs, configuration changes. You'll have a response with a clear timeline by next working day.", 'green'],
			['Monthly', 'proactive reports', 'Every month you receive a full report: uptime, security status, updates applied, and recommendations for next steps.', 'cyan'],
		].map(([value, label, description, tone]) => sb('sla_tier', { value, label, description, tone })),
	});
}

function pricing() {
	const plans = [
		['Starter', 'Essential', '', 'Plans from', '£299/mo', 'Single site · Cancel anytime', ['24/7 uptime monitoring', 'Monthly plugin & CMS updates', '4-hour critical response SLA', 'Monthly health report', 'SSL certificate management', '2 hours/month development time'], 'get a quote', 'outline-lavender', false],
		['Growth', 'Professional', 'Most popular', 'Plans from', '£699/mo', 'Up to 3 sites · Cancel anytime', ['Everything in Essential', '1-hour critical response SLA', 'Performance & SEO monitoring (SEMrush)', 'Error monitoring (Airbrake)', 'Penetration testing (quarterly)', 'Staging environment for all changes', '5 hours/month development time', 'Dedicated account manager'], 'get a quote', 'solid', true],
		['Scale', 'Enterprise', '', 'Custom pricing', "Let's talk", 'Multi-site · Bespoke SLA · AWS hosting', ['Everything in Professional', 'AWS CloudWatch monitoring', 'Custom SLA & response targets', 'Multi-site & multi-database coverage', 'Monthly strategy calls', 'Priority development queue', 'Dedicated development team access'], 'book a call', 'outline-lavender', false],
	];
	return sb('pricing', {
		eyebrow: 'Transparent pricing',
		heading: 'Plans that grow with your business',
		heading_accent: 'your business',
		subtitle: 'All plans include 24/7 monitoring, monthly reporting, and a dedicated account manager. No hidden fees, no lock-in contracts.',
		plans: plans.map(([tier, name, badge, price_prefix, price, meta, features, cta_label, cta_variant, featured]) =>
			sb('pricing_plan', { tier, name, badge, price_prefix, price, meta, features: features.join('\n'), cta_label, cta_variant, cta_link: '#contact', featured })
		),
		footnote: 'Not sure which plan is right?',
		foot_link_label: 'Get a free site review',
		foot_link: '#contact',
		foot_trail: "and we'll recommend the right fit.",
	});
}

function supportCases() {
	const items = [
		['Mr Clutch', '5+ years', 'Ongoing support and database maintenance across a vast multi-location estate – keeping critical booking and operational systems running flawlessly.', ['Database', 'Performance', 'Multi-site'], 'support-mrclutch.png'],
		['Bulgin', '5+ years', 'Tailored support and monitoring covering their entire global operation – from Asia to the Americas – with custom SLAs for business-critical uptime.', ['Global', '24/7 monitor', 'Custom SLA'], 'support-bulgin.png'],
		['Penguin Cold Caps', 'Ongoing', '24/7 monitoring for a medical device company where site availability directly impacts cancer patients. Zero tolerance for downtime.', ['Healthcare', '24/7', 'Multi-country'], 'support-penguin.png'],
		['Pennies', '3+ years', 'Trusted partner for a fintech charity processing millions in donations. We maintain their Magento platform and custom integrations so every gift gets through.', ['Fintech', 'Magento', 'Charity'], 'support-pennies.png'],
		['Middlesex University', 'Ongoing', 'We maintain their graduate showcase portal – an arts site where students present their work to the world – keeping it secure, current, and performing.', ['Education', 'WordPress', 'Portal'], 'support-middlesex.png'],
		['Sapphire Gymnastics', 'Ongoing', 'We built and continue to manage their bespoke booking and payments database – allocating children to classes and managing live capacity in real time.', ['Bespoke DB', 'Payments', 'Laravel'], 'support-sapphire.png'],
	];
	return sb('support_cases', {
		eyebrow: 'Client relationships, not just projects',
		heading: '245 businesses supported, and counting_',
		heading_accent: 'and counting_',
		subtitle: "These aren't one-off builds. These are long-term partnerships – we're still actively supporting every client below.",
		items: items.map(([title, duration, description, tags, img]) =>
			sb('support_case', { title, duration, description, tags: tags.join('\n'), image: A(img), link: mlink('#') })
		),
	});
}

function faq() {
	const items = [
		['What platforms do you support?', "WordPress, Magento, Laravel, PHP, Shopify and most modern stacks. If it runs on the web, we can almost certainly support it – and we'll tell you honestly if we can't.", true],
		['Do you lock clients into long-term contracts?', "No. All our support plans are rolling monthly. We earn your business every month by delivering value – not by trapping you in a contract. You can upgrade, downgrade, or cancel with 30 days' notice.", false],
		['Do you offer one-off fixes, or only monthly plans?', "Both. Monthly plans give you the best response times and rates, but we're happy to quote for one-off fixes and projects too.", false],
		['How quickly do you respond when my site goes down?', 'Critical issues are picked up within 1 hour on Professional and Enterprise plans (4 hours on Essential), 24/7, 365 days a year.', false],
		['Can I migrate from my current support agency?', "Yes – we do this regularly. We'll audit your current setup, document everything, and take over with zero downtime.", false],
		["What's included in the monthly development hours?", "Anything from content updates and new features to performance work. Unused hours roll over for one month, and we'll always tell you before extra work is billed.", false],
		['Do you handle hosting as well?', "We do. We manage hosting on AWS and other providers, or we'll happily work alongside your existing host.", false],
		['Is there a setup or onboarding fee?', "No setup fee on standard plans. Complex migrations may need a small scoped onboarding – we'll agree it with you up front.", false],
	];
	return sb('faq', {
		eyebrow: 'FAQ',
		heading: 'Questions we get asked every week',
		heading_accent: 'every week',
		items: items.map(([question, answer, open]) => sb('faq_item', { question, answer, open })),
	});
}

function ctaContact() {
	return sb('cta_contact', {
		eyebrow: 'Get started',
		heading: 'Your site deserves better than hoping for the best',
		heading_accent: 'hoping for the best',
		body: "Get a free, no-obligation review of your site's security, performance, and maintenance risks. We'll tell you exactly what we'd do and what it costs.",
		phones: [
			['0207 993 5485', 'Call us: Watford & London'],
			['01908 110 420', 'Call us: Milton Keynes'],
		].map(([number, label]) => sb('cta_phone', { number, label })),
		form_cta_label: 'Get My Free Review',
	});
}

function locations() {
	return sb('locations', {
		places: [
			sb('map_place', { label: 'Milton Keynes', query: 'Elder House West, Elder Gate, Milton Keynes, MK9 1LR', link: '' }),
			sb('map_place', { label: 'Watford', query: '1A Copsewood Road, Watford, WD24 5DY', link: '' }),
		],
	});
}

function footer() {
	const WB = 'https://wirebox.co.uk';
	// Accordion categories are toggles, not links — only their children link out.
	const svc = (label, _parentLink, children) =>
		sb('footer_service', { label, link: '', children: children.map(([l, ln]) => sb('footer_link', { label: l, link: ln })) });
	return sb('footer', {
		offices: [
			sb('footer_office', { name: 'Milton Keynes', address: '3rd Floor, Elder House West, Elder Gate\nMilton Keynes, MK9 1LR', phone: '01908 110 420', email: 'hello@wirebox.co.uk' }),
			sb('footer_office', { name: 'Watford', address: 'Leavesden Lodge,\nUnit 1 Copsewood Lodge,\n1A Copsewood Road, Watford\nHertfordshire, WD24 5DY', phone: '0207 993 5485', email: 'hello@wirebox.co.uk' }),
		],
		services: [
			svc('Strategy', `${WB}/what-we-do/strategy/`, [['Digital Transformation', `${WB}/what-we-do/strategy/`], ['AWS Planning', `${WB}/what-we-do/technology-build/aws-consultancy/`], ['Research & Innovation', `${WB}/workshop-discovery/`]]),
			svc('Digital Consultancy', `${WB}/what-we-do/technology-consulting/`, [['AWS Consultancy', `${WB}/what-we-do/technology-build/aws-consultancy/`], ['Technology Deployments', `${WB}/what-we-do/technology-build/`], ['AWS Healthcheck', `${WB}/what-we-do/technology-consulting/`]]),
			svc('CMS and ERP applications', `${WB}/what-we-do/technology-build/cms-development_/`, [['WordPress', `${WB}/wordpress/`], ['Contentful', `${WB}/what-we-do/technology-build/cms-development_/`], ['Odoo', `${WB}/what-we-do/technology-build/odoo-development/`]]),
			{ ...svc('Application Development', `${WB}/what-we-do/technology-build/`, [['Web Development', `${WB}/work-categories/web-development/`], ['Laravel Development', `${WB}/laravel-development-agency/`], ['Mobile App Development', `${WB}/what-we-do/technology-build/mobile-app-development/`], ['Bespoke Booking System', `${WB}/what-we-do/technology-build/software-development-london/`], ['eCommerce', `${WB}/what-we-do/technology-build/e-commerce-development/`], ['Database Development', `${WB}/what-we-do/technology-build/database-development/`], ['Bespoke Software Development', `${WB}/what-we-do/technology-build/software-development-london/`]]), expanded: true },
			svc('Support and Maintenance', `${WB}/website-support-and-maintenance/`, [['Accessibility Consulting', `${WB}/website-support-and-maintenance/`], ['Website & Systems Maintenance', `${WB}/website-support-and-maintenance/`], ['Optimisation', `${WB}/work-categories/speed/`]]),
		],
		links: [['Our Partners', `${WB}/our-partners/`], ['About Us', `${WB}/about-us/`], ['Contact Us', `${WB}/contact-us/`], ['Services', `${WB}/what-we-do/`], ['Blog', `${WB}/blog/`], ['Case Studies', `${WB}/our-work/`], ['Clutch', 'https://clutch.co']].map(([label, link]) => sb('footer_link', { label, link })),
		// Only include badges whose asset actually uploaded (has a CDN id) — a
		// missing file is skipped rather than rendered as a broken image.
		credentials: [A('biz4biz.png'), A('sme.png'), A('watford-pledge.png'), A('aws-partner.png')].filter((c) => c.id),
		socials: [['facebook', 'https://facebook.com/WireboxConsultancy/'], ['twitter', 'https://x.com/wirebox'], ['vimeo', 'https://vimeo.com/wirebox'], ['linkedin', 'https://www.linkedin.com/company/wirebox-consultancy'], ['github', 'https://github.com/Wirebox'], ['instagram', 'https://www.instagram.com/wireboxuk']].map(([platform, url]) => sb('social_link', { platform, url })),
		privacy_label: 'Cookie / Privacy Policy',
		copyright: '© Wiredbox Ltd.',
	});
}

function buildContent() {
	return sb('page', {
		seo_title: 'Wirebox — Website support & maintenance that keeps you online',
		seo_description:
			"Wirebox is your dedicated website support partner — monitoring, protecting, and improving your site 24/7. 1-hour critical response, no long-term contracts.",
		body: [
			header,
			supportHero(),
			trustBar(),
			riskStats(),
			valueProps(),
			slaTiers(),
			pricing(),
			supportCases(),
			testimonials,
			faq(),
			ctaContact(),
			locations(),
			footer(),
		],
	});
}

async function main() {
	console.log('=== Components ===');
	await syncComponents();
	await uploadAssets();
	const content = buildContent();
	console.log('\n=== Story ===');
	const { story } = await mapi('GET', `/stories/${HOME_STORY_ID}`);
	await mapi('PUT', `/stories/${HOME_STORY_ID}`, {
		story: { name: story.name || 'Home', slug: story.slug || 'home', content },
		publish: 1,
	});
	console.log(`Published "${story.slug}" as the support page (${content.body.length} sections).`);
}

main().catch((err) => {
	console.error('\nFAILED:', err.message);
	process.exit(1);
});
