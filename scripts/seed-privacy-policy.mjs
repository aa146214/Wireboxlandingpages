/**
 * Seed the /privacy-policy page into Storyblok.
 *
 * Creates (or updates the schemas of) the root content type `legal_page` and the
 * main-site chrome bloks (`main_site_header`, `main_site_footer` and their item
 * bloks), uploads the hero photo, logo and award logos to the Asset Manager
 * (reusing files with the same name), and creates the `privacy-policy` story:
 * header + footer bloks built from src/data/main-site-nav.ts, and the policy
 * from src/data/legal/privacy-policy.html converted to rich text.
 *
 * Safe on a live space: the story is only CREATED. If `privacy-policy` already
 * exists, the only change is adding a header/footer blok where the story has
 * none (backed up first); everything else is left to editors. --overwrite
 * replaces the whole story (also backed up to .storyblok-backups/ first).
 *
 * Usage (token from the environment, never committed):
 *   SB_MANAGEMENT_TOKEN=sb_pat_xxx SB_SPACE_ID=293147646055661 node scripts/seed-privacy-policy.mjs
 *   ... --dry         print what would be written, write nothing
 *   ... --overwrite   replace the whole story
 */
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlToStoryblokRichtext } from '@storyblok/richtext/html-parser';
import {
	MAIN_NAV,
	MAIN_CONTACT_URL,
	MAIN_SITE,
	MAIN_SOCIAL_LINKS,
	MAIN_OFFICES,
	MAIN_CREDENTIALS,
	MAIN_FOOTER_LINKS,
	MAIN_FOOTER_SERVICES,
	MAIN_FOOTER_LEGAL,
	MAIN_FOOTER_TEXT,
} from '../src/data/main-site-nav.ts';

const TOKEN = process.env.SB_MANAGEMENT_TOKEN;
const SPACE = process.env.SB_SPACE_ID || '293147646055661';
const DRY = process.argv.includes('--dry');
const OVERWRITE = process.argv.includes('--overwrite');
const MAPI = `https://mapi.storyblok.com/v1/spaces/${SPACE}`;
const SLUG = 'privacy-policy';
const HTML_FILE = fileURLToPath(new URL('../src/data/legal/privacy-policy.html', import.meta.url));
const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));
const BACKUP_DIR = fileURLToPath(new URL('../.storyblok-backups', import.meta.url));

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
 * Component schemas
 * ------------------------------------------------------------------ */

const text = (pos, extra = {}) => ({ type: 'text', pos, ...extra });
const area = (pos, extra = {}) => ({ type: 'textarea', pos, ...extra });
const image = (pos) => ({ type: 'asset', filetypes: ['images'], pos });
const bloks = (pos, whitelist, extra = {}) => ({ type: 'bloks', restrict_components: true, component_whitelist: whitelist, pos, ...extra });
const opt = (pos, values, def) => ({ type: 'option', use_uuid: false, options: values.map((v) => ({ name: v, value: v })), default_value: def, pos });

/** Nestable bloks for the main wirebox.co.uk header and footer (src/components/main-site). */
const CHROME_COMPONENTS = [
	{ name: 'main_nav_link', display_name: 'Main Site Link', schema: { label: text(0), link: text(1, { description: 'Full URL, or a path on this site' }) } },
	{ name: 'main_nav_group', display_name: 'Main Site Menu Group', schema: { label: text(0), links: bloks(1, ['main_nav_link']) } },
	{
		name: 'main_nav_item',
		display_name: 'Main Site Menu Item',
		schema: {
			label: text(0),
			link: text(1, { description: 'Used when the item has no drawer items' }),
			items: bloks(2, ['main_nav_link', 'main_nav_group'], { description: 'Add items to make this open a slide-out drawer instead of linking' }),
		},
	},
	{
		name: 'main_social',
		display_name: 'Main Site Social',
		schema: { platform: opt(0, ['facebook', 'x', 'vimeo', 'linkedin', 'github', 'instagram'], 'facebook'), url: text(1) },
	},
	{
		name: 'main_footer_office',
		display_name: 'Main Site Office',
		schema: { name: text(0), address: area(1, { description: 'One line per address line' }), phone: text(2), email: text(3), tone: opt(4, ['green', 'yellow'], 'green') },
	},
	{ name: 'main_footer_credential', display_name: 'Main Site Credential', schema: { image: image(0), link: text(1, { description: 'Optional' }) } },
	{
		name: 'main_site_header',
		display_name: 'Main Site Header',
		schema: {
			logo: image(0),
			logo_link: text(1),
			nav: bloks(2, ['main_nav_item']),
			contact_label: text(3),
			contact_link: text(4),
			socials: bloks(5, ['main_social']),
		},
	},
	{
		name: 'main_site_footer',
		display_name: 'Main Site Footer',
		schema: {
			form_heading: area(0),
			form_button_label: text(1),
			contact_heading: text(2),
			offices: bloks(3, ['main_footer_office']),
			socials: bloks(4, ['main_social']),
			credentials_heading: text(5),
			credentials: bloks(6, ['main_footer_credential']),
			links: bloks(7, ['main_nav_link']),
			services_heading: text(8),
			services: bloks(9, ['main_nav_link']),
			legal_links: bloks(10, ['main_nav_link']),
			copyright: text(11),
		},
	},
];

/** Root content type for policy-style pages (privacy, terms, …). */
const LEGAL_PAGE = {
	name: 'legal_page',
	display_name: 'Legal Page',
	is_root: true,
	is_nestable: false,
	schema: {
		header: bloks(0, ['main_site_header'], { maximum: 1 }),
		hero_title: text(1, { description: 'Shown over the hero photo' }),
		hero_image: image(2),
		body: { type: 'richtext', pos: 3 },
		footer: bloks(4, ['main_site_footer'], { maximum: 1 }),
		seo_title: text(5),
		seo_description: area(6),
		seo_noindex: { type: 'boolean', pos: 7 },
	},
};

async function syncComponents() {
	const { components } = await mapi('GET', '/components/');
	const byName = new Map(components.map((c) => [c.name, c]));
	// Children first: a whitelist may only name components that exist.
	const defs = [...CHROME_COMPONENTS.map((c) => ({ ...c, is_root: false, is_nestable: true })), LEGAL_PAGE];
	for (const def of defs) {
		const found = byName.get(def.name);
		if (DRY) {
			console.log(`  [dry] would ${found ? 'update' : 'create'} ${def.name}`);
			continue;
		}
		if (found) {
			await mapi('PUT', `/components/${found.id}`, { component: { ...def, id: found.id } });
			console.log(`  updated  ${def.name}`);
		} else {
			await mapi('POST', '/components/', { component: def });
			console.log(`  created  ${def.name}`);
		}
	}
}

/* ------------------------------------------------------------------ *
 * Assets
 * ------------------------------------------------------------------ */

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml' };
let assetIndex = null;

/** Upload a file from /public (reusing an asset with the same file name); returns an asset field. */
async function asset(publicPath, alt) {
	const name = basename(publicPath);
	if (!assetIndex) {
		assetIndex = new Map();
		for (let page = 1; ; page++) {
			const { assets = [] } = await mapi('GET', `/assets/?per_page=100&page=${page}`);
			for (const a of assets) assetIndex.set(basename(a.filename.split('?')[0]), a);
			if (assets.length < 100) break;
		}
	}
	const field = (a) => ({ id: a.id, filename: a.filename, alt, fieldtype: 'asset', is_external_url: false });
	const hit = assetIndex.get(name);
	if (hit) {
		console.log(`  reused   ${name}`);
		return field(hit);
	}
	if (DRY) {
		console.log(`  [dry] would upload ${name}`);
		return { filename: publicPath, alt, fieldtype: 'asset' };
	}
	const sign = await mapi('POST', '/assets/', { filename: name });
	const form = new FormData();
	for (const [k, v] of Object.entries(sign.fields)) form.append(k, String(v));
	const type = MIME[name.split('.').pop().toLowerCase()] || 'application/octet-stream';
	form.append('file', new Blob([readFileSync(join(PUBLIC_DIR, publicPath))], { type }), name);
	const up = await fetch(sign.post_url, { method: 'POST', body: form });
	if (!up.ok && up.status !== 204) throw new Error(`S3 ${name} -> ${up.status} ${await up.text()}`);
	const got = await mapi('GET', `/assets/${sign.id}`);
	const a = { id: sign.id, filename: got.filename || sign.pretty_url };
	assetIndex.set(name, a);
	console.log(`  uploaded ${name}`);
	return field(a);
}

/* ------------------------------------------------------------------ *
 * Content
 * ------------------------------------------------------------------ */

const blok = (component, fields = {}) => ({ _uid: randomUUID(), component, ...fields });
const navLink = (l) => blok('main_nav_link', { label: l.label, link: l.href });
const socials = () => MAIN_SOCIAL_LINKS.map((x) => blok('main_social', { platform: x.platform, url: x.url }));

async function buildHeader() {
	return blok('main_site_header', {
		logo: await asset('/logo-wirebox-white.svg', 'Wirebox'),
		logo_link: MAIN_SITE,
		nav: MAIN_NAV.map((item) =>
			blok('main_nav_item', {
				label: item.label,
				link: item.href || '',
				items: (item.drawer || []).map((e) =>
					'children' in e ? blok('main_nav_group', { label: e.label, links: e.children.map(navLink) }) : navLink(e),
				),
			}),
		),
		contact_label: 'contact',
		contact_link: MAIN_CONTACT_URL,
		socials: socials(),
	});
}

async function buildFooter() {
	const T = MAIN_FOOTER_TEXT;
	const credentials = [];
	for (const c of MAIN_CREDENTIALS) credentials.push(blok('main_footer_credential', { image: await asset(c.src, c.alt), link: c.link || '' }));
	return blok('main_site_footer', {
		form_heading: T.formHeading,
		form_button_label: T.formButton,
		contact_heading: T.contactHeading,
		offices: MAIN_OFFICES.map((o) => blok('main_footer_office', { ...o })),
		socials: socials(),
		credentials_heading: T.credentialsHeading,
		credentials,
		links: MAIN_FOOTER_LINKS.map(navLink),
		services_heading: T.servicesHeading,
		services: MAIN_FOOTER_SERVICES.map(navLink),
		legal_links: MAIN_FOOTER_LEGAL.map(navLink),
		copyright: T.copyright,
	});
}

/**
 * The live page nests some bullet lists (<li><ul>…</ul></li>), which the HTML
 * converter splits into an empty one-item list followed by a flat list. Put the
 * second list back inside the first item so it renders like the live page.
 */
function renest(doc) {
	const isEmptyItemList = (n) =>
		n?.type === 'bullet_list' &&
		n.content?.length === 1 &&
		(n.content[0].content || []).every((c) => c.type === 'paragraph' && !(c.content || []).length);
	const out = [];
	const blocks = doc.content || [];
	for (let i = 0; i < blocks.length; i++) {
		const n = blocks[i];
		if (isEmptyItemList(n) && blocks[i + 1]?.type === 'bullet_list') {
			out.push({ type: 'bullet_list', content: [{ type: 'list_item', content: [{ type: 'paragraph' }, blocks[i + 1]] }] });
			i++;
		} else out.push(n);
	}
	return { ...doc, content: out };
}

function backup(story) {
	if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
	const file = join(BACKUP_DIR, `${SPACE}-${SLUG}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
	writeFileSync(file, JSON.stringify(story, null, 2));
	console.log(`  backed up -> ${file}`);
}

async function main() {
	console.log(`Space ${SPACE}${DRY ? ' (dry run)' : ''}`);
	console.log('=== Components ===');
	await syncComponents();

	const found = await mapi('GET', `/stories/?with_slug=${SLUG}`);
	const existing = (found.stories || []).find((s) => s.slug === SLUG);

	// Existing story: only fill in a missing header/footer, keep everything else.
	if (existing && !OVERWRITE) {
		const { story } = await mapi('GET', `/stories/${existing.id}`);
		const c = story.content || {};
		const needHeader = !Array.isArray(c.header) || !c.header.length;
		const needFooter = !Array.isArray(c.footer) || !c.footer.length;
		if (!needHeader && !needFooter) {
			console.log(`\nStory "${SLUG}" already has a header and footer — left untouched. Pass --overwrite to replace it.`);
			return;
		}
		console.log('=== Assets ===');
		const content = { ...c };
		if (needHeader) content.header = [await buildHeader()];
		if (needFooter) content.footer = [await buildFooter()];
		console.log('=== Story ===');
		if (DRY) return console.log(`  [dry] would add ${[needHeader && 'header', needFooter && 'footer'].filter(Boolean).join(' + ')} to "${SLUG}" and publish`);
		backup(story);
		await mapi('PUT', `/stories/${existing.id}`, { story: { name: story.name, slug: story.slug, content }, publish: 1 });
		console.log(`  published "${SLUG}" (added ${[needHeader && 'header', needFooter && 'footer'].filter(Boolean).join(' + ')}; other fields unchanged)`);
		return;
	}

	console.log('=== Assets ===');
	const hero_image = await asset('/seed-assets/main-site/our-process.jpg', 'A Wirebox developer sketching a plan on a whiteboard');
	const header = [await buildHeader()];
	const footer = [await buildFooter()];
	const html = readFileSync(HTML_FILE, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
	const content = {
		component: 'legal_page',
		header,
		hero_title: 'Privacy Policy',
		hero_image,
		body: renest(htmlToStoryblokRichtext(html)),
		footer,
		seo_title: 'Privacy Policy - Wirebox',
		seo_description: 'How Wirebox Ltd collects, uses and protects your personal data, and how to exercise your data protection rights.',
		seo_noindex: false,
	};
	const story = { name: 'Privacy Policy', slug: SLUG, content };

	console.log('=== Story ===');
	if (DRY) return console.log(`  [dry] would ${existing ? 'overwrite' : 'create'} + publish "${SLUG}"`);
	if (existing) {
		backup((await mapi('GET', `/stories/${existing.id}`)).story);
		await mapi('PUT', `/stories/${existing.id}`, { story, publish: 1 });
		console.log(`  published "${SLUG}" (overwritten)`);
	} else {
		await mapi('POST', '/stories/', { story, publish: 1 });
		console.log(`  published "${SLUG}" (created)`);
	}
}

main().catch((err) => {
	console.error('\nFAILED:', err.message);
	process.exit(1);
});
