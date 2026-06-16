import { defineConfig } from 'astro/config';
import { storyblok } from '@storyblok/astro';
import { loadEnv } from 'vite';

import vercel from '@astrojs/vercel';
import netlify from '@astrojs/netlify';

const env = loadEnv(import.meta.env.MODE, process.cwd(), '');
const {
	NETLIFY,
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
				hero: 'storyblok/Hero',
				podcast_banner: 'storyblok/PodcastBanner',
				intro: 'storyblok/Intro',
				podcast: 'storyblok/Podcast',
				services: 'storyblok/Services',
				testimonials: 'storyblok/Testimonials',
				case_studies: 'storyblok/CaseStudies',
				community: 'storyblok/Community',
				brands: 'storyblok/Brands',
				winning_formula: 'storyblok/WinningFormula',
				blog: 'storyblok/Blog',
				awards: 'storyblok/Awards',
				footer: 'storyblok/Footer',
			},
		}),
	],
	output: 'server',
	adapter: NETLIFY ? netlify() : vercel(),
});
