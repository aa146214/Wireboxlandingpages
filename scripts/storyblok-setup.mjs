/**
 * Storyblok setup & seed for the Wirebox home page.
 *
 * One-shot, idempotent script that wires the local build to the CMS:
 *   1. Creates/updates every block component schema (mirrors src/storyblok/*.astro).
 *   2. Uploads the editorial assets from /public to the Asset Manager (skips ones
 *      already present, matched by filename) and collects their CDN URLs.
 *   3. Builds the Home story body[] (same content as src/data/home-content.ts but
 *      with CDN asset references + proper multilink objects) and publishes it.
 *
 * Theme assets (logo, social SVGs) intentionally stay in /public — they are
 * referenced by the components directly, not through the CMS.
 *
 * Usage (token is NOT stored in the repo):
 *   SB_MANAGEMENT_TOKEN=sb_pat_xxx node scripts/storyblok-setup.mjs
 *   # optional: pass `components`, `assets`, or `story` to run a single phase.
 */

import { readFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const TOKEN = process.env.SB_MANAGEMENT_TOKEN;
const SPACE = process.env.SB_SPACE_ID || '293147646055661';
const HOME_STORY_ID = process.env.SB_HOME_STORY_ID || '186762709919814';
const MAPI = `https://mapi.storyblok.com/v1/spaces/${SPACE}`;
// Source images for a first-time seed into an empty space live here (they are
// NOT referenced by the site — the live site serves them from the CMS). Once
// uploaded, re-seeds reuse the CMS assets, so this folder is only needed to
// populate a brand-new space.
const SEED_ASSETS = fileURLToPath(new URL('../public/seed-assets', import.meta.url));

if (!TOKEN) {
	console.error('Missing SB_MANAGEMENT_TOKEN env var.');
	process.exit(1);
}

const phase = process.argv[2]; // undefined => all
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mapi(method, path, body) {
	const url = MAPI + path;
	for (let attempt = 0; attempt < 6; attempt++) {
		const res = await fetch(url, {
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
 * 1. COMPONENT SCHEMAS
 * ------------------------------------------------------------------ */

const text = (pos, extra = {}) => ({ type: 'text', pos, ...extra });
const area = (pos, extra = {}) => ({ type: 'textarea', pos, ...extra });
const bool = (pos) => ({ type: 'boolean', pos });
const asset = (pos) => ({ type: 'asset', filetypes: ['images'], pos });
const multiasset = (pos) => ({ type: 'multiasset', filetypes: ['images'], pos });
const link = (pos) => ({ type: 'multilink', pos });
const bloks = (pos, whitelist) => ({
	type: 'bloks',
	restrict_components: true,
	component_whitelist: whitelist,
	pos,
});
const option = (pos, values, def) => ({
	type: 'option',
	use_uuid: false,
	options: values.map((v) => (typeof v === 'string' ? { name: v, value: v } : v)),
	...(def !== undefined ? { default_value: def } : {}),
	pos,
});

// Leaf components first so parent whitelists resolve cleanly.
const COMPONENTS = [
	{ name: 'nav_item', schema: { label: text(0), link: link(1), highlight: bool(2) } },
	{
		name: 'social_link',
		schema: {
			platform: option(0, ['facebook', 'twitter', 'vimeo', 'linkedin', 'github', 'instagram', 'tiktok', 'youtube']),
			url: text(1),
		},
	},
	{
		name: 'cta',
		schema: {
			label: text(0),
			link: link(1),
			variant: option(2, [
				{ name: 'Primary (yellow)', value: 'primary' },
				{ name: 'Outline', value: 'outline' },
				{ name: 'Outline dark', value: 'outline-dark' },
				{ name: 'Solid', value: 'solid' },
			], 'primary'),
			icon: option(3, [
				{ name: 'None', value: '' },
				{ name: 'Arrow right', value: 'arrow-right' },
			], ''),
		},
	},
	{
		name: 'bullet',
		schema: {
			text: text(0),
			color: option(1, [
				{ name: 'Pink', value: 'var(--color-pink-vivid)' },
				{ name: 'Blue', value: 'var(--color-primary-blue)' },
				{ name: 'Green', value: 'var(--color-green-vivid)' },
			], 'var(--color-primary-blue)'),
		},
	},
	{ name: 'service_item', schema: { name: text(0), description: area(1), link: link(2) } },
	{ name: 'service_category', schema: { title: text(0), items: bloks(1, ['service_item']) } },
	{ name: 'testimonial', schema: { quote: area(0), name: text(1), role: text(2), video: asset(3) } },
	{
		name: 'case_study',
		schema: {
			title: text(0),
			description: area(1),
			tags: area(2, { description: 'One tag per line' }),
			image: asset(3),
			link: link(4),
		},
	},
	{ name: 'step', schema: { label: text(0), text: area(1) } },
	{
		name: 'blog_post',
		schema: {
			title: text(0),
			date: text(1),
			read_time: text(2),
			image: asset(3),
			video: bool(4),
			link: link(5),
		},
	},
	{ name: 'footer_link', schema: { label: text(0), link: text(1) } },
	{ name: 'footer_service', schema: { label: text(0), link: text(1), expanded: bool(2), children: bloks(3, ['footer_link']) } },
	{ name: 'footer_office', schema: { name: text(0), address: area(1), phone: text(2), email: text(3) } },

	// Section components
	{
		name: 'header',
		schema: {
			logo: asset(0),
			nav: bloks(1, ['nav_item']),
			phone_label: text(2),
			phone_number: text(3),
			socials: bloks(4, ['social_link']),
		},
	},
	{ name: 'hero', schema: { eyebrow: text(0), heading: area(1), ctas: bloks(2, ['cta']), image: asset(3) } },
	{ name: 'podcast_banner', schema: { eyebrow: text(0), title: text(1), thumbnail: asset(2), link: link(3) } },
	{ name: 'intro', schema: { heading: text(0), body: area(1), bullets: bloks(2, ['bullet']), image: asset(3) } },
	{
		name: 'podcast',
		schema: {
			eyebrow: text(0),
			heading: text(1),
			description: area(2),
			tags: area(3, { description: 'One tag per line' }),
			poster: asset(4),
			video_link: link(5),
		},
	},
	{ name: 'services', schema: { heading: text(0), intro: area(1), categories: bloks(2, ['service_category']) } },
	{ name: 'testimonials', schema: { heading: text(0), items: bloks(1, ['testimonial']) } },
	{ name: 'case_studies', schema: { heading: text(0), items: bloks(1, ['case_study']) } },
	{
		name: 'community',
		schema: { heading: area(0), body: area(1), cta_label: text(2), cta_link: link(3), images: multiasset(4) },
	},
	{ name: 'brands', schema: { heading: text(0), logos: multiasset(1) } },
	{
		name: 'winning_formula',
		schema: {
			heading: text(0),
			intro: area(1),
			steps: bloks(2, ['step']),
			form_heading: text(3),
			cta_label: text(4),
			cta_link: link(5),
		},
	},
	{ name: 'blog', schema: { heading: text(0), posts: bloks(1, ['blog_post']), cta_label: text(2), cta_link: link(3) } },
	{ name: 'awards', schema: { heading: text(0), intro: area(1), badges: multiasset(2), maps: multiasset(3) } },
	{
		name: 'footer',
		schema: {
			offices: bloks(0, ['footer_office']),
			services: bloks(1, ['footer_service']),
			links: bloks(2, ['footer_link']),
			credentials: multiasset(3),
			socials: bloks(4, ['social_link']),
			privacy_label: text(5),
			copyright: text(6),
		},
	},
	{
		name: 'page',
		is_root: true,
		is_nestable: false,
		schema: { body: bloks(0, []), seo_title: text(1), seo_description: area(2) },
	},
];

async function syncComponents() {
	console.log('\n=== Components ===');
	const { components: existing } = await mapi('GET', '/components/');
	const byName = new Map(existing.map((c) => [c.name, c]));

	for (const def of COMPONENTS) {
		const payload = {
			name: def.name,
			display_name: def.name.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
			is_root: def.is_root ?? false,
			is_nestable: def.is_nestable ?? true,
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

/* ------------------------------------------------------------------ *
 * 2. ASSETS
 * ------------------------------------------------------------------ */

// public-relative path -> alt text. Editorial assets only (theme stays in /public).
const ASSET_DEFS = {
	'hero-pacman.png': 'The Wirebox team at work in our studio',
	'intro-office.png': 'Wirebox developers collaborating at their desks',
	'podcast-thumb.png': '',
	'podcast-video.png': '',
	'testimonial-video.png': '',
	'case-pennies.png': 'Pennies case study',
	'case-prindex.png': 'Prindex case study',
	'case-motability.png': 'Motability Live Scheme case study',
	'case-kpf.png': 'Kids Party Finder case study',
	'community-1.png': 'Wirebox team in a meeting room',
	'community-2.png': 'Developers working at their desks',
	'community-3.png': 'A team member presenting at a whiteboard',
	'clients/bulgin.png': 'Bulgin',
	'clients/mrclutch.png': 'Mr Clutch Autocentres',
	'clients/sas.png': 'SAS',
	'clients/pennies.png': 'Pennies — the digital charity box',
	'clients/kidney-care.png': 'Kidney Care UK',
	'clients/middlesex.png': 'Middlesex University London',
	'clients/commonwealth.png': 'The Commonwealth',
	'blog-1.png': '',
	'blog-2.png': '',
	'awards/clutch-reviews.svg': 'Reviewed on Clutch',
	'awards/google.svg': 'Google Rating 4.9 based on 61 reviews',
	'awards/biz4biz.png': 'biz4Biz Awards 2023 Winner',
	'awards/sme.png': 'SME Hertfordshire Business Awards 2024',
	'awards/gbc.svg': 'Good Business Charter Accredited',
	'awards/disability.svg': 'Disability Confident Employer',
	'awards/meta.svg': 'Meta Business Partner',
	'awards/clutch-cambridge.svg': 'Clutch Top Laravel Developers, Cambridge 2025',
	'awards/clutch-web.svg': 'Clutch Top Web Developers',
	'awards/certification.png': 'Certified Laravel Company',
	'awards/watford.png': 'Watford Business Pledge Member',
	'awards/wpengine.svg': 'WP Engine Agency Partner',
	'awards/map-1.png': 'Map of the Milton Keynes studio location',
	'awards/map-2.png': 'Map of the Watford office location',
};

const MIME = { png: 'image/png', svg: 'image/svg+xml', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
const mimeOf = (f) => MIME[f.split('.').pop().toLowerCase()] || 'application/octet-stream';

/** public-relative path -> { id, filename(cdn url) } */
const assets = {};

async function uploadAssets() {
	console.log('\n=== Assets ===');
	// Map existing assets by their basename so re-runs reuse instead of duplicating.
	const existingByBase = new Map();
	let page = 1;
	for (;;) {
		const res = await mapi('GET', `/assets/?per_page=100&page=${page}`);
		const list = res.assets || [];
		for (const a of list) existingByBase.set(basename(a.filename.split('?')[0]), a);
		if (list.length < 100) break;
		page++;
	}

	for (const [rel, alt] of Object.entries(ASSET_DEFS)) {
		const name = basename(rel);
		// Reuse first: editorial images live in the CMS, not /public. A local
		// file is only needed to upload an asset that isn't in the space yet.
		const reuse = existingByBase.get(name);
		if (reuse) {
			assets[rel] = { id: reuse.id, filename: reuse.filename, alt };
			console.log(`  reused   ${rel}`);
			continue;
		}
		const file = join(SEED_ASSETS, rel);
		if (!existsSync(file)) {
			console.warn(`  MISSING  ${rel} (not in the space and not in seed-assets — skipped)`);
			continue;
		}
		const buf = readFileSync(file);
		const sign = await mapi('POST', '/assets/', { filename: name });
		const form = new FormData();
		for (const [k, v] of Object.entries(sign.fields)) form.append(k, String(v));
		form.append('file', new Blob([buf], { type: mimeOf(name) }), name);
		const up = await fetch(sign.post_url, { method: 'POST', body: form });
		if (!up.ok && up.status !== 204) throw new Error(`S3 ${rel} -> ${up.status} ${await up.text()}`);
		const got = await mapi('GET', `/assets/${sign.id}`);
		const filename = got.filename || got.asset?.filename || sign.pretty_url;
		assets[rel] = { id: sign.id, filename, alt };
		existingByBase.set(name, { id: sign.id, filename });
		console.log(`  uploaded ${rel}`);
		await sleep(150);
	}
}

/* ------------------------------------------------------------------ *
 * 3. STORY CONTENT
 * ------------------------------------------------------------------ */

const uid = () => randomUUID();
const mlink = (url) => ({ id: '', url, linktype: 'url', fieldtype: 'multilink', cached_url: url });
const sb = (component, fields) => ({ _uid: uid(), component, ...fields });

function A(rel, altOverride) {
	const a = assets[rel];
	if (!a) {
		console.warn(`  asset not found for content: ${rel} (falling back to /public path)`);
		return { id: null, filename: '/' + rel, alt: altOverride ?? '', fieldtype: 'asset', is_external_url: false };
	}
	return {
		id: a.id,
		filename: a.filename,
		alt: altOverride ?? a.alt ?? '',
		name: '',
		title: '',
		focus: '',
		copyright: '',
		fieldtype: 'asset',
		is_external_url: false,
	};
}
const multi = (rels) => rels.map(([rel, alt]) => ({ _uid: uid(), ...A(rel, alt) }));

function buildContent() {
	const header = sb('header', {
		nav: [
			sb('nav_item', { label: 'what we do', link: mlink('/what-we-do') }),
			sb('nav_item', { label: 'our process', link: mlink('/our-process') }),
			sb('nav_item', { label: 'our work', link: mlink('/our-work') }),
			sb('nav_item', { label: 'blog', link: mlink('/blog') }),
			sb('nav_item', { label: 'about us', link: mlink('/about-us') }),
			sb('nav_item', { label: 'contact', link: mlink('/contact'), highlight: true }),
		],
		phone_label: 'Call us on:',
		phone_number: '0207 993 5485',
		socials: [
			['facebook', 'https://facebook.com/WireboxConsultancy/'],
			['twitter', 'https://x.com/wirebox'],
			['vimeo', 'https://vimeo.com/wirebox'],
			['linkedin', 'https://www.linkedin.com/company/wirebox-consultancy'],
			['github', 'https://github.com/Wirebox'],
			['instagram', 'https://www.instagram.com/wireboxuk'],
		].map(([platform, url]) => sb('social_link', { platform, url })),
	});

	const hero = sb('hero', {
		heading: 'Bespoke software\ndevelopment that enhances\nyour brand',
		eyebrow: '',
		ctas: [
			sb('cta', { label: 'what we do', link: mlink('/what-we-do'), variant: 'primary', icon: 'arrow-right' }),
			sb('cta', { label: 'Contact us', link: mlink('/contact'), variant: 'outline', icon: '' }),
		],
		image: A('hero-pacman.png'),
	});

	const podcastBanner = sb('podcast_banner', {
		eyebrow: 'New podcast episode available now →',
		title: 'Can one platform really run your entire business?',
		thumbnail: A('podcast-thumb.png'),
		link: mlink('/podcast'),
	});

	const intro = sb('intro', {
		heading: 'Hire a web development agency that really gets your business_',
		body: "We're in your corner to keep things moving, help you understand how technology can enhance your operations and delight your customers with new features.",
		bullets: [
			['Struggling with outdated systems?', 'var(--color-pink-vivid)'],
			['Lacking tech support in-house?', 'var(--color-primary-blue)'],
			['Not sure what you need?', 'var(--color-green-vivid)'],
			['Need to keep costs down?', 'var(--color-primary-blue)'],
			['Want bespoke software development?', 'var(--color-pink-vivid)'],
		].map(([t, color]) => sb('bullet', { text: t, color })),
		image: A('intro-office.png'),
	});

	const podcast = sb('podcast', {
		eyebrow: 'Our podcast · latest episode',
		heading: 'Can one platform really run your entire business?',
		description:
			'In this episode, Alex Carter (Lead Product Designer) sits down with Maria Honeycombe (Senior Backend Engineer) and Daniel Schmidt (Frontend Tech Lead) to talk about what it really takes to build scalable, maintainable software. From architecture decisions to day-to-day teamwork, they share practical insights from real projects.',
		tags: 'mobile development\napi\nAWS',
		poster: A('podcast-video.png'),
		video_link: mlink('https://youtube.com'),
	});

	const servicesData = [
		['Strategy', [
			['Digital Transformation', 'Guiding organisations through technology change to boost efficiency and growth.'],
			['AWS Planning', 'Designing secure, scalable cloud strategies that fit your business goals.'],
			['Research & Innovation', 'Exploring new ideas and technologies to keep you ahead of the curve.'],
			['Discovery workshop', 'Defining challenges and opportunities together to shape the right solutions.'],
			['Artificial Intelligence', 'Applying AI tools to automate processes and unlock smarter decision-making.'],
		]],
		['Digital Consultancy', [
			['AWS Consultancy', 'Helping you harness the full potential of Amazon Web Services.'],
			['Manage technology deployments', 'Ensuring smooth rollouts of new systems with minimal disruption.'],
			['AWS Healthcheck', 'Assessing your cloud setup for performance, security, and cost efficiency.'],
		]],
		['CMS and ERP applications', [
			['WordPress', "Building flexible websites on the world's most popular CMS."],
			['Contentful', 'Powering omnichannel experiences with API-driven content platforms.'],
			['WagTail', 'Creating user-friendly websites powered by a Python-based CMS.'],
			['HeadLess CMS', 'Delivering content-first, headless CMS solutions for modern digital needs.'],
			['SiteCore', 'Enterprise-level CMS solutions for complex, high-traffic websites.'],
			['Odoo', 'Streamlining business processes with integrated ERP applications.'],
		]],
		['Application Development', [
			['Web Development', 'Crafting responsive, accessible, and performance-driven websites.'],
			['eCommerce', 'Building scalable online stores that convert and grow revenue.'],
			['Laravel Development', 'Developing robust, secure applications with the Laravel framework.'],
			['Database Development', 'Designing and optimising databases for speed, scale, and reliability.'],
			['Mobile App Development', 'Creating intuitive apps for iOS and Android users.'],
			['Bespoke Software Development', 'Tailoring custom applications to meet your unique business needs.'],
			['Bespoke Booking System', 'Tailoring custom applications to meet your unique business needs.'],
		]],
		['Support and Maintenance', [
			['Accessibility consulting', 'Ensuring your digital products are usable by everyone, including people with disabilities.'],
			['Website & systems maintenance', 'Keeping your platforms secure, updated, and running smoothly.'],
			['AWS Audits', 'Reviewing your cloud environment for compliance, optimisation, and risk management.'],
			['Optimisation', 'Improving performance, speed, and user experience across your systems.'],
		]],
	];
	const services = sb('services', {
		heading: 'Powering your success',
		intro:
			'We provide tailored solutions that help organisations operate smarter, grow faster, and connect more effectively with their audiences. From strategy and design to implementation and ongoing support, we deliver measurable results across every project.',
		categories: servicesData.map(([title, items]) =>
			sb('service_category', {
				title,
				items: items.map(([name, description]) => sb('service_item', { name, description })),
			})
		),
	});

	const testimonials = sb('testimonials', {
		heading: 'What our clients say_',
		items: [
			sb('testimonial', { quote: 'Wirebox Ltd is very patient with us; they do their best to explain a ticket so we can understand what’s possible.', name: 'Shane Nye', role: 'IT Director, Solstice Systems' }),
			sb('testimonial', { quote: 'Despite the lack of a formal commitment from us, they always get the job done on time.', name: 'Ben Hallifax', role: 'HR Business Partner, Northgate Industries' }),
			sb('testimonial', { quote: 'They are friendly, competent, and most importantly, finish projects with the time frame agreed.', name: 'Melanie Pizzey', role: 'Operations Director, KPF LTD.' }),
			sb('testimonial', { quote: 'We have been using Wirebox now for a few months to help improve and maintain our website. The team are easy to deal with and have a great system for ensuring tasks are prioritised/completed on time. Would recommend to anyone!', name: 'Alexander Girvan', role: 'Client Services Lead, Orion Partners' }),
			sb('testimonial', { video: A('testimonial-video.png'), name: 'John Smith', role: 'Marketing Manager, Veritas Group' }),
			sb('testimonial', { quote: 'They understand our business well, so they’re able to put forward suggestions that help enhance our operations.', name: 'Jack Stubbs', role: 'Project Manager, Horizon Dynamics' }),
			sb('testimonial', { quote: 'Wirebox achieved more for our clients, faster, and at better rates than any other agency we have worked with.', name: 'Jacqueline Tarry', role: 'Finance Controller, Avelon Solutions' }),
		],
	});

	const caseStudies = sb('case_studies', {
		heading: 'Case studies_',
		items: [
			sb('case_study', { title: 'Pennies', description: "Developing and supporting the Fintech's charity which has raised over 22 million for charities.", tags: ['API', 'App development', 'Charity', 'Django', 'Mobile development', 'mySQL', 'PostgreSQL', 'Python', 'Web development'].join('\n'), image: A('case-pennies.png') }),
			sb('case_study', { title: 'Prindex', description: 'Enhancing Global Land Data with Wirebox', tags: ['API', 'CMS', 'Python', 'Wagtail', 'Website'].join('\n'), image: A('case-prindex.png') }),
			sb('case_study', { title: 'Motability Live Scheme', description: 'Building the digital experience for MSL events', tags: ['App development', 'Laravel Development', 'Database Development', 'WordPress development'].join('\n'), image: A('case-motability.png') }),
			sb('case_study', { title: 'Kids Party Finder SEO Optimised', description: 'Development of an online Directory, SEO optimised, built in Laravel', tags: ['Digital', 'Google API'].join('\n'), image: A('case-kpf.png') }),
		],
	});

	const community = sb('community', {
		heading: 'We’re a hard-working community of doers and dreamers, united by a love of tech and a desire to do things differently_',
		body: "Since 2005, our web development agency has been creating engaging online experiences for incredible brands. We combine the build skills of a web development agency and the instincts of a digital marketing firm into a full-service tech design concept you can rely on. Lean on our expertise to achieve your goals. Whether you're looking for new capabilities, outsourcing management of your existing tech stack or innovating something completely new; Wirebox is here to help.",
		cta_label: 'view all work',
		cta_link: mlink('/our-work'),
		images: multi([
			['community-1.png', 'Wirebox team in a meeting room'],
			['community-2.png', 'Developers working at their desks'],
			['community-3.png', 'A team member presenting at a whiteboard'],
		]),
	});

	const brands = sb('brands', {
		heading: 'Great brands and great clients_',
		logos: multi([
			['clients/bulgin.png', 'Bulgin'],
			['clients/mrclutch.png', 'Mr Clutch Autocentres'],
			['clients/sas.png', 'SAS'],
			['clients/pennies.png', 'Pennies — the digital charity box'],
			['clients/kidney-care.png', 'Kidney Care UK'],
			['clients/middlesex.png', 'Middlesex University London'],
			['clients/commonwealth.png', 'The Commonwealth'],
		]),
	});

	const winningFormula = sb('winning_formula', {
		heading: 'Our winning formula_',
		intro: 'Over the years, we’ve distilled the web development agency process down to a few key steps guaranteed to create successful digital interventions.',
		steps: [
			['Discover', 'We listen and learn to properly understand your business.'],
			['Analyse', 'We evaluate everything you’ve shared to propose an effective solution.'],
			['Define', 'We break that solution into actionable steps so everyone can get on board.'],
			['Develop', 'We start creating; keeping your goals in mind at all times.'],
			['Test', 'We kick the tyres to make sure everything works perfectly.'],
			['Deliver', 'We roll out your new digital environment and train your teams.'],
			['Maintain', 'We keep everything working perfectly and optimise for your success.'],
		].map(([label, t]) => sb('step', { label, text: t })),
		form_heading: 'Do you have a project in mind?',
		cta_label: 'view all services',
		cta_link: mlink('/services'),
	});

	const blog = sb('blog', {
		heading: 'What’s going on in our world_',
		posts: [
			sb('blog_post', { title: 'Emerging tech trends to help you to run your business more effectively_', date: '19 Nov 2021', read_time: '10 min read', image: A('blog-1.png'), link: mlink('/blog/emerging-tech-trends') }),
			sb('blog_post', { title: 'The difference between native & hybrid apps – from a development perspective_', date: '10 Sep 2021', read_time: '10 min read', image: A('blog-2.png'), link: mlink('/blog/native-vs-hybrid') }),
			sb('blog_post', { title: 'Preparing your business for an ERP implementation', date: '9 June 2021', read_time: '10 min read', video: true, link: mlink('/blog/erp-implementation') }),
		],
		cta_label: 'view all posts',
		cta_link: mlink('/blog'),
	});

	const awards = sb('awards', {
		heading: 'Awards and ratings_',
		intro: 'We have worked over 1000 happy clients and ratings on Google over 4.5',
		badges: multi([
			['awards/clutch-reviews.svg', 'Reviewed on Clutch'],
			['awards/google.svg', 'Google Rating 4.9 based on 61 reviews'],
			['awards/biz4biz.png', 'biz4Biz Awards 2023 Winner'],
			['awards/sme.png', 'SME Hertfordshire Business Awards 2024'],
			['awards/gbc.svg', 'Good Business Charter Accredited'],
			['awards/disability.svg', 'Disability Confident Employer'],
			['awards/meta.svg', 'Meta Business Partner'],
			['awards/clutch-cambridge.svg', 'Clutch Top Laravel Developers, Cambridge 2025'],
			['awards/clutch-web.svg', 'Clutch Top Web Developers'],
			['awards/certification.png', 'Certified Laravel Company'],
			['awards/watford.png', 'Watford Business Pledge Member'],
			['awards/wpengine.svg', 'WP Engine Agency Partner'],
		]),
		maps: multi([
			['awards/map-1.png', ''],
			['awards/map-2.png', ''],
		]),
	});

	const footer = sb('footer', {
		offices: [
			sb('footer_office', { name: 'Milton Keynes', address: '3rd Floor, Elder House West, Elder Gate\nMilton Keynes, MK9 1LR', phone: '01908 110 420', email: 'hello@wirebox.co.uk' }),
			sb('footer_office', { name: 'Watford', address: 'Leavesden Lodge,\nUnit 1 Copsewood Lodge,\n1A Copsewood Road, Watford\nHertfordshire, WD24 5DY', phone: '0207 993 5485', email: 'hello@wirebox.co.uk' }),
		],
		services: [
			sb('footer_service', {
				label: 'Strategy',
				link: '/services/strategy',
				children: [
					['Digital Transformation', '/services/digital-transformation'],
					['AWS Planning', '/services/aws-planning'],
					['Research & Innovation', '/services/research-innovation'],
				].map(([label, l]) => sb('footer_link', { label, link: l })),
			}),
			sb('footer_service', {
				label: 'Digital Consultancy',
				link: '/services/digital-consultancy',
				children: [
					['AWS Consultancy', '/services/aws-consultancy'],
					['Technology Deployments', '/services/technology-deployments'],
					['AWS Healthcheck', '/services/aws-healthcheck'],
				].map(([label, l]) => sb('footer_link', { label, link: l })),
			}),
			sb('footer_service', {
				label: 'CMS and ERP applications',
				link: '/services/cms-erp',
				children: [
					['WordPress', '/services/wordpress'],
					['Contentful', '/services/contentful'],
					['Odoo', '/services/odoo'],
				].map(([label, l]) => sb('footer_link', { label, link: l })),
			}),
			sb('footer_service', {
				label: 'Application Development',
				link: '/services/application-development',
				expanded: true,
				children: [
					['Web Development', '/services/web-development'],
					['Laravel Development', '/services/laravel-development'],
					['Mobile App Development', '/services/mobile-app-development'],
					['Bespoke Booking System', '/services/bespoke-booking-system'],
					['eCommerce', '/services/ecommerce'],
					['Database Development', '/services/database-development'],
					['Bespoke Software Development', '/services/bespoke-software-development'],
				].map(([label, l]) => sb('footer_link', { label, link: l })),
			}),
			sb('footer_service', {
				label: 'Support and Maintenance',
				link: '/services/support-and-maintenance',
				children: [
					['Accessibility Consulting', '/services/accessibility'],
					['Website & Systems Maintenance', '/services/maintenance'],
					['Optimisation', '/services/optimisation'],
				].map(([label, l]) => sb('footer_link', { label, link: l })),
			}),
		],
		links: [
			['Our Partners', '/our-partners'],
			['About Us', '/about-us'],
			['Contact Us', '/contact'],
			['Services', '/services'],
			['Blog', '/blog'],
			['Case Studies', '/case-studies'],
			['Clutch', 'https://clutch.co'],
		].map(([label, l]) => sb('footer_link', { label, link: l })),
		credentials: multi([
			['awards/biz4biz.png', 'biz4Biz Awards 2023 Winner'],
			['awards/sme.png', 'SME Hertfordshire Business Awards'],
		]),
		socials: [
			['facebook', 'https://facebook.com/WireboxConsultancy/'],
			['twitter', 'https://x.com/wirebox'],
			['vimeo', 'https://vimeo.com/wirebox'],
			['linkedin', 'https://www.linkedin.com/company/wirebox-consultancy'],
			['github', 'https://github.com/Wirebox'],
			['instagram', 'https://www.instagram.com/wireboxuk'],
		].map(([platform, url]) => sb('social_link', { platform, url })),
		privacy_label: 'Cookie / Privacy Policy',
		copyright: '© Wiredbox Ltd.',
	});

	return sb('page', {
		seo_title: 'Wirebox — Bespoke software development that enhances your brand',
		seo_description:
			'Since 2005, Wirebox has built engaging digital experiences for incredible brands — combining web development expertise with the instincts of a digital marketing firm.',
		body: [header, hero, podcastBanner, intro, podcast, services, testimonials, caseStudies, community, brands, winningFormula, blog, awards, footer],
	});
}

async function seedStory() {
	console.log('\n=== Story ===');
	const content = buildContent();
	const { story } = await mapi('GET', `/stories/${HOME_STORY_ID}`);
	await mapi('PUT', `/stories/${HOME_STORY_ID}`, {
		story: { name: story.name || 'Home', slug: story.slug || 'home', content },
		publish: 1,
	});
	console.log(`  published "${story.slug}" with ${content.body.length} sections`);
}

/* ------------------------------------------------------------------ */

async function main() {
	if (!phase || phase === 'components') await syncComponents();
	if (!phase || phase === 'assets' || phase === 'story') await uploadAssets();
	if (!phase || phase === 'story') await seedStory();
	console.log('\nDone.');
}

main().catch((err) => {
	console.error('\nFAILED:', err.message);
	process.exit(1);
});
