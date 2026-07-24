/**
 * JSON-LD structured data for the support home page.
 *
 * The FAQ Q&As and social profiles are read from the live Storyblok content so
 * they never drift from what's rendered. Postal addresses are kept as discrete
 * fields here (schema.org PostalAddress needs street/locality/postcode split
 * out — parsing the footer's free-text address is unreliable). When an office
 * address changes, update both the seed and this constant.
 */

interface Office {
	id: string;
	name: string;
	streetAddress: string;
	addressLocality: string;
	addressRegion?: string;
	postalCode: string;
	telephone: string;
	email: string;
}

const OFFICES: Office[] = [
	{
		id: 'milton-keynes',
		name: 'Wirebox — Milton Keynes',
		streetAddress: '3rd Floor, Elder House West, Elder Gate',
		addressLocality: 'Milton Keynes',
		postalCode: 'MK9 1LR',
		telephone: '+44 1908 110 420',
		email: 'hello@wirebox.co.uk',
	},
	{
		id: 'watford',
		name: 'Wirebox — Watford',
		// NOTE: street line pending confirmation of the Watford address wording (#5).
		streetAddress: 'Unit 1, Copsewood Lodge, 1A Copsewood Road',
		addressLocality: 'Watford',
		addressRegion: 'Hertfordshire',
		postalCode: 'WD24 5DY',
		telephone: '+44 20 7993 5485',
		email: 'hello@wirebox.co.uk',
	},
];

interface Blok {
	component?: string;
	[key: string]: unknown;
}

const bodyOf = (content: unknown): Blok[] => {
	const body = (content as { body?: unknown })?.body;
	return Array.isArray(body) ? (body as Blok[]) : [];
};

const findBlok = (content: unknown, component: string): Blok | undefined =>
	bodyOf(content).find((b) => b?.component === component);

export interface JsonLdGraph {
	'@context': string;
	'@graph': Record<string, unknown>[];
}

/**
 * Build the schema.org @graph for the home page: one Organization, a
 * LocalBusiness per office, and a FAQPage built from the FAQ section.
 */
export function buildHomeJsonLd(content: unknown, origin: string): JsonLdGraph {
	const base = origin.replace(/\/$/, '');
	const orgId = `${base}/#organization`;
	const graph: Record<string, unknown>[] = [];

	const footer = findBlok(content, 'footer');
	const faq = findBlok(content, 'faq');

	const sameAs = (Array.isArray(footer?.socials) ? (footer!.socials as { url?: string }[]) : [])
		.map((s) => s?.url)
		.filter((u): u is string => typeof u === 'string' && /^https?:\/\//.test(u));

	graph.push({
		'@type': 'Organization',
		'@id': orgId,
		name: 'Wirebox',
		url: base,
		...(sameAs.length ? { sameAs } : {}),
		contactPoint: OFFICES.map((o) => ({
			'@type': 'ContactPoint',
			contactType: 'customer support',
			telephone: o.telephone,
			email: o.email,
			areaServed: 'GB',
			availableLanguage: 'English',
		})),
	});

	for (const o of OFFICES) {
		graph.push({
			'@type': 'LocalBusiness',
			'@id': `${base}/#office-${o.id}`,
			name: o.name,
			parentOrganization: { '@id': orgId },
			url: base,
			telephone: o.telephone,
			email: o.email,
			address: {
				'@type': 'PostalAddress',
				streetAddress: o.streetAddress,
				addressLocality: o.addressLocality,
				...(o.addressRegion ? { addressRegion: o.addressRegion } : {}),
				postalCode: o.postalCode,
				addressCountry: 'GB',
			},
		});
	}

	const faqItems = Array.isArray(faq?.items) ? (faq!.items as { question?: string; answer?: string }[]) : [];
	const questions = faqItems.filter((it) => it?.question && it?.answer);
	if (questions.length) {
		graph.push({
			'@type': 'FAQPage',
			'@id': `${base}/#faq`,
			mainEntity: questions.map((it) => ({
				'@type': 'Question',
				name: it.question,
				acceptedAnswer: { '@type': 'Answer', text: it.answer },
			})),
		});
	}

	return { '@context': 'https://schema.org', '@graph': graph };
}
