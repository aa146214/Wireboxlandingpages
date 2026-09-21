/**
 * AI development landing page — the content the seed writes to Storyblok and
 * the page falls back to when the story can't be fetched.
 *
 * Copy is taken from the prototype (Figma node 903:4253) as written; where the
 * design shows a photograph we don't have yet, the field is left empty and the
 * component draws a placeholder rather than guessing at an image.
 */

export const AI_SEO = {
	seo_title: 'AI software development agency — bespoke AI for business | Wirebox',
	seo_description:
		'From AI assistants and generative workflows to custom machine-learning products, Wirebox designs and delivers secure, production-ready AI around your business.',
};

/** The 14 asks, with the colour each card's number block carries. */
export const AI_ASKS = [
	['AI Audit / ROI Blueprint', 'Map every process, rank automation by expected ROI, and get a phased plan before spending a pound on development.', 'yellow'],
	['Context Layer', 'One centralised source of truth for data, SOPs and workflows instead of 20 disconnected tools.', 'pink'],
	['Client Onboarding Automation', 'Account provisioning, kickoff routing and intake that runs without a human touching it.', 'green'],
	['Automated Reporting', 'Dashboards and client-ready reports pulled from CRM, ad platforms and financials with zero manual input.', 'lavender'],
	['Tier-1 AI Agents', 'Customer service, scheduling and intake agents that handle 60–70% of inbound volume.', 'fuchsia'],
	['SaaS Consolidation', 'Replacing overlapping subscriptions with custom apps built on your own data layer.', 'yellow'],
	['Pipeline Automation', 'Deal ingestion, enrichment and staleness alerts so nothing sits untouched.', 'pink'],
	['Document Generation', 'Proposals, contracts and memos drafted by AI from structured data.', 'green'],
	['Data Consolidation', 'Pipelines that pull scattered spreadsheets and inboxes into one queryable system.', 'lavender'],
	['Internal Knowledge Bases', 'AI trained on company SOPs so the team stops asking the same questions.', 'fuchsia'],
	['Capacity Tracking', "Real-time visibility into who's over- or under-utilised across the team.", 'yellow'],
	['Billing Reconciliation', 'Catching scope creep and invoice errors before they become revenue leaks.', 'pink'],
	['Team Adoption Training', 'Getting employees to actually use the systems — because logins mean nothing without adoption.', 'green'],
	['AI Cost Reduction', 'Model routing that cuts inference spend without cutting output quality.', 'lavender'],
];

/**
 * @param {object} h
 * @param {(component: string, fields?: object) => object} h.sb   blok factory
 * @param {(name: string) => object} h.A                          asset by basename
 * @param {(url: string) => object|string} h.mlink                multilink
 * @param {object} h.header                                       shared header blok
 * @param {() => object} h.locations                              shared maps blok
 * @param {() => object} h.footer                                 shared footer blok
 */
export function buildAiBody({ sb, A, mlink, header, locations, footer }) {
	const hero = sb('ai_hero', {
		eyebrow: 'Bespoke AI software development',
		heading: 'Build intelligent software\nthat moves your\nbusiness forward',
		body: 'From AI assistants and generative workflows to custom machine-learning products, we design and deliver secure, production-ready solutions around your business.',
		ctas: [
			sb('cta', { label: 'Explore our AI capabilities', link: mlink('#capabilities'), variant: 'primary', icon: 'arrow-right' }),
			sb('cta', { label: 'See the 14 most common asks', link: mlink('#catalogue'), variant: 'outline', icon: 'arrow-right' }),
		],
		trust_line: "UK's first Laravel Certified company | London & Milton Keynes | Biz4Biz Awards 2025 Winner",
		form_title: 'Start with a free AI consultation',
		form_cta_label: 'Request my free consultation',
		form_source: 'ai',
	});

	const trust = sb('trust_bar', {
		tone: 'fuchsia',
		items: ["UK's first Laravel Certified company", 'London & Milton Keynes', 'Biz4Biz Awards 2025 Winner'].map((text) =>
			sb('trust_item', { text })
		),
	});

	const agency = sb('ai_agency', {
		eyebrow: 'From opportunity to production',
		heading: 'Why choose Wirebox as your AI development agency',
		body: [
			'Wirebox builds intelligent, production-ready software that puts artificial intelligence to work for your business. We design, develop and deploy bespoke AI solutions — from generative AI and smart assistants to machine learning models and full system integrations — tailored to your specific requirements.',
			'As the UK’s first Laravel Certified company, with over a decade of experience delivering robust, scalable web applications, we combine deep engineering expertise with the latest advances in AI. The result is software that is not only intelligent, but secure, maintainable and built to last.',
			'Whether you want to automate routine work, surface insights hidden in your data, or give your customers a smarter, more personalised experience, our team helps you scope, build and deliver something incredible.',
		].join('\n\n'),
		card_title: 'AI that fits',
		card_items: [
			'Automate routine work',
			'Surface insight hidden in your data',
			'Give customers a smarter, more personalised experience',
		].map((label) => sb('numbered_line', { label })),
	});

	const process = sb('ai_process', {
		eyebrow: 'How an engagement runs',
		heading: 'Our AI development process',
		body: 'We follow a structured four-step process to deliver AI solutions that fit your specifications and stand up in production.',
		steps: [
			['Discover', 'We work with you to understand your goals, data and constraints, and identify the highest-value opportunities for AI.'],
			['Design', 'We architect the solution — selecting the right models, data pipelines and integration points — and agree a clear specification.'],
			['Develop', 'We build, train and refine your AI application using best-practice engineering, with regular checkpoints and demos.'],
			['Test & Deploy', 'We rigorously test against real-world scenarios, then deploy with monitoring, support and a plan for ongoing improvement.'],
		].map(([title, description]) => sb('numbered_point', { title, description })),
	});

	const partner = sb('ai_partner', {
		eyebrow: 'Why work with Wirebox',
		heading: 'Why choose Wirebox as your AI partner',
		items: [
			['Proven engineering pedigree', 'The UK’s first Laravel Certified company, with 10+ years delivering and maintaining business-critical applications.'],
			['AI plus real software discipline', 'We pair cutting-edge AI with secure, scalable, maintainable engineering — not throwaway prototypes.'],
			['Award-winning team', 'Biz4Biz Awards 2025 winner for Best Technical Services, and recognised across regional business awards.'],
			['Transparent, fixed-price quotes', 'A free one-hour consultation to scope your project, followed by clear, transparent pricing.'],
			['Ongoing support & maintenance', 'Security patching, model updates, performance monitoring and hosting on AWS, Azure or Digital Ocean.'],
			['UK-based, working nationwide', 'Offices in London and Milton Keynes, serving clients across the UK and internationally.'],
		].map(([title, description]) => sb('numbered_point', { title, description })),
	});

	const benefits = sb('ai_benefits', {
		eyebrow: 'Why it matters',
		heading: 'The benefits of AI for your business',
		items: [
			['Better decision-making', 'Identify patterns and trends across your data that humans would miss.', 'cyan'],
			['Enhanced efficiency', 'Automate repetitive, time-consuming tasks and free your team for higher-value work.', 'pink'],
			['Cost reduction', 'Optimise processes and reduce manual overhead.', 'green'],
			['Fraud and anomaly detection', 'Flag unusual activity in real time.', 'fuchsia'],
			['Personalised customer experiences', 'Tailor recommendations and interactions to each user.', 'lavender'],
			['Innovation', 'Turn your data into new products, services and revenue streams.', 'cyan'],
		].map(([title, description, tone]) => sb('ai_benefit', { title, description, tone })),
	});

	const tech = sb('ai_tech', {
		eyebrow: 'Under the hood',
		heading: 'Technologies we\nwork with',
		body: 'We build with the most capable AI platforms and frameworks available, selecting the right model for each use case.',
		chips: ['AI models', 'Wirebox engineering'].join('\n'),
		items: [
			['OpenAI (GPT-4 class)', 'Industry-leading models for generation, reasoning, chat and complex automation.', 'yellow'],
			['Anthropic Claude', 'Advanced models well suited to long-context analysis, safe assistants and agentic workflows.', 'pink'],
			['Google Gemini', 'Multimodal models for combined text, image and data understanding.', 'green'],
			['Meta Llama', 'Open-weight models for private, self-hosted and cost-sensitive deployments.', 'white'],
			['Laravel & PHP', 'Our certified engineering foundation for secure, scalable application delivery.', 'fuchsia'],
		].map(([title, description, tone]) => sb('ai_tech_item', { title, description, tone })),
	});

	const catalogue = sb('ai_catalogue', {
		eyebrow: 'The catalogue',
		heading: "The 14 most common AI asks we're getting from mid-market companies right now",
		body: "Spanning AI consulting, generative AI, agents, integration and machine learning — this is what's actually landing in our inbox this quarter, not a menu of hypothetical use cases.",
		items: AI_ASKS.map(([title, description, tone]) => sb('ai_ask', { title, description, tone })),
	});

	const faq = sb('faq', {
		eyebrow: 'Questions',
		heading: 'Before you book the consultation',
		heading_accent: 'Before',
		subtitle: 'Clear answers before we scope the opportunity together.',
		items: [
			['Do we need to replace our existing software?', 'No. Most of what we build sits alongside what you already run — pulling from your CRM, finance system or inbox and writing back to them. We replace a tool only when keeping it costs more than replacing it.', false],
			['How is this different from just using ChatGPT?', 'ChatGPT is a general tool a person opens and closes. What we build stays in your workflow – pulling from your CRM, running on schedule, handling tasks without anyone remembering to start it.', true],
			['Which AI models do you actually use?', 'Whichever fits the job: OpenAI, Anthropic Claude, Google Gemini or open-weight Llama models for private deployments. We pick per use case rather than committing you to one vendor.', false],
			["What if we don't know which of the 14 to start with?", 'That is what the AI Audit is for. We map your processes, rank them by expected return, and give you a phased plan before you spend anything on development.', false],
			["Who owns the system once it's built?", 'You do — the code, the data and the infrastructure. No lock-in, and no licence that stops working if you stop paying us.', false],
			['How long does a typical build take?', 'A focused automation is usually weeks rather than months; a full context layer or agent platform runs longer. You get a dated plan at the end of the scoping consultation.', false],
			['How do you handle security and hosting?', 'Hosted on AWS, Azure or Digital Ocean with monitoring, security patching and model updates included. Private and self-hosted models are available where data cannot leave your estate.', false],
			['Do you work alongside our existing developers?', 'Regularly. We can run the whole build, or work as the AI specialists inside your existing team and hand over as we go.', false],
		].map(([question, answer, open]) => sb('faq_item', { question, answer, open })),
	});

	const contact = sb('ai_contact', {
		eyebrow: 'Get in touch',
		heading: 'Start with a free AI consultation',
		body: 'A free one-hour consultation to scope your project, followed by clear, transparent pricing.',
		form_cta_label: 'Request my free consultation',
		form_note: "Thanks — we'll be in touch shortly.",
		form_source: 'ai',
		offices_title: 'Offices',
		offices_body: 'London & Milton Keynes, serving clients across the UK and internationally.',
		offices: [
			['Watford', '+44 (0) 207 993 5485', 'hello@wirebox.co.uk'],
			['Milton Keynes', '+44 (0) 1908 25 24 23', 'hi@wiredbox'],
		].map(([name, phone, email]) => sb('ai_office', { name, phone, email })),
		explore_title: 'Explore',
		explore: [
			['What we do', '#capabilities'],
			['Our process', '#process'],
			['Why us', '#why'],
			['The 14 most common asks', '#catalogue'],
			['FAQ', '#faq'],
		].map(([label, link]) => sb('footer_link', { label, url: link })),
	});

	return [header, hero, trust, agency, process, partner, benefits, tech, catalogue, faq, contact, locations(), footer()];
}
