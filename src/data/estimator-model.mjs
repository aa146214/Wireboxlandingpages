/**
 * Laravel upgrade estimator — questions, weights and scoring.
 *
 * A direct port of laravel-upgrade-estimator-reference.xlsx (the reference
 * workbook behind the "Wirebox Estimator" artifact). Every table below is that
 * workbook sheet for sheet; `estimate()` follows its "Calculation Logic" sheet
 * step for step, and `scripts/check-estimator.mjs` asserts the result against
 * its "Worked Example".
 *
 * The numbers are commercial inputs — Andrew set the £120/hr rate and the
 * weights — so treat this file as the single source of truth and change values
 * here rather than in a component. Plain JS so the seed, the check script and
 * Astro can all import it.
 */

/** Global Constants sheet. */
export const CONSTANTS = {
	hourlyRate: 120,
	weeklyCapacity: 25,
	lowMultiplier: 0.85,
	highMultiplier: 1.25,
};

/** Version & PHP Reference sheet — order is the index used by the hop lookup. */
export const PHP_VERSIONS = ['7.2', '7.3', '7.4', '8.0', '8.1', '8.2', '8.3'];

/** Laravel major → the PHP version it needs at minimum. */
export const LARAVEL_VERSIONS = [
	{ version: 5, minPhp: '7.1' },
	{ version: 6, minPhp: '7.1' },
	{ version: 7, minPhp: '7.1' },
	{ version: 8, minPhp: '7.3' },
	{ version: 9, minPhp: '8.0' },
	{ version: 10, minPhp: '8.1' },
	{ version: 11, minPhp: '8.2' },
	{ version: 12, minPhp: '8.2' },
];

/**
 * Version Upgrade Hops sheet — the engineering weight of each single hop,
 * indexed by the version you're leaving. An upgrade sums every hop it crosses.
 */
export const HOP_WEIGHTS = [
	{ from: 5, to: 6, weight: 0.9, note: 'Routine dependency bump; minor helper deprecations.' },
	{ from: 6, to: 7, weight: 0.9, note: 'Notification & mail changes; routine bump.' },
	{ from: 7, to: 8, weight: 1.1, note: 'Model factories rewritten as classes; job batching; time-based password-reset tokens.' },
	{ from: 8, to: 9, weight: 1.3, note: 'Swift Mailer replaced by Symfony Mailer; query builder return types; Flysystem 3 rewrite.' },
	{ from: 9, to: 10, weight: 0.8, note: 'Mostly routine — added type declarations to the skeleton; invokable validation rules by default.' },
	{ from: 10, to: 11, weight: 1.7, note: 'Streamlined app skeleton — consolidated config, rebuilt bootstrap/app.php, removed default Kernel classes, new password-reset expiry, Sanctum config changes.' },
	{ from: 11, to: 12, weight: 0.5, note: 'Low-impact maintenance release — bumped minimum dependency versions, Carbon 3 support.' },
];

/** App Size Options sheet. `phpBumpHours` is the PHP Bump Flat Hours sheet. */
export const APP_SIZES = [
	{ key: 'small', label: 'Small', description: 'Marketing site or internal tool. Under ~15 controllers, one or two integrations.', hoursPerUnit: 10, addonScale: 0.7, phpBumpHours: 5 },
	{ key: 'medium', label: 'Medium', description: 'Typical business application. 15–40 controllers, a handful of integrations.', hoursPerUnit: 18, addonScale: 1, phpBumpHours: 9 },
	{ key: 'large', label: 'Large', description: 'Multi-module platform. 40–100 controllers, several third-party integrations.', hoursPerUnit: 30, addonScale: 1.4, phpBumpHours: 15 },
	{ key: 'ent', label: 'Enterprise', description: 'Multi-team or multi-tenant codebase. 100+ controllers, deep integration surface.', hoursPerUnit: 48, addonScale: 1.9, phpBumpHours: 24 },
];

/** Test Coverage Options sheet — multiplies core hours. */
export const TEST_COVERAGE = [
	{ key: 'none', label: 'None', description: 'No automated tests — everything gets checked by hand.', multiplier: 1.35 },
	{ key: 'some', label: 'Some', description: 'A partial test suite covering the key flows.', multiplier: 1.12 },
	{ key: 'good', label: 'Good', description: 'Strong feature + unit coverage running in CI.', multiplier: 0.9 },
];

/** Dependency Load Options sheet — multiplies core hours. */
export const DEPENDENCY_LOAD = [
	{ key: 'light', label: 'Light', description: 'Fewer than 10 third-party packages.', multiplier: 1 },
	{ key: 'mod', label: 'Moderate', description: '10–25 third-party packages.', multiplier: 1.15 },
	{ key: 'heavy', label: 'Heavy', description: '25 or more, or several unmaintained ones.', multiplier: 1.35 },
	{ key: 'unsure', label: 'Not sure', description: "We'll assume a moderate load and confirm during the audit.", multiplier: 1.2 },
];

/** Add-on Options sheet — each ticked one adds ROUND(base × size scale) hours. */
export const ADDONS = [
	{ key: 'custom_auth', label: 'Custom auth or permissions system', baseHours: 8, note: 'Custom auth/permissions layer needs manual verification against framework changes.' },
	{ key: 'queues', label: 'Heavy use of queues & scheduled jobs', baseHours: 6, note: 'Queued jobs and scheduled tasks re-tested against new defaults.' },
	{ key: 'multitenant', label: 'Multi-tenant or multi-database', baseHours: 10, note: 'Multi-tenant/multi-database setup adds regression surface.' },
	{ key: 'api', label: 'Public API (Sanctum / Passport)', baseHours: 7, note: 'API auth layer reconfigured for the new framework defaults.' },
	{ key: 'legacy_fe', label: 'Legacy jQuery-heavy Blade frontend', baseHours: 9, note: 'Legacy frontend touches framework helpers directly and needs manual review.' },
	{ key: 'no_staging', label: 'No staging environment yet', baseHours: 6, note: 'No staging environment — time budgeted to stand up a temporary one before go-live.' },
	{ key: 'critical', label: 'Zero-downtime / business-critical', baseHours: 8, note: 'Zero-downtime requirement — phased rollout and rollback plan required.' },
];

/** The version a visitor can say they're on today, in wizard order. */
export const CURRENT_VERSION_OPTIONS = [
	{ key: '5', label: '5.x or older', version: 5 },
	{ key: '6', label: '6.x (LTS)', version: 6 },
	{ key: '7', label: '7.x', version: 7 },
	{ key: '8', label: '8.x (LTS)', version: 8 },
	{ key: '9', label: '9.x', version: 9 },
	{ key: '10', label: '10.x (LTS)', version: 10 },
	{ key: '11', label: '11.x', version: 11 },
];

/** The versions we upgrade to — filtered at runtime to those above `current`. */
export const TARGET_VERSION_OPTIONS = [
	{ key: '10', label: 'Laravel 10 (LTS)', version: 10 },
	{ key: '11', label: 'Laravel 11', version: 11 },
	{ key: '12', label: 'Laravel 12 (latest)', version: 12 },
];

/** Current PHP, in wizard order. `unsure` has no index — see `phpIndex`. */
export const PHP_OPTIONS = [
	{ key: '7.2', label: '7.2 or older' },
	{ key: '7.3', label: '7.3' },
	{ key: '7.4', label: '7.4' },
	{ key: '8.0', label: '8.0' },
	{ key: '8.1', label: '8.1' },
	{ key: '8.2', label: '8.2' },
	{ key: '8.3', label: '8.3 or newer' },
	{ key: 'unsure', label: 'Not sure' },
];

/**
 * The seven questions, in the order the wizard asks them.
 *
 * `title` and `hint` are verbatim from the workbook's "Wizard Steps" sheet —
 * don't reword them here. The add-on labels come from the "Add-on Options"
 * sheet rather than that sheet's abbreviated summary column. `short` is the
 * only invention: it's the rail label, which the workbook doesn't specify.
 */
export const STEPS = [
	{ key: 'current', short: 'Current', title: 'What Laravel version are you currently running?', hint: 'Pick the version your production application is on today.', type: 'single' },
	{ key: 'target', short: 'Target', title: 'What version are you upgrading to?', hint: "We'll map every step in between.", type: 'single' },
	{ key: 'size', short: 'Size', title: 'How big is the application?', hint: "A rough size is fine — you're not committing to anything.", type: 'single' },
	{ key: 'php', short: 'PHP', title: 'What PHP version are you currently running?', hint: "Some Laravel versions need a newer PHP — we'll flag it if yours does.", type: 'single' },
	{ key: 'tests', short: 'Tests', title: 'How much automated test coverage do you have?', hint: 'This changes how much manual regression testing the upgrade needs.', type: 'single' },
	{ key: 'deps', short: 'Packages', title: 'How many third-party packages does it depend on?', hint: 'Composer packages that may need their own compatibility check.', type: 'single' },
	{ key: 'addons', short: 'Add-ons', title: 'Does any of this apply? Pick all that apply.', hint: 'Each one adds its own, separately-costed line to the estimate.', type: 'multi' },
];

const byKey = (list, key) => list.find((x) => x.key === key);
const versionIndex = (version) => LARAVEL_VERSIONS.findIndex((v) => v.version === Number(version));
/** 'Not sure' sits below every real version, so a bump is always assumed. */
const phpIndex = (php) => (php === 'unsure' || php == null ? -1 : PHP_VERSIONS.indexOf(php));

/** Target options that are actually above the chosen current version. */
export function targetsFor(currentKey) {
	const current = Number(currentKey);
	if (!current) return TARGET_VERSION_OPTIONS;
	return TARGET_VERSION_OPTIONS.filter((t) => t.version > current);
}

/**
 * Score one set of answers. Returns null until the six scored questions are
 * answered (add-ons are optional, and an unanswered add-on step just scores 0).
 *
 * Mirrors the workbook's Calculation Logic sheet in order: hop weights, core
 * hours, PHP bump, add-ons, then the range, cost and timeline.
 */
export function estimate(answers = {}) {
	const { current, target, size, php, tests, deps } = answers;
	const addons = answers.addons || [];

	const currentIdx = versionIndex(current);
	const targetIdx = versionIndex(target);
	const sizeOpt = byKey(APP_SIZES, size);
	const testOpt = byKey(TEST_COVERAGE, tests);
	const depOpt = byKey(DEPENDENCY_LOAD, deps);
	if (currentIdx < 0 || targetIdx < 0 || targetIdx <= currentIdx || !sizeOpt || !testOpt || !depOpt) return null;

	// Every hop between the two versions, so 8 → 12 crosses 8→9, 9→10, 10→11, 11→12.
	const hops = HOP_WEIGHTS.filter((h) => {
		const from = versionIndex(h.from);
		return from >= currentIdx && from < targetIdx;
	});
	const hopWeightSum = hops.reduce((sum, h) => sum + h.weight, 0);

	const coreHours = Math.round(sizeOpt.hoursPerUnit * hopWeightSum * testOpt.multiplier * depOpt.multiplier);

	const minPhp = LARAVEL_VERSIONS[targetIdx].minPhp;
	const phpBumpNeeded = phpIndex(php) < PHP_VERSIONS.indexOf(minPhp);
	const phpBumpHours = phpBumpNeeded ? sizeOpt.phpBumpHours : 0;

	const addonLines = ADDONS.filter((a) => addons.includes(a.key)).map((a) => ({
		key: a.key,
		label: a.label,
		note: a.note,
		hours: Math.round(a.baseHours * sizeOpt.addonScale),
	}));
	const addonHours = addonLines.reduce((sum, a) => sum + a.hours, 0);

	const midHours = coreHours + phpBumpHours + addonHours;
	const lowHours = Math.round(midHours * CONSTANTS.lowMultiplier);
	const highHours = Math.round(midHours * CONSTANTS.highMultiplier);

	return {
		hops,
		hopWeightSum: Number(hopWeightSum.toFixed(2)),
		coreHours,
		minPhp,
		phpBumpNeeded,
		phpBumpHours,
		addonLines,
		addonHours,
		midHours,
		lowHours,
		highHours,
		costLow: lowHours * CONSTANTS.hourlyRate,
		costHigh: highHours * CONSTANTS.hourlyRate,
		weeksLow: Math.ceil(lowHours / CONSTANTS.weeklyCapacity),
		weeksHigh: Math.ceil(highHours / CONSTANTS.weeklyCapacity),
	};
}

/** "£11,160" — the estimator only ever shows whole pounds. */
export const formatCost = (value) => '£' + Math.round(value).toLocaleString('en-GB');
