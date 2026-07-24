/**
 * Progressive enhancement for the lead-capture forms (hero + CTA).
 * Without JS the forms still POST to /api/lead and get a redirect/HTML reply;
 * with JS we submit in the background and show an inline status instead.
 */
function initLeadForms() {
	const forms = document.querySelectorAll<HTMLFormElement>('form[data-lead]');
	forms.forEach((form) => {
		const status = form.querySelector<HTMLElement>('[data-lead-status]');
		const submit = form.querySelector<HTMLButtonElement>('button[type="submit"], [type="submit"]');

		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			const pageField = form.querySelector<HTMLInputElement>('input[name="page"]');
			if (pageField) pageField.value = location.pathname;

			const setStatus = (msg: string, kind: 'ok' | 'error' | '') => {
				if (!status) return;
				status.textContent = msg;
				status.dataset.state = kind;
			};

			if (submit) submit.disabled = true;
			setStatus('Sending…', '');

			try {
				const res = await fetch(form.action, {
					method: 'POST',
					headers: { Accept: 'application/json' },
					body: new FormData(form),
				});
				const data = await res.json().catch(() => ({ ok: res.ok }));
				if (res.ok && data.ok) {
					// GA4 form_success event via GTM dataLayer — tagged hero vs cta
					// by the form's hidden `source` field.
					const sourceInput = form.querySelector<HTMLInputElement>('input[name="source"]');
					const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
					w.dataLayer = w.dataLayer || [];
					w.dataLayer.push({ event: 'form_success', formSource: sourceInput?.value ?? '' });

					form.reset();
					setStatus("Thanks — we'll be in touch within 1 business day.", 'ok');
					const fields = form.querySelector<HTMLElement>('[data-lead-fields]');
					if (fields) fields.hidden = true;
				} else {
					setStatus(data.error || 'Something went wrong. Please try again.', 'error');
					if (submit) submit.disabled = false;
				}
			} catch {
				setStatus('Network error. Please try again.', 'error');
				if (submit) submit.disabled = false;
			}
		});
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initLeadForms);
} else {
	initLeadForms();
}
