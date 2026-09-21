/**
 * Laravel upgrade estimator page — the content the seed writes to Storyblok and
 * the page falls back to when the story can't be fetched.
 *
 * The seven questions and every weight live in estimator-model.mjs, not here:
 * they're the commercial model, and the component reads them directly. This
 * file is only the copy around the calculator.
 */

export const ESTIMATOR_SEO = {
	seo_title: 'Laravel upgrade cost calculator — instant estimate | Wirebox',
	seo_description:
		'Answer seven questions and get a ballpark range for hours, cost and timeline on your Laravel upgrade. From the UK\'s first certified Laravel partner.',
};

/**
 * @param {object} h
 * @param {(component: string, fields?: object) => object} h.sb   blok factory
 * @param {(name: string) => object} h.A                          asset by basename
 * @param {(url: string) => object|string} h.mlink                multilink
 * @param {object} h.header                                       shared header blok
 * @param {() => object} h.locations                              shared maps blok
 * @param {() => object} h.footer                                 shared footer blok
 */
export function buildEstimatorBody({ sb, A, mlink, header, locations, footer }) {
	const hero = sb('laravel_hero', {
		layout: 'badges',
		eyebrow: 'Free instant estimate',
		heading: 'What will your Laravel upgrade\nactually cost?',
		body: "Answer seven quick questions about your application and we'll give you a ballpark range for hours, cost and timeline — plus exactly what drives the number. Takes about two minutes.",
		ctas: [], // the wizard below is the call to action
		badges: [
			sb('partner_badge', { brand: 'Laravel', label: 'Certified\nLaravel\nPartner', logo: A('laravel-logomark.svg') }),
			sb('partner_badge', { label: 'AWS\nPartner', logo: A('aws-wordmark.svg') }),
		],
		trust_items: ['5★ Google rated', 'No lock-in contracts'].join('\n'),
	});

	const wizard = sb('estimator_wizard', {
		eyebrow: 'Laravel upgrade estimator',
		heading: 'Build your estimate',
		body: "Answer seven quick questions about your application. We'll update the ballpark range for hours, cost and timeline as you go.",
		stats: [
			['7', 'questions', 'fuchsia'],
			['2 min', 'to complete', 'blue'],
			['Live', 'estimate', 'dark'],
			['£120', 'per hour', 'pink'],
		].map(([value, label, tone]) => sb('estimator_stat', { value, label, tone })),
		sidebar_title: 'Current estimate',
		sidebar_empty: 'Answer the first question to start the estimate.',
		includes_title: 'Your estimate will include',
		includes: ['Estimated cost range', 'Estimated effort in hours', 'Estimated timeline', 'Itemised work breakdown'].join('\n'),
		note_title: 'Planning estimate, not a fixed quote',
		note_body: "Book a short technical audit and we'll turn this into a fixed price within a few days.",
		cta_label: 'Book a technical audit',
		cta_link: mlink('#contact'),
		update_note: 'Your estimate updates after each answer.',
	});

	const drivers = sb('estimator_drivers', {
		eyebrow: 'What drives the number',
		heading: 'A clearer estimate, built from the work involved',
		body: 'Every answer changes the upgrade path, testing effort or implementation risk behind the range.',
		items: [
			['Upgrade path', 'Every Laravel version hop is weighted for the engineering changes involved.'],
			['Application size', 'The number of controllers, modules and integrations sets the baseline.'],
			['Tests and packages', 'Coverage and dependency load change the regression-testing effort.'],
			['Additional complexity', 'Auth, queues, APIs, multi-tenancy and deployment constraints are costed separately.'],
		].map(([title, description]) => sb('numbered_point', { title, description })),
	});

	// The body copy quotes the rate and the spread; both come from the model in
	// the component, so this stays a sentence rather than a second source of truth.
	const range = sb('estimator_range', {
		eyebrow: 'How the range is calculated',
		heading: 'A useful planning range, with the assumptions visible',
		low_label: 'Low range',
		mid_label: 'Mid-point',
		high_label: 'High range',
	});

	const banner = sb('cta_banner', {
		heading: 'Software development and maintenance expertise',
		prompt: 'Ready to start a project?',
		cta_label: 'Arrange a health check',
		cta_link: '#contact',
	});

	const getStarted = sb('cta_contact', {
		tone: 'blue',
		eyebrow: 'Get started',
		heading: 'Your next Laravel build deserves a certified team.',
		heading_accent: '',
		body: "Talk to us about how artificial intelligence can transform your organisation. We'll help you design, build and deliver something incredible.",
		body_strong: 'Contact us to schedule a free one-hour consultancy and see how we can help you.',
		labels_first: true,
		phones: [
			['0207 993 5485', 'Watford & London – call us:'],
			['01908 110 420', 'Milton Keynes – call us:'],
		].map(([number, label]) => sb('cta_phone', { number, label })),
		form_title: "Tell us what you're building",
		form_cta_label: 'Book my consultation',
		form_note: "No obligation · We'll respond within 1 business day",
		show_message: true,
		form_source: 'estimator',
	});

	const maps = { ...locations(), tall: true };

	return [header, hero, wizard, drivers, range, banner, getStarted, maps, footer()];
}
