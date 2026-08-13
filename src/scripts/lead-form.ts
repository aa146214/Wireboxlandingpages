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
					// Hand off to the /thankyou page. Google Ads counts a conversion on
					// that page's load, so this has to be a real navigation — a hash
					// change or inline message gives its tag nothing to fire on.
					//
					// The hero/cta distinction rides in sessionStorage rather than a
					// query string so the landing URL stays exactly "/thankyou" for the
					// conversion rule; /thankyou reads it and fires form_success there,
					// where the event can't be cut short by the navigation.
					const sourceInput = form.querySelector<HTMLInputElement>('input[name="source"]');
					try {
						sessionStorage.setItem('wb-form-source', sourceInput?.value ?? '');
					} catch {
						/* private mode — the page just reports an empty source */
					}

					form.reset();
					setStatus('Thanks — redirecting…', 'ok');
					window.location.assign('/thankyou');
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
