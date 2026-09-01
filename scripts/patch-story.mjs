/**
 * Targeted edits to a live Storyblok story.
 *
 * seed-support-home.mjs regenerates a story's whole `content` and PUTs it
 * wholesale, so running it against a space someone is editing silently discards
 * their work. That's fine for standing up a fresh space and wrong for
 * everything after. This script is the counterpart: it fetches the story,
 * changes only the fields a named patch touches, and writes the same object
 * back — anything the client edited stays exactly as they left it.
 *
 * Dry run by default; nothing is written without --apply.
 *
 *   node scripts/patch-story.mjs --list
 *   node scripts/patch-story.mjs watford-address                  # preview
 *   node scripts/patch-story.mjs watford-address --apply          # write
 *
 * Env:
 *   SB_MANAGEMENT_TOKEN   (required)
 *   SB_SPACE_ID           default: client space
 *   SB_STORY_SLUG         default: home
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKEN = process.env.SB_MANAGEMENT_TOKEN;
const SPACE = process.env.SB_SPACE_ID || '293434407023515';
const SLUG = process.env.SB_STORY_SLUG || 'home';
const MAPI = `https://mapi.storyblok.com/v1/spaces/${SPACE}`;
const BACKUP_DIR = fileURLToPath(new URL('../.storyblok-backups', import.meta.url));

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const FORCE = argv.includes('--force');
/** `--value <x>` supplies the new value for patches that take one. */
const valueIdx = argv.indexOf('--value');
const VALUE = valueIdx !== -1 ? argv[valueIdx + 1] : undefined;
// Skip the token after `--value`, but only when the flag is actually present —
// otherwise valueIdx is -1 and this would swallow the patch name at index 0.
const patchName = argv.find(
	(a, i) => !a.startsWith('--') && !(valueIdx !== -1 && i === valueIdx + 1)
);

/* ------------------------------------------------------------------ *
 * Patches. Each receives the story content and mutates it in place,
 * returning a list of human-readable "what changed" lines.
 *
 * Target bloks by their own identity (component name, office name, …) —
 * never by array index, which shifts the moment an editor reorders
 * anything in Storyblok.
 * ------------------------------------------------------------------ */

/** Depth-first walk over every blok in a story's content tree. */
function walk(node, visit) {
	if (Array.isArray(node)) return node.forEach((n) => walk(n, visit));
	if (!node || typeof node !== 'object') return;
	if (node.component) visit(node);
	for (const value of Object.values(node)) {
		if (value && typeof value === 'object') walk(value, visit);
	}
}

const findBloks = (content, component) => {
	const out = [];
	walk(content, (b) => b.component === component && out.push(b));
	return out;
};

/** Set a field only when it differs, recording the change. */
function setField(blok, field, value, label, changes) {
	const before = blok[field];
	if (before === value) return;
	blok[field] = value;
	changes.push({ what: label, before, after: value });
}

const PATCHES = {
	'hero-eyebrow': {
		description:
			'Correct the hero eyebrow to "245 sites protected & monitored" (the CSS uppercases it).',
		value: '245 sites protected & monitored',
		run(content) {
			const changes = [];
			const [hero] = findBloks(content, 'support_hero');
			if (!hero) throw new Error('No support_hero blok found.');
			setField(hero, 'eyebrow', PATCHES['hero-eyebrow'].value, 'support_hero.eyebrow', changes);
			return changes;
		},
	},

	'hero-video': {
		description:
			'Set the hero video. Pass --value "<YouTube or Vimeo URL>"; an empty value clears it back to the poster.',
		run(content) {
			if (VALUE === undefined) {
				throw new Error('hero-video needs --value "<url>" (use --value "" to clear it).');
			}
			const changes = [];
			const [hero] = findBloks(content, 'support_hero');
			if (!hero) throw new Error('No support_hero blok found.');
			setField(hero, 'video', VALUE, 'support_hero.video', changes);
			return changes;
		},
	},

	'hero-commitment-order': {
		description:
			'Reorder the hero response commitments to the Figma order: critical → uptime → standard → target.',
		order: ['1hr', '24/7', '4hrs', '99.9%'],
		run(content) {
			const changes = [];
			const [hero] = findBloks(content, 'support_hero');
			if (!hero) throw new Error('No support_hero blok found.');
			const stats = hero.stats || [];
			const want = PATCHES['hero-commitment-order'].order;
			const before = stats.map((s) => s.value);
			// Reorder in place by value, keeping any stat the list doesn't name.
			const sorted = [...stats].sort((a, b) => {
				const ai = want.indexOf(a.value);
				const bi = want.indexOf(b.value);
				return (ai === -1 ? want.length : ai) - (bi === -1 ? want.length : bi);
			});
			const after = sorted.map((s) => s.value);
			if (before.join() !== after.join()) {
				hero.stats = sorted;
				changes.push({ what: 'support_hero.stats order', before: before.join(' → '), after: after.join(' → ') });
			}
			return changes;
		},
	},

	'watford-address': {
		description:
			'Collapse the duplicated "Leavesden Lodge / Copsewood Lodge" wording in the Watford footer address (feedback #5).',
		// CONFIRM THIS WORDING WITH THE CLIENT BEFORE APPLYING.
		value: 'Unit 1, Copsewood Lodge,\n1A Copsewood Road, Leavesden\nWatford, Hertfordshire, WD24 5DY',
		run(content) {
			const changes = [];
			const offices = findBloks(content, 'footer_office').filter((o) => /watford/i.test(o.name || ''));
			if (!offices.length) throw new Error('No Watford footer_office blok found — has the footer changed?');
			for (const office of offices) {
				setField(office, 'address', PATCHES['watford-address'].value, `footer_office "${office.name}" address`, changes);
			}
			return changes;
		},
	},
};

/* ------------------------------------------------------------------ */

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

const show = (v) => (typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v ?? null));

function listPatches() {
	console.log('Available patches:\n');
	for (const [name, p] of Object.entries(PATCHES)) {
		console.log(`  ${name}\n    ${p.description}\n`);
	}
}

async function main() {
	if (argv.includes('--list') || !patchName) {
		listPatches();
		if (!patchName) console.log('Pass a patch name to preview it, then --apply to write.');
		return;
	}
	const patch = PATCHES[patchName];
	if (!patch) {
		console.error(`Unknown patch "${patchName}".\n`);
		listPatches();
		process.exit(1);
	}
	if (!TOKEN) {
		console.error('Missing SB_MANAGEMENT_TOKEN env var.');
		process.exit(1);
	}

	// Resolve the story by slug so the script isn't pinned to one space's ids.
	const found = await mapi('GET', `/stories/?with_slug=${encodeURIComponent(SLUG)}`);
	const stub = (found.stories || []).find((s) => s.full_slug === SLUG || s.slug === SLUG);
	if (!stub) throw new Error(`No story with slug "${SLUG}" in space ${SPACE}.`);
	const { story } = await mapi('GET', `/stories/${stub.id}`);

	console.log(`Space   ${SPACE}`);
	console.log(`Story   "${story.name}" (${story.full_slug}, id ${story.id})`);
	console.log(`Patch   ${patchName}\n`);

	const changes = patch.run(story.content);

	if (!changes.length) {
		console.log('Already up to date — nothing to change.');
		return;
	}
	for (const c of changes) {
		console.log(`  ${c.what}`);
		console.log(`    before ${show(c.before)}`);
		console.log(`    after  ${show(c.after)}`);
	}

	if (!APPLY) {
		console.log(`\nDry run — nothing written. Re-run with --apply to save and publish.`);
		return;
	}

	// Publishing pushes whatever is in the draft, so unreviewed editor work
	// would go live alongside this patch. Make that an explicit decision.
	if (story.unpublished_changes && !FORCE) {
		console.error(
			'\nREFUSING: this story has unpublished draft changes. Publishing now would push' +
				'\nsomeone else\'s unfinished edits live. Review them in Storyblok first, then' +
				'\nre-run with --force.'
		);
		process.exit(1);
	}

	if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const backup = join(BACKUP_DIR, `${SPACE}-${story.slug}-${stamp}.json`);
	writeFileSync(backup, JSON.stringify(story, null, 2));
	console.log(`\nBacked up current story -> ${backup}`);

	await mapi('PUT', `/stories/${story.id}`, {
		story: { name: story.name, slug: story.slug, content: story.content },
		publish: 1,
	});
	console.log(`Applied "${patchName}" and published.`);
}

main().catch((err) => {
	console.error('\nFAILED:', err.message);
	process.exit(1);
});
