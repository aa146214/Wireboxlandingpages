/**
 * Local content fixture for the Wirebox home page.
 *
 * During the build phase this provides the page's bloks tree so components can be
 * developed and verified pixel-perfect without round-tripping to Storyblok.
 * The shape mirrors the Storyblok block schemas 1:1, so switching `getHomeContent()`
 * to fetch from the Storyblok delivery API (see [...slug].astro) requires no
 * component changes — only the data source.
 *
 * Sections are added here as they are built, top-down.
 */

export interface SbBlok {
	component: string;
	_uid?: string;
	[key: string]: unknown;
}

let uid = 0;
const u = (name: string) => `fixture-${name}-${++uid}`;

const header: SbBlok = {
	component: 'header',
	_uid: u('header'),
	nav: [
		{ label: 'what we do', link: '/what-we-do' },
		{ label: 'our process', link: '/our-process' },
		{ label: 'our work', link: '/our-work' },
		{ label: 'blog', link: '/blog' },
		{ label: 'about us', link: '/about-us' },
		{ label: 'contact', link: '/contact', highlight: true },
	],
	phone_label: 'Call us on:',
	phone_number: '0207 993 5485',
	socials: [
		{ platform: 'facebook', url: 'https://facebook.com' },
		{ platform: 'twitter', url: 'https://twitter.com' },
		{ platform: 'vimeo', url: 'https://vimeo.com' },
		{ platform: 'linkedin', url: 'https://linkedin.com' },
		{ platform: 'github', url: 'https://github.com' },
		{ platform: 'instagram', url: 'https://instagram.com' },
		{ platform: 'tiktok', url: 'https://tiktok.com' },
		{ platform: 'youtube', url: 'https://youtube.com' },
	],
};

const hero: SbBlok = {
	component: 'hero',
	_uid: u('hero'),
	heading: 'Bespoke software\ndevelopment that enhances\nyour brand',
	eyebrow: '',
	ctas: [
		{ label: 'what we do', link: '/what-we-do', variant: 'primary', icon: 'arrow-right' },
		{ label: 'Contact us', link: '/contact', variant: 'outline' },
	],
	image: { filename: 'https://a.storyblok.com/f/293147646055661/4523685dc8/hero-pacman.png', alt: 'The Wirebox team at work in our studio' },
};

const intro: SbBlok = {
	component: 'intro',
	_uid: u('intro'),
	heading: 'Hire a web development agency that really gets your business_',
	body: "We're in your corner to keep things moving, help you understand how technology can enhance your operations and delight your customers with new features.",
	bullets: [
		{ text: 'Struggling with outdated systems?', color: 'var(--color-pink-vivid)' },
		{ text: 'Lacking tech support in-house?', color: 'var(--color-primary-blue)' },
		{ text: 'Not sure what you need?', color: 'var(--color-green-vivid)' },
		{ text: 'Need to keep costs down?', color: 'var(--color-primary-blue)' },
		{ text: 'Want bespoke software development?', color: 'var(--color-pink-vivid)' },
	],
	image: { filename: 'https://a.storyblok.com/f/293147646055661/cb65d1315f/intro-office.png', alt: 'Wirebox developers collaborating at their desks' },
};

const podcastBanner: SbBlok = {
	component: 'podcast_banner',
	_uid: u('podcast-banner'),
	eyebrow: 'New podcast episode available now →',
	title: 'Can one platform really run your entire business?',
	thumbnail: { filename: 'https://a.storyblok.com/f/293147646055661/7ee2fdb559/podcast-thumb.png', alt: '' },
	link: '/podcast',
};

const podcast: SbBlok = {
	component: 'podcast',
	_uid: u('podcast'),
	eyebrow: 'Our podcast · latest episode',
	heading: 'Can one platform really run your entire business?',
	description:
		'In this episode, Alex Carter (Lead Product Designer) sits down with Maria Honeycombe (Senior Backend Engineer) and Daniel Schmidt (Frontend Tech Lead) to talk about what it really takes to build scalable, maintainable software. From architecture decisions to day-to-day teamwork, they share practical insights from real projects.',
	tags: ['mobile development', 'api', 'AWS'],
	poster: { filename: 'https://a.storyblok.com/f/293147646055661/1b24882ab6/podcast-video.png', alt: '' },
	video_link: 'https://youtube.com',
};

const services: SbBlok = {
	component: 'services',
	_uid: u('services'),
	heading: 'Powering your success',
	intro:
		'We provide tailored solutions that help organisations operate smarter, grow faster, and connect more effectively with their audiences. From strategy and design to implementation and ongoing support, we deliver measurable results across every project.',
	categories: [
		{
			title: 'Strategy',
			items: [
				{ name: 'Digital Transformation', description: 'Guiding organisations through technology change to boost efficiency and growth.' },
				{ name: 'AWS Planning', description: 'Designing secure, scalable cloud strategies that fit your business goals.' },
				{ name: 'Research & Innovation', description: 'Exploring new ideas and technologies to keep you ahead of the curve.' },
				{ name: 'Discovery workshop', description: 'Defining challenges and opportunities together to shape the right solutions.' },
				{ name: 'Artificial Intelligence', description: 'Applying AI tools to automate processes and unlock smarter decision-making.' },
			],
		},
		{
			title: 'Digital Consultancy',
			items: [
				{ name: 'AWS Consultancy', description: 'Helping you harness the full potential of Amazon Web Services.' },
				{ name: 'Manage technology deployments', description: 'Ensuring smooth rollouts of new systems with minimal disruption.' },
				{ name: 'AWS Healthcheck', description: 'Assessing your cloud setup for performance, security, and cost efficiency.' },
			],
		},
		{
			title: 'CMS and ERP applications',
			items: [
				{ name: 'WordPress', description: "Building flexible websites on the world's most popular CMS." },
				{ name: 'Contentful', description: 'Powering omnichannel experiences with API-driven content platforms.' },
				{ name: 'WagTail', description: 'Creating user-friendly websites powered by a Python-based CMS.' },
				{ name: 'HeadLess CMS', description: 'Delivering content-first, headless CMS solutions for modern digital needs.' },
				{ name: 'SiteCore', description: 'Enterprise-level CMS solutions for complex, high-traffic websites.' },
				{ name: 'Odoo', description: 'Streamlining business processes with integrated ERP applications.' },
			],
		},
		{
			title: 'Application Development',
			items: [
				{ name: 'Web Development', description: 'Crafting responsive, accessible, and performance-driven websites.' },
				{ name: 'eCommerce', description: 'Building scalable online stores that convert and grow revenue.' },
				{ name: 'Laravel Development', description: 'Developing robust, secure applications with the Laravel framework.' },
				{ name: 'Database Development', description: 'Designing and optimising databases for speed, scale, and reliability.' },
				{ name: 'Mobile App Development', description: 'Creating intuitive apps for iOS and Android users.' },
				{ name: 'Bespoke Software Development', description: 'Tailoring custom applications to meet your unique business needs.' },
				{ name: 'Bespoke Booking System', description: 'Tailoring custom applications to meet your unique business needs.' },
			],
		},
		{
			title: 'Support and Maintenance',
			items: [
				{ name: 'Accessibility consulting', description: 'Ensuring your digital products are usable by everyone, including people with disabilities.' },
				{ name: 'Website & systems maintenance', description: 'Keeping your platforms secure, updated, and running smoothly.' },
				{ name: 'AWS Audits', description: 'Reviewing your cloud environment for compliance, optimisation, and risk management.' },
				{ name: 'Optimisation', description: 'Improving performance, speed, and user experience across your systems.' },
			],
		},
	],
};

const testimonials: SbBlok = {
	component: 'testimonials',
	_uid: u('testimonials'),
	heading: 'What our clients say_',
	items: [
		{ quote: 'Wirebox Ltd is very patient with us; they do their best to explain a ticket so we can understand what’s possible.', name: 'Shane Nye', role: 'IT Director, Solstice Systems' },
		{ quote: 'Despite the lack of a formal commitment from us, they always get the job done on time.', name: 'Ben Hallifax', role: 'HR Business Partner, Northgate Industries' },
		{ quote: 'They are friendly, competent, and most importantly, finish projects with the time frame agreed.', name: 'Melanie Pizzey', role: 'Operations Director, KPF LTD.' },
		{ quote: 'We have been using Wirebox now for a few months to help improve and maintain our website. The team are easy to deal with and have a great system for ensuring tasks are prioritised/completed on time. Would recommend to anyone!', name: 'Alexander Girvan', role: 'Client Services Lead, Orion Partners' },
		{ video: { filename: 'https://a.storyblok.com/f/293147646055661/36434ef311/testimonial-video.png' }, name: 'John Smith', role: 'Marketing Manager, Veritas Group' },
		{ quote: 'They understand our business well, so they’re able to put forward suggestions that help enhance our operations.', name: 'Jack Stubbs', role: 'Project Manager, Horizon Dynamics' },
		{ quote: 'Wirebox achieved more for our clients, faster, and at better rates than any other agency we have worked with.', name: 'Jacqueline Tarry', role: 'Finance Controller, Avelon Solutions' },
	],
};

const caseStudies: SbBlok = {
	component: 'case_studies',
	_uid: u('case-studies'),
	heading: 'Case studies_',
	items: [
		{
			title: 'Pennies',
			description: "Developing and supporting the Fintech's charity which has raised over 22 million for charities.",
			tags: ['API', 'App development', 'Charity', 'Django', 'Mobile development', 'mySQL', 'PostgreSQL', 'Python', 'Web development'],
			image: { filename: 'https://a.storyblok.com/f/293147646055661/dec4d28e2e/case-pennies.png' },
		},
		{
			title: 'Prindex',
			description: 'Enhancing Global Land Data with Wirebox',
			tags: ['API', 'CMS', 'Python', 'Wagtail', 'Website'],
			image: { filename: 'https://a.storyblok.com/f/293147646055661/df708cf869/case-prindex.png' },
		},
		{
			title: 'Motability Live Scheme',
			description: 'Building the digital experience for MSL events',
			tags: ['App development', 'Laravel Development', 'Database Development', 'WordPress development'],
			image: { filename: 'https://a.storyblok.com/f/293147646055661/115c9545ca/case-motability.png' },
		},
		{
			title: 'Kids Party Finder SEO Optimised',
			description: 'Development of an online Directory, SEO optimised, built in Laravel',
			tags: ['Digital', 'Google API'],
			image: { filename: 'https://a.storyblok.com/f/293147646055661/c298a0855b/case-kpf.png' },
		},
	],
};

const community: SbBlok = {
	component: 'community',
	_uid: u('community'),
	heading:
		'We’re a hard-working community of doers and dreamers, united by a love of tech and a desire to do things differently_',
	body: "Since 2005, our web development agency has been creating engaging online experiences for incredible brands. We combine the build skills of a web development agency and the instincts of a digital marketing firm into a full-service tech design concept you can rely on. Lean on our expertise to achieve your goals. Whether you're looking for new capabilities, outsourcing management of your existing tech stack or innovating something completely new; Wirebox is here to help.",
	cta_label: 'view all work',
	cta_link: '/our-work',
	images: [
		{ filename: 'https://a.storyblok.com/f/293147646055661/65bf3ecadb/community-1.png', alt: 'Wirebox team in a meeting room' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/4ac7363c64/community-2.png', alt: 'Developers working at their desks' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/5fdef43245/community-3.png', alt: 'A team member presenting at a whiteboard' },
	],
};

const brands: SbBlok = {
	component: 'brands',
	_uid: u('brands'),
	heading: 'Great brands and great clients_',
	logos: [
		{ filename: 'https://a.storyblok.com/f/293147646055661/748d18982a/bulgin.png', alt: 'Bulgin' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/72d1d1bc59/mrclutch.png', alt: 'Mr Clutch Autocentres' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/896d454416/sas.png', alt: 'SAS' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/399e93cb76/pennies.png', alt: 'Pennies — the digital charity box' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/104d6e867e/kidney-care.png', alt: 'Kidney Care UK' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/6ee28981f4/middlesex.png', alt: 'Middlesex University London' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/66e39fe1a3/commonwealth.png', alt: 'The Commonwealth' },
	],
};

const winningFormula: SbBlok = {
	component: 'winning_formula',
	_uid: u('winning-formula'),
	heading: 'Our winning formula_',
	intro:
		'Over the years, we’ve distilled the web development agency process down to a few key steps guaranteed to create successful digital interventions.',
	steps: [
		{ label: 'Discover', text: 'We listen and learn to properly understand your business.' },
		{ label: 'Analyse', text: 'We evaluate everything you’ve shared to propose an effective solution.' },
		{ label: 'Define', text: 'We break that solution into actionable steps so everyone can get on board.' },
		{ label: 'Develop', text: 'We start creating; keeping your goals in mind at all times.' },
		{ label: 'Test', text: 'We kick the tyres to make sure everything works perfectly.' },
		{ label: 'Deliver', text: 'We roll out your new digital environment and train your teams.' },
		{ label: 'Maintain', text: 'We keep everything working perfectly and optimise for your success.' },
	],
	form_heading: 'Do you have a project in mind?',
	cta_label: 'view all services',
	cta_link: '/services',
};

const blog: SbBlok = {
	component: 'blog',
	_uid: u('blog'),
	heading: 'What’s going on in our world_',
	posts: [
		{ title: 'Emerging tech trends to help you to run your business more effectively_', date: '19 Nov 2021', read_time: '10 min read', image: { filename: 'https://a.storyblok.com/f/293147646055661/f708021be2/blog-1.png' }, link: '/blog/emerging-tech-trends' },
		{ title: 'The difference between native & hybrid apps – from a development perspective_', date: '10 Sep 2021', read_time: '10 min read', image: { filename: 'https://a.storyblok.com/f/293147646055661/f228842041/blog-2.png' }, link: '/blog/native-vs-hybrid' },
		{ title: 'Preparing your business for an ERP implementation', date: '9 June 2021', read_time: '10 min read', video: true, link: '/blog/erp-implementation' },
	],
	cta_label: 'view all posts',
	cta_link: '/blog',
};

const awards: SbBlok = {
	component: 'awards',
	_uid: u('awards'),
	heading: 'Awards and ratings_',
	intro: 'We have worked over 1000 happy clients and ratings on Google over 4.5',
	badges: [
		{ filename: 'https://a.storyblok.com/f/293147646055661/c568c68780/clutch-reviews.svg', alt: 'Reviewed on Clutch' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/f453538fd5/google.svg', alt: 'Google Rating 4.9 based on 61 reviews' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/21d5b6561a/biz4biz.png', alt: 'biz4Biz Awards 2023 Winner' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/ee403ac740/sme.png', alt: 'SME Hertfordshire Business Awards 2024' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/ca9658e63b/gbc.svg', alt: 'Good Business Charter Accredited' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/b53145ded4/disability.svg', alt: 'Disability Confident Employer' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/2a61e4d2aa/meta.svg', alt: 'Meta Business Partner' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/d1466912ef/clutch-cambridge.svg', alt: 'Clutch Top Laravel Developers, Cambridge 2025' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/522456fd62/clutch-web.svg', alt: 'Clutch Top Web Developers' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/72fdfe4eef/certification.png', alt: 'Certified Laravel Company' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/2310eddeaa/watford.png', alt: 'Watford Business Pledge Member' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/fa49031603/wpengine.svg', alt: 'WP Engine Agency Partner' },
	],
	maps: [
		{ filename: 'https://a.storyblok.com/f/293147646055661/9ad800e8c0/map-1.png', alt: 'Map of the Milton Keynes studio location' },
		{ filename: 'https://a.storyblok.com/f/293147646055661/c6c18caced/map-2.png', alt: 'Map of the Watford office location' },
	],
};

const footer: SbBlok = {
	component: 'footer',
	_uid: u('footer'),
};

export const homeContent: SbBlok = {
	component: 'page',
	_uid: u('page'),
	body: [header, hero, podcastBanner, intro, podcast, services, testimonials, caseStudies, community, brands, winningFormula, blog, awards, footer],
};

export function getHomeContent(): SbBlok {
	return homeContent;
}
