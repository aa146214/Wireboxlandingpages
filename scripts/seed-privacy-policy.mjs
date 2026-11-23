/**
 * Seed the /privacy-policy page into Storyblok.
 *
 * Creates (or updates the schema of) the root content type `legal_page`, uploads
 * the hero photo to the Asset Manager (reusing it if a file with the same name
 * is already there), and creates the `privacy-policy` story from
 * src/data/legal/privacy-policy.html, converted to Storyblok rich text.
 *
 * Safe on a live space: the story is only CREATED. If `privacy-policy` already
 * exists it is left untouched (editors own it from then on), unless you pass
 * --overwrite, which backs it up to .storyblok-backups/ first.
 *
 * Usage (token from the environment, never committed):
 *   SB_MANAGEMENT_TOKEN=sb_pat_xxx SB_SPACE_ID=293147646055661 node scripts/seed-privacy-policy.mjs
 *   ... --dry   print what would be written, write nothing
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlToStoryblokRichtext } from '@storyblok/richtext/html-parser';

const TOKEN = process.env.SB_MANAGEMENT_TOKEN;
const SPACE = process.env.SB_SPACE_ID || '293147646055661';
const DRY = process.argv.includes('--dry');
const OVERWRITE = process.argv.includes('--overwrite');
const MAPI = `https://mapi.storyblok.com/v1/spaces/${SPACE}`;
const SLUG = 'privacy-policy';
const HTML_FILE = fileURLToPath(new URL('../src/data/legal/privacy-policy.html', import.meta.url));
const HERO_FILE = fileURLToPath(new URL('../public/seed-assets/main-site/our-process.jpg', import.meta.url));
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

/** Root content type for policy-style pages (privacy, terms, …). */
const LEGAL_PAGE = {
	name: 'legal_page',
	display_name: 'Legal Page',
	is_root: true,
	is_nestable: false,
	schema: {
		hero_title: { type: 'text', pos: 0, description: 'Shown over the hero photo' },
		hero_image: { type: 'asset', filetypes: ['images'], pos: 1 },
		body: { type: 'richtext', pos: 2 },
		seo_title: { type: 'text', pos: 3 },
		seo_description: { type: 'textarea', pos: 4 },
		seo_noindex: { type: 'boolean', pos: 5 },
	},
};

async function syncComponent() {
	const { components } = await mapi('GET', '/components/');
	const found = components.find((c) => c.name === LEGAL_PAGE.name);
	if (DRY) return console.log(`  [dry] would ${found ? 'update' : 'create'} component ${LEGAL_PAGE.name}`);
	if (found) {
		await mapi('PUT', `/components/${found.id}`, { component: { ...LEGAL_PAGE, id: found.id } });
		console.log(`  updated  ${LEGAL_PAGE.name}`);
	} else {
		await mapi('POST', '/components/', { component: LEGAL_PAGE });
		console.log(`  created  ${LEGAL_PAGE.name}`);
	}
}

async function heroAsset() {
	const name = basename(HERO_FILE);
	const alt = 'A Wirebox developer sketching a plan on a whiteboard';
	for (let page = 1; ; page++) {
		const { assets = [] } = await mapi('GET', `/assets/?per_page=100&page=${page}&search=${encodeURIComponent(name)}`);
		const hit = assets.find((a) => basename(a.filename.split('?')[0]) === name);
		if (hit) {
			console.log(`  reused   ${name}`);
			return { id: hit.id, filename: hit.filename, alt, fieldtype: 'asset', is_external_url: false };
		}
		if (assets.length < 100) break;
	}
	if (DRY) {
		console.log(`  [dry] would upload ${name}`);
		return { filename: `/seed-assets/main-site/${name}`, alt, fieldtype: 'asset' };
	}
	const sign = await mapi('POST', '/assets/', { filename: name });
	const form = new FormData();
	for (const [k, v] of Object.entries(sign.fields)) form.append(k, String(v));
	form.append('file', new Blob([readFileSync(HERO_FILE)], { type: 'image/jpeg' }), name);
	const up = await fetch(sign.post_url, { method: 'POST', body: form });
	if (!up.ok && up.status !== 204) throw new Error(`S3 ${name} -> ${up.status} ${await up.text()}`);
	const got = await mapi('GET', `/assets/${sign.id}`);
	console.log(`  uploaded ${name}`);
	return { id: sign.id, filename: got.filename || sign.pretty_url, alt, fieldtype: 'asset', is_external_url: false };
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

async function main() {
	console.log(`Space ${SPACE}${DRY ? ' (dry run)' : ''}`);
	console.log('=== Component ===');
	await syncComponent();

	const found = await mapi('GET', `/stories/?with_slug=${SLUG}`);
	const existing = (found.stories || []).find((s) => s.slug === SLUG);
	if (existing && !OVERWRITE) {
		console.log(`\nStory "${SLUG}" already exists (id ${existing.id}) — left untouched. Pass --overwrite to replace it.`);
		return;
	}

	console.log('=== Asset ===');
	const hero_image = await heroAsset();
	const html = readFileSync(HTML_FILE, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
	const content = {
		component: 'legal_page',
		hero_title: 'Privacy Policy',
		hero_image,
		body: renest(htmlToStoryblokRichtext(html)),
		seo_title: 'Privacy Policy - Wirebox',
		seo_description: 'How Wirebox Ltd collects, uses and protects your personal data, and how to exercise your data protection rights.',
		seo_noindex: false,
	};
	const story = { name: 'Privacy Policy', slug: SLUG, content };

	console.log('=== Story ===');
	if (DRY) return console.log(`  [dry] would ${existing ? 'overwrite' : 'create'} + publish "${SLUG}" (${content.body.content.length} rich-text blocks)`);
	if (existing) {
		const { story: old } = await mapi('GET', `/stories/${existing.id}`);
		if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
		const file = join(BACKUP_DIR, `${SPACE}-${SLUG}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
		writeFileSync(file, JSON.stringify(old, null, 2));
		console.log(`  backed up -> ${file}`);
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
