/**
 * Progressive enhancement for the contact form: submits with fetch and shows an inline
 * confirmation. All visitor-facing text comes from data-* attributes on the form.
 * Nothing is stored in the browser. If the request cannot be confirmed, the form falls back
 * to a normal HTML POST so no enquiry is lost (see the backend contract in docs/WEBSITE_PLAN.md).
 */
const form = document.querySelector<HTMLFormElement>('form[data-contact-form]');

if (form && typeof window.fetch === 'function') {
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  const fields = form.querySelector<HTMLElement>('[data-form-fields]');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const buttonText = button?.textContent ?? '';
  let pending = false;

  const fallBackToHtmlPost = () => {
    if (button) {
      button.disabled = false;
      button.textContent = buttonText;
    }
    // HTMLFormElement.submit() skips this listener and does the plain POST + 303 flow.
    form.submit();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending) return;
    pending = true;
    if (button) {
      button.disabled = true;
      button.textContent = form.dataset.msgSending ?? buttonText;
    }

    const body = new URLSearchParams();
    for (const [key, value] of new FormData(form)) body.append(key, String(value));

    let accepted = false;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body,
        headers: { Accept: 'application/json' },
        mode: 'cors',
        credentials: 'omit',
        redirect: 'manual',
      });
      // A JSON 2xx, or the 303 meant for no-JS visitors, both mean the backend accepted it.
      accepted = response.ok || response.type === 'opaqueredirect';
    } catch {
      accepted = false;
    }

    if (!accepted) {
      fallBackToHtmlPost();
      return;
    }

    form.reset();
    if (fields) fields.hidden = true;
    if (status) {
      const title = document.createElement('p');
      title.className = 'text-lg font-semibold text-slate-900';
      title.textContent = form.dataset.msgSuccessTitle ?? '';
      const text = document.createElement('p');
      text.className = 'mt-1 text-slate-700';
      text.textContent = form.dataset.msgSuccessBody ?? '';
      status.replaceChildren(title, text);
      status.focus();
    }
  });
}
