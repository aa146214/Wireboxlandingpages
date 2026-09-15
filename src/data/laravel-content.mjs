/**
 * Content for the Laravel partner landing page (/laravel), transcribed from the
 * Figma prototype (Wirebox 2026 → node 876:1359).
 *
 * One source of truth used two ways:
 *   - scripts/seed-support-home.mjs seeds it into Storyblok (real asset refs,
 *     link objects, the shared header/footer/testimonial bloks);
 *   - src/pages/laravel.astro renders it as a fallback when the story is
 *     unpublished or Storyblok is unreachable, so a campaign URL never 404s.
 *
 * Plain JS so both an .mjs script and Astro can import it. Callers supply the
 * helpers, which is what keeps the two environments apart.
 */

/**
 * Real reviews from wirebox.co.uk — four Vimeo video reviews, then text
 * reviews. Shared by the support page seed and the Laravel page. Plain field
 * objects; callers wrap them in `testimonial` bloks.
 */
export const TESTIMONIAL_ITEMS = [
	{ name: 'James Randall', role: 'Co-founder, Kids Party Finder', vimeo: '996278084' },
	{ name: 'Stephen Makinde', role: 'Owner, The Oak Practice & Perfect Balance Clinic', vimeo: '1127563818' },
	{ name: 'Glen Hempenstall', role: 'Communications Manager, Watford Town Centre BID', vimeo: '1119462004' },
	{ name: 'Alison Hutchinson CBE', role: 'CEO, Pennies', vimeo: '1125445378' },
	{ quote: 'John and his team have been punctual, helpful and supportive showing both excellent knowledge of WordPress as well as a strong creative and design skill set. I would have no reservation in recommending Wirebox for WordPress development.', name: 'Nina Innocenti', role: 'Project Manager, Middlesex University' },
	{ quote: 'Wirebox went above and beyond, delivering a brilliant website with an attractive design, web governance conformity and smooth functionality – and it all went from brief to finished product within about two months.', name: 'Sweta Rana', role: 'Web Manager, Middlesex University' },
	{ quote: 'The Wirebox team worked from the initial scope and developed a fantastic solution which is interactive, fast, clear and allows full transparency and consistency across the business. We are delighted with the end result.', name: 'Kathryn Boyd', role: 'Director of HR, Search Consultancy' },
	{ quote: 'Wirebox were able to analyse reports and offer solutions to improve the site. It took a few weeks, but our score is 95+ which is the best in our industry. Really happy with the work and always will recommend Wirebox.', name: 'Mr Clutch', role: 'Marketing Manager' },
	{ quote: 'Great service – great knowledge throughout the company, very quick response and always have the solution to our problems in a professional and timely manner.', name: 'Chevin Fleet', role: 'Marketing Manager' },
];

/**
 * The six case studies: [title, duration, description, tags, image file].
 * Shared by the support page seed and the Laravel page (which overrides two
 * descriptions to match its design).
 */
export const CASE_ITEMS = [
	['Mr Clutch', '5+ years', 'Ongoing support and database maintenance across a vast multi-location estate – keeping critical booking and operational systems running flawlessly.', ['Database', 'Performance', 'Multi-site'], 'support-mrclutch.png'],
	['Bulgin', '5+ years', 'Tailored support and monitoring covering their entire global operation – from Asia to the Americas – with custom SLAs for business-critical uptime.', ['Global', '24/7 monitor', 'Custom SLA'], 'support-bulgin.png'],
	['Penguin Cold Caps', 'Ongoing', '24/7 monitoring for a medical device company where site availability directly impacts cancer patients. Zero tolerance for downtime.', ['Healthcare', '24/7', 'Multi-country'], 'support-penguin.png'],
	['Pennies', '3+ years', 'Trusted partner for a fintech charity processing millions in donations. We maintain their Magento platform and custom integrations so every gift gets through.', ['Fintech', 'Magento', 'Charity'], 'support-pennies.png'],
	['Middlesex University', 'Ongoing', 'We maintain their graduate showcase portal – an arts site where students present their work to the world – keeping it secure, current, and performing.', ['Education', 'WordPress', 'Portal'], 'support-middlesex.png'],
	['Sapphire Gymnastics', 'Ongoing', 'We built and continue to manage their bespoke booking and payments database – allocating children to classes and managing live capacity in real time.', ['Bespoke DB', 'Payments', 'Laravel'], 'support-sapphire.png'],
];

export const LARAVEL_SEO = {
	seo_title: 'Laravel development agency — UK certified Laravel partner | Wirebox',
	seo_description:
		"Business-critical Laravel software, built the artisan way. Wirebox is the UK's first certified Laravel partner: bespoke builds, migrations, hosting and long-term support.",
};

/**
 * @param {object} h helpers
 * @param {(component: string, fields?: object) => object} h.sb   make a blok
 * @param {(assetName: string) => object} h.A                     asset ref by seed-asset filename
 * @param {(url: string) => any} h.mlink                          link value for `cta` bloks
 * @param {object} h.header                                        the shared header blok
 * @param {object[]} h.testimonialItems                            testimonial bloks to reuse
 * @param {() => object} h.locations                               the shared maps section
 * @param {() => object} h.footer                                  the shared footer
 */
export function buildLaravelBody({ sb, A, mlink, header, testimonialItems, locations, footer }) {
	const hero = sb('laravel_hero', {
		eyebrow: "UK's first certified Laravel partner",
		heading: 'Business-critical software,\nbuilt the artisan way.',
		body: "Wirebox has spent 10+ years building, migrating and supporting Laravel applications for organisations that can't afford downtime – from charities tracking billions in funding to manufacturers running global operations.",
		ctas: [
			sb('cta', { label: 'Book a free consultation', link: mlink('#contact'), variant: 'primary', icon: 'arrow-right' }),
			sb('cta', { label: 'View our work', link: mlink('#work'), variant: 'outline', icon: 'arrow-right' }),
		],
		badges: [
			sb('partner_badge', { brand: 'Laravel', label: 'Certified\nLaravel\nPartner', logo: A('laravel-logomark.svg') }),
			sb('partner_badge', { label: 'AWS\nPartner', logo: A('aws-wordmark.svg') }),
		],
		terminal_title: 'wirebox — laravel',
		terminal: [
			'$ composer create-project laravel/laravel app',
			'$ php artisan make:model Invoice -mcr',
			'$ php artisan migrate',
			'',
			'Migrated: 2026_08_29_create_invoices_table (11.42ms)',
			'',
			'$ php artisan test',
			'PASS  Tests\\Feature\\InvoiceTest',
			'✓ ledger reconciles nightly',
			'✓ webhook retries respect backoff',
			'',
			'Tests: 42 passed (118 assertions)',
			'Time: 1.84s',
		].join('\n'),
		terminal_badge: 'Production ready',
		trust_items: '5★ Google rated\nNo lock-in contracts',
	});

	const proof = sb('risk_stats', {
		eyebrow: 'Laravel partner',
		eyebrow_tone: 'blue',
		heading: 'Proof, not promises',
		heading_accent: 'Proof',
		heading_tone: 'dark',
		leading_rule: true,
		hide_footnote: true,
		footnote: '',
		cta_label: '',
		cta_link: '',
		stats: [
			['10+', 'years building and supporting Laravel applications in production', 'blue'],
			['<2s', 'page load time for Mr Clutch after our performance rebuild – down from 7.8s', 'fuchsia'],
			['£126bn+', 'in climate finance tracked through the funding database we built for the Commonwealth Blue Charter', 'dark'],
			['+5%', 'conversion uplift for Mr Clutch following the same optimisation work', 'blue'],
		].map(([value, description, tone]) => sb('risk_stat', { value, description, tone })),
	});

	const services = sb('laravel_services', {
		eyebrow: 'What we do',
		heading: 'More than a\nbuild-and-walk-away\nagency',
		body: "We don't just ship a Laravel application and disappear. We stay on as the team that keeps it secure, fast, and growing.",
		subheading: 'Laravel application development',
		subbody: 'Bespoke, business-critical applications built on Laravel — from booking and payments platforms to funding databases and configuration tools — designed around how your business actually operates, not a generic template.',
		points: [
			['Built bespoke, not templated', 'purple'],
			['Signed off in staging first', 'fuchsia'],
			['Owned by a certified Laravel team', 'dark'],
		].map(([text, tone]) => sb('numbered_point', { text, tone })),
		services: [
			['Laravel migration', 'Moving a legacy PHP application onto Laravel, or taking over one another agency built. We audit, document, and migrate with zero downtime.', 'fuchsia'],
			['Laravel hosting', 'Provisioned and managed on AWS, Azure or DigitalOcean, with Forge and Ansible keeping deployment and infrastructure repeatable.', 'purple'],
			['Maintenance & support', 'Security patching, version upgrades and code optimisation on a rolling monthly plan — no long-term contract required.', 'fuchsia'],
			['Reliability & operational review', 'A backup and disaster-recovery audit, plus a look at your existing processes for what can be automated or made more resilient.', 'purple'],
		].map(([title, description, tone]) => sb('service_item', { title, description, tone })),
	});

	const process = sb('sla_tiers', {
		eyebrow: 'How we build',
		eyebrow_tone: 'green',
		heading: 'A four-stage process, every time',
		heading_accent: '',
		subtitle: "The same discipline whether we're building a booking platform or migrating a decade of legacy code.",
		hide_dividers: true,
		tiers: [
			['1.', 'Analyse', 'We extract, clean and review your existing data and requirements before a line of new code is written.', 'pink'],
			['2.', 'Design', 'We architect the application and database model – the structure everything else is built against.', 'green'],
			['3.', 'Develop', 'We build in Laravel against that structure, with staging environments for every change.', 'yellow'],
			['4.', 'Test', 'We simulate real-world activity to confirm the build performs before it ever reaches production.', 'lavender'],
		].map(([value, label, description, tone]) => sb('sla_tier', { value, label, description, tone })),
		stack_label: 'Stack:',
		stack: ['PHP', 'Laravel', 'AWS', 'Azure', 'DigitalOcean', 'Forge', 'Ansible', 'Magento', 'WordPress'].join('\n'),
		stack_highlight: 'Laravel',
	});

	const testimonials = sb('testimonials', {
		eyebrow: 'What our clients say',
		heading: 'An experience that exceeds\nexpectations in every way',
		heading_accent: '',
		items: testimonialItems,
	});

	// Two case descriptions differ from the support page's wording in this design.
	const CASE_COPY = {
		Pennies: 'Trusted partner for a fintech charity processing millions in donations. We maintain their Magento platform and custom integrations on an ongoing retainer.',
		'Sapphire Gymnastics': 'We created and continue to manage their bespoke booking and payments database – allocating children to classes and managing live capacity in real time.',
	};
	const cases = sb('support_cases', {
		eyebrow: 'Client work',
		heading: 'Long-term partners, not one-off projects',
		heading_accent: '',
		subtitle: "We're still actively supporting every client below.",
		footnote: 'Six sectors. One standard: business-critical software built for the long term.',
		chip_tags: true,
		square_media: true,
		items: CASE_ITEMS.map(([title, duration, description, tags, img]) =>
			sb('support_case', { title, duration, description: CASE_COPY[title] || description, tags: tags.join('\n'), image: A(img), link: mlink('#') })
		),
	});

	const featured = sb('featured_testimonial', {
		eyebrow: 'What clients say',
		heading: 'The kind of partner you keep\nfor years',
		quote: "If you ever want a partner to be there with you, to help you grow, as *they* grow, I can't recommend Wirebox highly enough. Thank you, Wirebox team, and I look forward to the next 10 years.",
		name: 'Alison Hutchinson',
		role: 'CBE, CEO, Pennies',
		video: 'https://player.vimeo.com/video/1125445378?fl=ip&fe=ec',
		ratings: [
			sb('rating_badge', { kicker: 'Reviewed on', brand: 'Clutch', score: '', stars: '5', caption: '11 reviews', tone: 'clutch' }),
			sb('rating_badge', { kicker: 'Google Rating', brand: 'Google', score: '4.9', stars: '5', caption: 'Based on 61 reviews', tone: 'google' }),
		],
		cta_label: 'See all testimonials',
		cta_link: 'https://wirebox.co.uk/testimonials/',
	});

	const banner = sb('cta_banner', {
		heading: 'Software development and maintenance expertise',
		prompt: 'Ready to start a project?',
		cta_label: 'Arrange a health check',
		cta_link: '#contact',
	});

	const faq = sb('faq', {
		eyebrow: 'FAQ',
		heading: 'Questions we get asked every week',
		heading_accent: '', // design: single Primary Blue, no highlight
		items: [
			['Why choose a certified Laravel partner?', 'Wirebox was the first agency in the UK to become a certified Laravel partner, with over a decade of production experience across finance, education, charity and automotive clients.', true],
			['Do you only build new applications, or take over existing ones?', 'Both. We regularly migrate legacy PHP applications into Laravel, and take over ongoing support of applications another agency originally built — with a full audit before we touch anything live.', false],
			['What does the development process actually look like?', 'Four stages, every project: analyse your existing data and requirements, design the application and database model, develop against that structure, then test by simulating real-world activity before launch.', false],
			['Where do you host Laravel applications?', "Most commonly AWS, Azure or DigitalOcean, provisioned and deployed through Forge and Ansible — or we'll work alongside a host you've already committed to.", false],
			['Do you offer ongoing support after launch?', 'Yes — rolling monthly support plans with no long-term contract. We earn the relationship every month rather than locking you into one.', false],
			['Do you work with businesses outside the UK?', "We're UK-based and work with clients both nationally and internationally, including multi-country operations like Bulgin's.", false],
			['How much does a Laravel project cost?', 'It depends on scope. We give transparent, fixed-price quotes and a clear timeline before any work begins — no surprises partway through.', false],
			['How do we get started?', "Book a free one-hour consultation. We'll talk through what you're trying to build or fix, and follow up with a fixed-price plan.", false],
		].map(([question, answer, open]) => sb('faq_item', { question, answer, open })),
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
		form_source: 'laravel',
	});

	const maps = { ...locations(), tall: true };

	return [header, hero, proof, services, process, testimonials, cases, featured, banner, faq, getStarted, maps, footer()];
}
