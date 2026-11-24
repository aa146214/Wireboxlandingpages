/**
 * Seed the /privacy-policy page into Storyblok.
 *
 * Creates (or updates the schema of) the root content type `legal_page`, uploads
 * the hero photo to the Asset Manager (reusing a file with the same name), and
 * creates the `privacy-policy` story: the policy from
 * src/data/legal/privacy-policy.html converted to rich text, plus `header` and
 * `footer` bloks copied from the space's Home story, so the page shares this
 * site's header and footer like every other page.
 *
 * Safe on a live space: the story is only CREATED. If `privacy-policy` already
 * exists, the only change made is to its header/footer, and only when they are
 * missing or still the retired main-site bloks (`main_site_header` /
 * `main_site_footer`); the story is backed up to .storyblok-backups/ first and
 * every other field is left to editors. --overwrite replaces the whole story
 * (also backed up first).
 *
 * --delete-legacy-components removes the retired main-site block types
 * (main_site_*, main_nav_*, main_social, main_footer_*) once no story in the
 * space uses them.
 *
 * Usage (token from the environment, never committed):
 *   SB_MANAGEMENT_TOKEN=sb_pat_xxx SB_SPACE_ID=293147646055661 node scripts/seed-privacy-policy.mjs
 *   ... --dry   print what would be written, write nothing
 */
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlToStoryblokRichtext } from '@storyblok/richtext/html-parser';

const TOKEN = process.env.SB_MANAGEMENT_TOKEN;
const SPACE = process.env.SB_SPACE_ID || '293147646055661';
const DRY = process.argv.includes('--dry');
const OVERWRITE = process.argv.includes('--overwrite');
const DELETE_LEGACY = process.argv.includes('--delete-legacy-components');
const MAPI = `https://mapi.storyblok.com/v1/spaces/${SPACE}`;
const SLUG = 'privacy-policy';
const HTML_FILE = fileURLToPath(new URL('../src/data/legal/privacy-policy.html', import.meta.url));
const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));
const BACKUP_DIR = fileURLToPath(new URL('../.storyblok-backups', import.meta.url));

/** Block types from the earlier main-site header/footer, no longer used by the code. */
const LEGACY_COMPONENTS = [
	'main_site_header',
	'main_site_footer',
	'main_nav_item',
	'main_nav_group',
	'main_nav_link',
	'main_social',
	'main_footer_office',
	'main_footer_credential',
];

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

/** Root content type for policy-style pages (privacy, terms, …). */
const LEGAL_PAGE = {
	name: 'legal_page',
	display_name: 'Legal Page',
	is_root: true,
	is_nestable: false,
	schema: {
		header: { type: 'bloks', restrict_components: true, component_whitelist: ['header'], maximum: 1, pos: 0 },
		hero_title: { type: 'text', pos: 1, description: 'Shown over the hero photo' },
		hero_image: { type: 'asset', filetypes: ['images'], pos: 2 },
		body: { type: 'richtext', pos: 3 },
		footer: { type: 'bloks', restrict_components: true, component_whitelist: ['footer'], maximum: 1, pos: 4 },
		seo_title: { type: 'text', pos: 5 },
		seo_description: { type: 'textarea', pos: 6 },
		seo_noindex: { type: 'boolean', pos: 7 },
	},
};

async function syncComponent() {
	const { components } = await mapi('GET', '/components/');
	const found = components.find((c) => c.name === LEGAL_PAGE.name);
	if (DRY) return console.log(`  [dry] would ${found ? 'update' : 'create'} ${LEGAL_PAGE.name}`);
	if (found) {
		await mapi('PUT', `/components/${found.id}`, { component: { ...LEGAL_PAGE, id: found.id } });
		console.log(`  updated  ${LEGAL_PAGE.name}`);
	} else {
		await mapi('POST', '/components/', { component: LEGAL_PAGE });
		console.log(`  created  ${LEGAL_PAGE.name}`);
	}
}

/** Upload a file from /public (reusing an asset with the same file name); returns an asset field. */
async function asset(publicPath, alt) {
	const name = basename(publicPath);
	for (let page = 1; ; page++) {
		const { assets = [] } = await mapi('GET', `/assets/?per_page=100&page=${page}`);
		const hit = assets.find((a) => basename(a.filename.split('?')[0]) === name);
		if (hit) {
			console.log(`  reused   ${name}`);
			return { id: hit.id, filename: hit.filename, alt, fieldtype: 'asset', is_external_url: false };
		}
		if (assets.length < 100) break;
	}
	if (DRY) {
		console.log(`  [dry] would upload ${name}`);
		return { filename: publicPath, alt, fieldtype: 'asset' };
	}
	const sign = await mapi('POST', '/assets/', { filename: name });
	const form = new FormData();
	for (const [k, v] of Object.entries(sign.fields)) form.append(k, String(v));
	form.append('file', new Blob([readFileSync(join(PUBLIC_DIR, publicPath))], { type: 'image/jpeg' }), name);
	const up = await fetch(sign.post_url, { method: 'POST', body: form });
	if (!up.ok && up.status !== 204) throw new Error(`S3 ${name} -> ${up.status} ${await up.text()}`);
	const got = await mapi('GET', `/assets/${sign.id}`);
	console.log(`  uploaded ${name}`);
	return { id: sign.id, filename: got.filename || sign.pretty_url, alt, fieldtype: 'asset', is_external_url: false };
}

/** Deep copy of a blok tree with fresh _uids, so the copy is independent of the original. */
const cloneBlok = (v) =>
	Array.isArray(v)
		? v.map(cloneBlok)
		: v && typeof v === 'object'
			? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === '_uid' ? randomUUID() : cloneBlok(x)]))
			: v;

/** This site's header and footer, copied from the space's Home story. */
async function siteChrome() {
	const { stories = [] } = await mapi('GET', '/stories/?with_slug=home');
	const home = stories.find((s) => s.slug === 'home');
	const body = home ? (await mapi('GET', `/stories/${home.id}`)).story.content?.body || [] : [];
	const header = body.find((b) => b.component === 'header');
	const footer = body.find((b) => b.component === 'footer');
	console.log(`  header/footer copied from the Home story${home ? ` (${home.id})` : ' — NOT FOUND, using component defaults'}`);
	return {
		header: [header ? cloneBlok(header) : { _uid: randomUUID(), component: 'header', nav: [], socials: [] }],
		footer: [footer ? cloneBlok(footer) : { _uid: randomUUID(), component: 'footer' }],
	};
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

/** Header/footer field needs (re)filling: empty, or still a retired main-site blok. */
const needsChrome = (field, legacyName) => !Array.isArray(field) || !field.length || field[0]?.component === legacyName;

async function seedStory() {
	const found = await mapi('GET', `/stories/?with_slug=${SLUG}`);
	const existing = (found.stories || []).find((s) => s.slug === SLUG);

	if (existing && !OVERWRITE) {
		const { story } = await mapi('GET', `/stories/${existing.id}`);
		const c = story.content || {};
		const fixHeader = needsChrome(c.header, 'main_site_header');
		const fixFooter = needsChrome(c.footer, 'main_site_footer');
		if (!fixHeader && !fixFooter) {
			console.log(`  "${SLUG}" already has this site's header and footer — left untouched.`);
			return;
		}
		const chrome = await siteChrome();
		const content = { ...c };
		if (fixHeader) content.header = chrome.header;
		if (fixFooter) content.footer = chrome.footer;
		const what = [fixHeader && 'header', fixFooter && 'footer'].filter(Boolean).join(' + ');
		if (DRY) return console.log(`  [dry] would set ${what} on "${SLUG}" and publish (other fields unchanged)`);
		backup(story);
		await mapi('PUT', `/stories/${existing.id}`, { story: { name: story.name, slug: story.slug, content }, publish: 1 });
		console.log(`  published "${SLUG}" (set ${what}; other fields unchanged)`);
		return;
	}

	const hero_image = await asset('/seed-assets/main-site/our-process.jpg', 'A Wirebox developer sketching a plan on a whiteboard');
	const chrome = await siteChrome();
	const html = readFileSync(HTML_FILE, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
	const content = {
		component: 'legal_page',
		header: chrome.header,
		hero_title: 'Privacy Policy',
		hero_image,
		body: renest(htmlToStoryblokRichtext(html)),
		footer: chrome.footer,
		seo_title: 'Privacy Policy - Wirebox',
		seo_description: 'How Wirebox Ltd collects, uses and protects your personal data, and how to exercise your data protection rights.',
		seo_noindex: false,
	};
	const story = { name: 'Privacy Policy', slug: SLUG, content };
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

async function deleteLegacyComponents() {
	// Refuse if any story (draft or published) still uses one of them.
	const pattern = new RegExp(`"component":"(${LEGACY_COMPONENTS.join('|')})"`);
	for (let page = 1; ; page++) {
		const { stories = [] } = await mapi('GET', `/stories/?per_page=100&page=${page}`);
		for (const s of stories) {
			const { story } = await mapi('GET', `/stories/${s.id}`);
			if (pattern.test(JSON.stringify(story.content))) {
				console.log(`  kept legacy block types: story "${s.slug}" still uses them`);
				return;
			}
		}
		if (stories.length < 100) break;
	}
	const { components } = await mapi('GET', '/components/');
	// Parents first, so nothing is deleted while a whitelist still names it.
	for (const name of LEGACY_COMPONENTS) {
		const c = components.find((x) => x.name === name);
		if (!c) continue;
		if (DRY) {
			console.log(`  [dry] would delete ${name}`);
			continue;
		}
		await mapi('DELETE', `/components/${c.id}`);
		console.log(`  deleted  ${name}`);
	}
}

async function main() {
	console.log(`Space ${SPACE}${DRY ? ' (dry run)' : ''}`);
	console.log('=== Component ===');
	await syncComponent();
	console.log('=== Story ===');
	await seedStory();
	if (DELETE_LEGACY) {
		console.log('=== Retired block types ===');
		await deleteLegacyComponents();
	}
}

main().catch((err) => {
	console.error('\nFAILED:', err.message);
	process.exit(1);
});
