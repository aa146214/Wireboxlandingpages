import { useStoryblokApi } from '@storyblok/astro';
import { DEFAULT_SITE_SCRIPTS } from '../data/site-scripts.mjs';

export type Placement = 'head' | 'body_start' | 'body_end';

export interface SiteScript {
	name: string;
	placement: Placement;
	code: string;
	enabled?: boolean;
}

/**
 * The third-party scripts to inject, from the "Site settings" story.
 *
 * If the story exists it is authoritative — an editor who disables or removes
 * every script gets a page with none. Only when it can't be fetched at all
 * (unpublished, network, bad token) do we fall back to the bundled defaults,
 * so an outage never silently drops analytics.
 */
export async function loadSiteScripts(): Promise<{ scripts: SiteScript[]; source: 'storyblok' | 'defaults' }> {
	try {
		const api = useStoryblokApi();
		// `cv: Date.now()` — always the latest published version, same as the pages.
		const { data } = await api.get('cdn/stories/settings', { version: 'published', cv: Date.now() });
		const list = data?.story?.content?.scripts;
		if (Array.isArray(list)) return { scripts: list as SiteScript[], source: 'storyblok' };
	} catch (err) {
		console.warn('[site-scripts] settings story unavailable — using bundled defaults:', (err as Error).message);
	}
	return { scripts: DEFAULT_SITE_SCRIPTS as SiteScript[], source: 'defaults' };
}
