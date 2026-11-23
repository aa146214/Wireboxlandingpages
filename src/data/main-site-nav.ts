/**
 * Navigation of the main wirebox.co.uk site (WordPress), copied from its header
 * and footer so pages that replicate the main site (e.g. /privacy-policy) link
 * to the same places. Links are absolute because the pages live on wirebox.co.uk.
 */
export const MAIN_SITE = 'https://wirebox.co.uk';

export interface MainNavLink {
	label: string;
	href: string;
}
export interface MainNavGroup {
	/** A collapsible group inside a drawer ("strategy", "technology build"). */
	label: string;
	children: MainNavLink[];
}
export type MainNavEntry = MainNavLink | MainNavGroup;
export interface MainNavItem {
	label: string;
	/** Plain link … */
	href?: string;
	/** … or a slide-out drawer of links. */
	drawer?: MainNavEntry[];
}

const u = (path: string) => `${MAIN_SITE}${path}`;

export const MAIN_NAV: MainNavItem[] = [
	{ label: 'home', href: u('/') },
	{
		label: 'what we do',
		drawer: [
			{ label: 'overview', href: u('/what-we-do/') },
			{
				label: 'strategy',
				children: [
					{ label: 'overview', href: u('/what-we-do/strategy/') },
					{ label: 'Workshop Discovery', href: u('/workshop-discovery/') },
				],
			},
			{ label: 'technology consulting', href: u('/what-we-do/technology-consulting/') },
			{
				label: 'technology build',
				children: [
					{ label: 'overview', href: u('/what-we-do/technology-build/') },
					{ label: 'AWS Consultancy', href: u('/what-we-do/technology-build/aws-consultancy/') },
					{ label: 'bespoke software development', href: u('/what-we-do/technology-build/software-development-london/') },
					{ label: 'CMS development', href: u('/what-we-do/technology-build/cms-development_/') },
					{ label: 'database development', href: u('/what-we-do/technology-build/database-development/') },
					{ label: 'e-commerce development', href: u('/what-we-do/technology-build/e-commerce-development/') },
					{ label: 'laravel certified development agency', href: u('/laravel-development-agency/') },
					{ label: 'mobile app development', href: u('/what-we-do/technology-build/mobile-app-development/') },
					{ label: 'odoo development', href: u('/what-we-do/technology-build/odoo-development/') },
					{ label: 'Sitecore', href: u('/sitecore/') },
					{ label: 'Support and Maintenance', href: u('/website-support-and-maintenance/') },
					{ label: 'WordPress', href: u('/wordpress/') },
					{ label: 'Wagtail development', href: u('/wagtail-development/') },
				],
			},
		],
	},
	{ label: 'our process', href: u('/our-process/') },
	{
		label: 'our work',
		drawer: [
			{ label: 'overview', href: u('/our-work/') },
			{ label: 'our clients', href: u('/clients/') },
			{ label: 'automotive sector', href: u('/automotive/') },
			{ label: 'charity sector', href: u('/charity/') },
			{ label: 'educational sector', href: u('/education/') },
			{ label: 'legal Sector', href: u('/legal/') },
		],
	},
	{ label: 'blog', href: u('/blog') },
	{
		label: 'about us',
		drawer: [
			{ label: 'overview', href: u('/about-us/') },
			{ label: 'careers', href: u('/careers/#senior-laravel-php-web-developer/') },
			{ label: 'charity work', href: u('/charity-work/') },
			{ label: 'social feed', href: u('/social-feed/') },
			{ label: 'testimonials', href: u('/testimonials/') },
			{ label: 'our awards and nominations', href: u('/our-awards-and-nominations/') },
		],
	},
	{
		label: 'events',
		drawer: [
			{ label: 'code at school', href: u('/code-at-school/') },
			{ label: 'picture this: artificial intelligence', href: u('/picture-this-ai-thought-leadership/') },
			{ label: 'picture this: behind your brand', href: u('/picture-this-behind-your-brand/') },
			{ label: 'picture this: brand narrative', href: u('/picture-this-brand-narrative/') },
		],
	},
];

export const MAIN_CONTACT_URL = u('/contact-us/');

/** Social links, in the order (and with the icon-font classes) the main site uses. */
export const MAIN_SOCIALS = [
	{ label: 'Facebook', href: 'https://facebook.com/WireboxConsultancy/', icon: 'icon-facebook-squared' },
	{ label: 'X', href: 'https://x.com/wirebox', icon: 'icon-twitter-x-squared' },
	{ label: 'Vimeo', href: 'https://vimeo.com/wirebox', icon: 'icon-vimeo-squared' },
	{ label: 'LinkedIn', href: 'https://www.linkedin.com/company/wirebox-consultancy', icon: 'icon-linkedin-squared' },
	{ label: 'GitHub', href: 'https://github.com/Wirebox', icon: 'icon-github-circled' },
	{ label: 'Instagram', href: 'https://www.instagram.com/wireboxuk', icon: 'icon-instagram' },
];

export const MAIN_FOOTER_LEGAL: MainNavLink[] = [
	{ label: 'Terms and Conditions', href: u('/terms-and-conditions/') },
	{ label: 'Privacy Policy', href: '/privacy-policy' },
	{ label: 'Equal opportunities and discrimination policy', href: u('/equal-opportunities-and-discrimination-policy/') },
	{ label: 'Environmental Policy', href: u('/environmental-policy/') },
	{ label: 'Modern Slavery Statement', href: u('/modern-slavery-statement/') },
	{ label: 'GBC Accreditation', href: u('/gbc-accreditation/') },
	{ label: 'Careers', href: u('/careers/') },
	{ label: 'Site Map', href: u('/sitemap/') },
];

export const MAIN_FOOTER_LINKS: MainNavLink[] = [
	{ label: 'Our Partners', href: u('/our-partners/') },
	{ label: 'About Us', href: u('/about-us/') },
	{ label: 'Contact Us', href: u('/contact-us/') },
];

export const MAIN_FOOTER_SERVICES: MainNavLink[] = [
	{ label: 'AWS Consultancy', href: u('/what-we-do/technology-build/aws-consultancy/') },
	{ label: 'Database Development', href: u('/what-we-do/technology-build/database-development/') },
	{ label: 'Laravel Development Agency', href: u('/Laravel-development-agency/') },
];
