import type { APIRoute } from 'astro';

export const prerender = false;

/** Read a runtime env var (Vercel populates process.env for the SSR function). */
const env = (k: string): string | undefined =>
	(typeof process !== 'undefined' ? process.env[k] : undefined) ??
	(import.meta.env as Record<string, string | undefined>)[k];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SOURCES: Record<string, string> = {
	hero: 'Hero — "Get your free site review"',
	cta: 'CTA — "Get My Free Review"',
};

interface SendResult {
	ok: boolean;
	error?: string;
	status?: number;
}

/**
 * Deliver the enquiry email. Isolated so the provider can be swapped without
 * touching the route. Currently uses the Mailgun HTTP API (no SDK needed).
 */
async function sendLeadEmail(fields: Record<string, string>): Promise<SendResult> {
	const apiKey = env('MAILGUN_API_KEY');
	const domain = env('MAILGUN_DOMAIN');
	const to = env('LEAD_EMAIL_TO') || 'hello@wirebox.co.uk';
	const from = env('LEAD_EMAIL_FROM') || (domain ? `Wirebox Website <postmaster@${domain}>` : '');
	const region = (env('MAILGUN_REGION') || 'us').toLowerCase();

	if (!apiKey || !domain) {
		return { ok: false, status: 500, error: 'Email service is not configured.' };
	}

	const source = SOURCES[fields.source] || 'Website form';
	const lines = [
		'New website support enquiry',
		'',
		`Source:  ${source}`,
		fields.name ? `Name:    ${fields.name}` : null,
		`Email:   ${fields.email}`,
		fields.phone ? `Phone:   ${fields.phone}` : null,
		fields.page ? `Page:    ${fields.page}` : null,
	].filter(Boolean);

	const body = new URLSearchParams();
	body.set('from', from);
	body.set('to', to);
	body.set('h:Reply-To', fields.email);
	body.set('subject', `New site review request — ${source}`);
	body.set('text', lines.join('\n'));

	const base = region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
	const auth = Buffer.from(`api:${apiKey}`).toString('base64');

	try {
		const res = await fetch(`${base}/v3/${domain}/messages`, {
			method: 'POST',
			headers: { Authorization: `Basic ${auth}` },
			body,
		});
		if (!res.ok) {
			console.error('[lead] Mailgun error', res.status, await res.text());
			return { ok: false, status: 502, error: 'We could not send your request. Please try again.' };
		}
		return { ok: true };
	} catch (err) {
		console.error('[lead] Mailgun request failed', err);
		return { ok: false, status: 502, error: 'We could not send your request. Please try again.' };
	}
}

export const POST: APIRoute = async ({ request }) => {
	const ct = request.headers.get('content-type') || '';
	const wantsJson = (request.headers.get('accept') || '').includes('application/json');

	const fields: Record<string, string> = {};
	try {
		if (ct.includes('application/json')) {
			Object.assign(fields, await request.json());
		} else {
			const fd = await request.formData();
			fd.forEach((v, k) => (fields[k] = String(v)));
		}
	} catch {
		return reply(false, 'Invalid request.', 400, wantsJson, request);
	}

	// Honeypot: real users never fill this hidden field.
	if (fields.company) return reply(true, '', 200, wantsJson, request);

	const email = (fields.email || '').trim();
	if (!EMAIL_RE.test(email)) {
		return reply(false, 'Please enter a valid email address.', 422, wantsJson, request);
	}
	fields.email = email;

	const result = await sendLeadEmail(fields);
	if (!result.ok) return reply(false, result.error ?? 'Something went wrong.', result.status ?? 500, wantsJson, request);
	return reply(true, '', 200, wantsJson, request);
};

/** JSON for fetch callers; a simple HTML page / redirect for no-JS form posts. */
function reply(ok: boolean, error: string, status: number, wantsJson: boolean, request: Request) {
	if (wantsJson) {
		return new Response(JSON.stringify(ok ? { ok } : { ok, error }), {
			status,
			headers: { 'content-type': 'application/json' },
		});
	}
	const origin = new URL(request.url).origin;
	if (ok) {
		return new Response(null, { status: 303, headers: { Location: `${origin}/?submitted=1#contact` } });
	}
	const html = `<!doctype html><meta charset="utf-8"><title>Wirebox</title><body style="font-family:system-ui;max-width:40rem;margin:4rem auto;padding:0 1.5rem"><h1>Sorry — that didn't go through</h1><p>${error}</p><p><a href="${origin}/#contact">Go back and try again</a></p></body>`;
	return new Response(html, { status, headers: { 'content-type': 'text/html' } });
}
