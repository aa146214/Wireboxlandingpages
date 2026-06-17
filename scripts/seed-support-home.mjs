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
	// sections
	{ name: 'support_hero', schema: { eyebrow: text(0), heading: area(1), heading_accent: text(2), body: area(3), ctas: bloks(4, ['cta']), card_title: text(5), stats: bloks(6, ['hero_stat']), form_title: text(7), form_cta_label: text(8), form_note: text(9) } },
	{ name: 'trust_bar', schema: { items: bloks(0, ['trust_item']) } },
	{ name: 'risk_stats', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), stats: bloks(3, ['risk_stat']), footnote: text(4), cta_label: text(5), cta_link: text(6) } },
	{ name: 'value_props', schema: { eyebrow: text(0), heading: text(1), body: area(2), cta_label: text(3), cta_link: text(4), image: asset(5), toolkit_title: text(6), toolkit: bloks(7, ['vp_chip']), features: bloks(8, ['vp_feature']) } },
	{ name: 'sla_tiers', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), subtitle: area(3), tiers: bloks(4, ['sla_tier']) } },
	{ name: 'pricing', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), subtitle: area(3), plans: bloks(4, ['pricing_plan']), footnote: text(5), foot_link_label: text(6), foot_link: text(7), foot_trail: text(8) } },
	{ name: 'support_cases', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), subtitle: area(3), items: bloks(4, ['support_case']) } },
	{ name: 'faq', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), items: bloks(3, ['faq_item']) } },
	{ name: 'cta_contact', schema: { eyebrow: text(0), heading: text(1), heading_accent: text(2), body: area(3), phones: bloks(4, ['cta_phone']), form_cta_label: text(5) } },
	{ name: 'locations', schema: { maps: { type: 'multiasset', filetypes: ['images'], pos: 0 } } },
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

const testimonials = sb('testimonials', {
	eyebrow: 'What our clients say',
	heading: 'The kind of partner you keep for years',
	heading_accent: 'keep for years',
	items: [
		sb('testimonial', { quote: 'Despite the lack of a formal commitment from us, they always get the job done on time.', name: 'Ben Hallifax', role: 'HR Business Partner, Northgate Industries' }),
		sb('testimonial', { quote: 'They are friendly, competent, and most importantly, finish projects within the time frame agreed.', name: 'Melanie Pizzey', role: 'Operations Director, KPF LTD.' }),
		sb('testimonial', { quote: 'We have been using Wirebox for a few months now to help improve and maintain our website. The team are easy to deal with and have a great system for ensuring tasks are prioritised and completed on time. Would recommend to anyone!', name: 'Alexander Girvan', role: 'Client Services Lead, Orion Partners' }),
		sb('testimonial', { video: { fieldtype: 'asset', filename: 'https://a.storyblok.com/f/293147646055661/36434ef311/testimonial-video.png', alt: '' }, name: 'John Smith', role: 'Marketing Manager, Veritas Group' }),
		sb('testimonial', { quote: "They understand our business and they're able to put the right suggestions forward that help enhance our operations.", name: 'Jack Stubbs', role: 'Project Manager, Horizon Dynamics' }),
	],
});

// value_props: only the image is overridden (other fields use component defaults).
function valueProps() {
	return sb('value_props', { image: A('support-team.png') });
}

// support_cases: items is all-or-nothing, so seed the full set (matches the
// component defaults) with CDN images so the CMS drives the imagery.
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
		items: items.map(([title, duration, description, tags, img]) =>
			sb('support_case', { title, duration, description, tags: tags.join('\n'), image: A(img), link: mlink('#') })
		),
	});
}

function buildContent() {
	return sb('page', {
		seo_title: 'Wirebox — Website support & maintenance that keeps you online',
		seo_description:
			"Wirebox is your dedicated website support partner — monitoring, protecting, and improving your site 24/7. 1-hour critical response, no long-term contracts.",
		body: [
			header,
			sb('support_hero'),
			sb('trust_bar'),
			sb('risk_stats'),
			valueProps(),
			sb('sla_tiers'),
			sb('pricing'),
			supportCases(),
			testimonials,
			sb('faq'),
			sb('cta_contact'),
			sb('locations'),
			sb('footer'),
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
