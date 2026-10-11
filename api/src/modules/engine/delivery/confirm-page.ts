/** Labels come from the URL, so only plain words are ever echoed back. */
const SAFE_WORD = /^[a-z_]{1,32}$/;

export const isSafeAction = (action: string) => SAFE_WORD.test(action);

/**
 * Opening an approval link shows this button instead of answering, so link
 * previews in email and chat apps never approve anything by themselves.
 */
export function confirmPage(action: string) {
  const label = action.charAt(0).toUpperCase() + action.slice(1);
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relay</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0}
button{font:inherit;font-size:1.25rem;padding:.75rem 2rem;border-radius:.75rem;border:0;background:#2563eb;color:#fff;cursor:pointer}</style>
</head><body><form method="post"><button type="submit">${label}</button></form></body></html>`;
}

export function answerPage(message: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Relay</title></head>
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0">
<p>${message}</p></body></html>`;
}
