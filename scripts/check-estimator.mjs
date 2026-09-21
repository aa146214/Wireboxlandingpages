/**
 * Checks the estimator engine against the reference workbook.
 *
 * `laravel-upgrade-estimator-reference.xlsx` ships a "Worked Example" sheet
 * precisely so a port can be proved correct; those numbers are the first case
 * below. The rest cover the edges the worked example doesn't: the cheapest and
 * dearest routes, "Not sure" answers, add-on scaling, and inputs that can't be
 * scored at all.
 *
 *   node scripts/check-estimator.mjs
 */
import { estimate, targetsFor } from '../src/data/estimator-model.mjs';

let failures = 0;

function check(name, got, want) {
	const ok = JSON.stringify(got) === JSON.stringify(want);
	if (!ok) {
		failures += 1;
		console.error(`  FAIL ${name}\n       got  ${JSON.stringify(got)}\n       want ${JSON.stringify(want)}`);
	}
	return ok;
}

function scenario(name, answers, expected) {
	const result = estimate(answers);
	const got = result && Object.fromEntries(Object.keys(expected).map((k) => [k, result[k]]));
	if (check(name, got, expected)) console.log(`  ok   ${name}`);
}

console.log('\nWorked Example (the workbook sheet, cell for cell)');
scenario(
	'Laravel 8 → 12, Medium, PHP 7.4, Some tests, Moderate deps, no add-ons',
	{ current: '8', target: '12', size: 'medium', php: '7.4', tests: 'some', deps: 'mod', addons: [] },
	{
		hopWeightSum: 4.3,
		coreHours: 100,
		minPhp: '8.2',
		phpBumpNeeded: true,
		phpBumpHours: 9,
		addonHours: 0,
		midHours: 109,
		lowHours: 93,
		highHours: 136,
		costLow: 11160,
		costHigh: 16320,
		weeksLow: 4,
		weeksHigh: 6,
	}
);

console.log('\nEdges');
// Cheapest possible route: one low-weight hop, small app, good tests, light deps,
// and a PHP version that already clears the target's minimum.
scenario(
	'11 → 12, Small, PHP 8.3, Good tests, Light deps — no PHP bump',
	{ current: '11', target: '12', size: 'small', php: '8.3', tests: 'good', deps: 'light', addons: [] },
	{ hopWeightSum: 0.5, coreHours: 5, phpBumpNeeded: false, phpBumpHours: 0, midHours: 5, lowHours: 4, highHours: 6 }
);

// Every hop, the largest app, no tests, heaviest dependencies, all seven add-ons.
scenario(
	'5 → 12, Enterprise, PHP unsure, No tests, Heavy deps, all add-ons',
	{
		current: '5',
		target: '12',
		size: 'ent',
		php: 'unsure',
		tests: 'none',
		deps: 'heavy',
		addons: ['custom_auth', 'queues', 'multitenant', 'api', 'legacy_fe', 'no_staging', 'critical'],
	},
	{
		hopWeightSum: 7.2,
		// 48 × 7.2 × 1.35 × 1.35 = 629.856
		coreHours: 630,
		phpBumpNeeded: true,
		phpBumpHours: 24,
		// ROUND of each base × 1.9: 15 + 11 + 19 + 13 + 17 + 11 + 15
		addonHours: 101,
		midHours: 755,
		lowHours: 642,
		highHours: 944,
		weeksLow: 26,
		weeksHigh: 38,
	}
);

// 'Not sure' PHP is treated as below every minimum, so it always bumps — even
// when the target is Laravel 10, whose minimum is only 8.1.
scenario(
	'9 → 10, Medium, PHP not sure — bumps anyway',
	{ current: '9', target: '10', size: 'medium', php: 'unsure', tests: 'some', deps: 'light', addons: [] },
	{ hopWeightSum: 0.8, phpBumpNeeded: true, phpBumpHours: 9 }
);

// Add-on hours scale with app size, so the same tick costs less on a small app.
scenario(
	'Add-on scaling, Small: multi-tenant (10 base) → 7',
	{ current: '10', target: '11', size: 'small', php: '8.2', tests: 'some', deps: 'light', addons: ['multitenant'] },
	{ addonHours: 7, phpBumpNeeded: false }
);

console.log('\nUnscorable input returns null');
check('no answers', estimate({}), null);
check('target below current', estimate({ current: '11', target: '10', size: 'medium', php: '8.2', tests: 'some', deps: 'light' }), null);
check('same version', estimate({ current: '10', target: '10', size: 'medium', php: '8.2', tests: 'some', deps: 'light' }), null);
check('missing size', estimate({ current: '8', target: '12', php: '7.4', tests: 'some', deps: 'mod' }), null);
if (failures === 0) console.log('  ok   all four refused');

console.log('\nTarget filtering');
check('current 11 → only 12', targetsFor('11').map((t) => t.key), ['12']);
check('current 5 → 10, 11, 12', targetsFor('5').map((t) => t.key), ['10', '11', '12']);
check('current 10 → 11, 12', targetsFor('10').map((t) => t.key), ['11', '12']);
if (failures === 0) console.log('  ok   filtered to versions above current');

console.log(failures === 0 ? '\nEstimator matches the reference workbook.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
