/**
 * Turn the Storyblok `main_site_header` / `main_site_footer` bloks into what the
 * main-site chrome components render. Every field falls back to the defaults in
 * src/data/main-site-nav.ts when it is missing, so the page still renders if
 * Storyblok is unreachable. An explicitly empty list is honoured (renders none).
 */
import {
	MAIN_NAV,
	MAIN_CONTACT_URL,
	MAIN_SITE,
	MAIN_SOCIAL_ICONS,
	MAIN_SOCIAL_LINKS,
	MAIN_OFFICES,
	MAIN_CREDENTIALS,
	MAIN_FOOTER_LINKS,
	MAIN_FOOTER_SERVICES,
	MAIN_FOOTER_LEGAL,
	MAIN_FOOTER_TEXT,
	type MainNavItem,
	type MainNavLink,
	type MainNavEntry,
	type MainOffice,
	type MainCredential,
} from '../data/main-site-nav';

type Blok = Record<string, any> | undefined | null;
const str = (v: unknown, d: string) => (typeof v === 'string' && v.trim() ? v : d);
const list = <T>(v: unknown, map: (b: any) => T, d: T[]): T[] => (Array.isArray(v) ? v.map(map) : d);

const link = (b: any): MainNavLink => ({ label: b?.label || '', href: b?.link || '#' });

export interface MainSocial {
	href: string;
	label: string;
	icon: string;
}
const social = (b: any): MainSocial => {
	const meta = MAIN_SOCIAL_ICONS[b?.platform] || MAIN_SOCIAL_ICONS.facebook;
	return { href: b?.url || '#', label: meta.label, icon: meta.icon };
};
const DEFAULT_SOCIALS = MAIN_SOCIAL_LINKS.map(social);

const navEntry = (b: any): MainNavEntry =>
	b?.component === 'main_nav_group' ? { label: b.label || '', children: list(b.links, link, []) } : link(b);
const navItem = (b: any): MainNavItem => {
	const items = Array.isArray(b?.items) ? b.items : [];
	return items.length ? { label: b.label || '', drawer: items.map(navEntry) } : { label: b?.label || '', href: b?.link || '#' };
};

export function mainHeader(blok: Blok) {
	return {
		logo: blok?.logo?.filename || '/logo-wirebox-white.svg',
		logoAlt: blok?.logo?.alt || 'Wirebox',
		homeHref: str(blok?.logo_link, MAIN_SITE),
		nav: list(blok?.nav, navItem, MAIN_NAV),
		contactLabel: str(blok?.contact_label, 'contact'),
		contactHref: str(blok?.contact_link, MAIN_CONTACT_URL),
		socials: list(blok?.socials, social, DEFAULT_SOCIALS),
	};
}

const office = (b: any): MainOffice => ({
	name: b?.name || '',
	address: b?.address || '',
	phone: b?.phone || '',
	email: b?.email || '',
	tone: b?.tone === 'yellow' ? 'yellow' : 'green',
});
const credential = (b: any): MainCredential => ({
	src: b?.image?.filename || '',
	alt: b?.image?.alt || '',
	link: b?.link || undefined,
});

export function mainFooter(blok: Blok) {
	const T = MAIN_FOOTER_TEXT;
	return {
		formHeading: str(blok?.form_heading, T.formHeading),
		formButton: str(blok?.form_button_label, T.formButton),
		contactHeading: str(blok?.contact_heading, T.contactHeading),
		offices: list(blok?.offices, office, MAIN_OFFICES),
		socials: list(blok?.socials, social, DEFAULT_SOCIALS),
		credentialsHeading: str(blok?.credentials_heading, T.credentialsHeading),
		credentials: list(blok?.credentials, credential, MAIN_CREDENTIALS).filter((c) => c.src),
		links: list(blok?.links, link, MAIN_FOOTER_LINKS),
		servicesHeading: str(blok?.services_heading, T.servicesHeading),
		services: list(blok?.services, link, MAIN_FOOTER_SERVICES),
		legal: list(blok?.legal_links, link, MAIN_FOOTER_LEGAL),
		copyright: str(blok?.copyright, T.copyright),
	};
}

/** tel: href from a display number like "+44 (0) 207 993 5485". */
export const telHref = (n: string) => 'tel:' + n.replace(/\(0\)/, '').replace(/[^\d+]/g, '');
