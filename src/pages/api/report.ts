import type { APIRoute } from "astro";
import { requestReport } from "../../lib/report";
import fillPlaceholders from "../../scripts/form-placeholder";

export const prerender = false;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const URL_RE = /https?:\/\/.+/

function text(fields: Record<string, unknown>, field: string): string {
	return typeof fields[field] === "string" ? fields[field].trim() : "";
}

export const POST: APIRoute = async ({ request }) => {
	const fields: Record<string, unknown> = {};

	try {
		const fd = await request.formData();
		fd.forEach((v, k) => fields[k] = String(v));
	} catch {
		return reply({ ok: false, error: "Invalid request.", status: 400, request });
	}

	if (text(fields, "company")) return reply({ ok: true, status: 200, request });

	const email = text(fields, "email");
	if (!EMAIL_RE.test(email)) return reply({ ok: false, error: "Please enter a valid email address.", status: 400, request });

	const url = text(fields, "url");
	if (!URL_RE.test(url)) return reply({ ok: false, error: "Please enter a valid URL (start with https://...).", status: 400, request });

	const result = await requestReport({ email, url });
	if (result === "fail") return reply({ ok: false, error: "Something went wrong. Why not get in [[contact]] for fast, personalised help?", status: 500, request });
	if (result === "already-generated") return reply({ ok: false, error: "You've already used the automatic SEO report. Why not get in [[contact]] for fast, personalised help?", status: 400, request });

	return reply({ ok: true, status: 200, request });
};

type ReplyParameters = { ok: boolean, error?: string, status: number, request: Request };
function reply({ ok, error, status, request }: ReplyParameters) {
	const json = (request.headers.get("accept") || "").includes("application/json");

	if (json) {
		return new Response(JSON.stringify(ok ? { ok } : { ok, error }), {
			status,
			headers: { "content-type": "application/json" },
		});
	}
	const origin = new URL(request.url).origin;
	if (ok) {
		return new Response(null, { status: 303, headers: { Location: `${origin}/?submitted=1#contact` } });
	} else {
		const html = `<!doctype html><meta charset="utf-8"><title>Wirebox</title><body style="font-family:system-ui;max-width:40rem;margin:4rem auto;padding:0 1.5rem"><h1>Sorry — that didn"t go through</h1><p>${fillPlaceholders(error ?? 'Unknown error')}</p><p><a href="${origin}/#contact">Go back and try again</a></p></body>`;
		return new Response(html, { status, headers: { "content-type": "text/html" } });
	}
}
