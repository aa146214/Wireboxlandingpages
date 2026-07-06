import { defineConfig } from 'astro/config';
import { storyblok } from '@storyblok/astro';
import { loadEnv } from 'vite';

import vercel from '@astrojs/vercel';

const env = loadEnv(import.meta.env.MODE, process.cwd(), '');
const {
	STORYBLOK_DELIVERY_API_TOKEN,
	STORYBLOK_API_BASE_URL,
	STORYBLOK_REGION,
} = env;

export default defineConfig({
	site: 'https://wirebox-two.vercel.app',
	devToolbar: {
		enabled: false,
	},
	integrations: [
		storyblok({
			accessToken: STORYBLOK_DELIVERY_API_TOKEN,
			apiOptions: {
				/** Set the correct region for your space. Learn more: https://www.storyblok.com/docs/packages/storyblok-js#example-region-parameter */
				region: STORYBLOK_REGION || 'eu',
				/** The following code is only required when creating a Storyblok space directly via the Blueprints feature. */
				endpoint: STORYBLOK_API_BASE_URL
					? `${new URL(STORYBLOK_API_BASE_URL).origin}/v2`
					: undefined,
			},
			components: {
				page: 'storyblok/Page',
				header: 'storyblok/Header',
				footer: 'storyblok/Footer',
				testimonials: 'storyblok/Testimonials',
				// --- Website-support landing page ---
				support_hero: 'storyblok/SupportHero',
				trust_bar: 'storyblok/TrustBar',
				risk_stats: 'storyblok/RiskStats',
				value_props: 'storyblok/ValueProps',
				sla_tiers: 'storyblok/SlaTiers',
				pricing: 'storyblok/Pricing',
				support_cases: 'storyblok/SupportCases',
				faq: 'storyblok/Faq',
				cta_contact: 'storyblok/CtaContact',
				locations: 'storyblok/Locations',
				// --- Legacy marketing landing page (kept for other stories) ---
				hero: 'storyblok/Hero',
				podcast_banner: 'storyblok/PodcastBanner',
				intro: 'storyblok/Intro',
				podcast: 'storyblok/Podcast',
				services: 'storyblok/Services',
				case_studies: 'storyblok/CaseStudies',
				community: 'storyblok/Community',
				brands: 'storyblok/Brands',
				winning_formula: 'storyblok/WinningFormula',
				blog: 'storyblok/Blog',
				awards: 'storyblok/Awards',
			},
		}),
	],
	output: 'server',
	adapter: vercel(),
});
