/**
 * Third-party analytics identifiers.
 *
 * The snippets themselves are managed in Storyblok ("Site settings" story) and
 * fall back to src/data/site-scripts.mjs, which is where these ids now live.
 * Re-exported here so existing imports keep working.
 */
export { GTM_ID, CRAZY_EGG_SRC, CAPTIWATE_SITE_ID } from '../data/site-scripts.mjs';

/** Where the cookie notice's "privacy policy" link points. */
export const PRIVACY_URL = 'https://wirebox.co.uk/privacy-policy/';
