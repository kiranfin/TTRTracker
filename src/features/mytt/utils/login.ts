export const MYTT_BASE_URL = 'https://www.mytischtennis.de';

// /login leitet ohne Session auf "/?status=unauthenticated" um. Dort ist der Login ein Dialog auf der Startseite,
// das Formular schickt per POST an /login und danach geht es auf die Zielseite (z. B. /community).
export const MYTT_LOGIN_URL = `${MYTT_BASE_URL}/login?next=%2F`;

// Der modale Login Dialog setzt pointer-events: none auf den body, das Cookie Banner erbt es und lässt sich nicht
// antippen. Das Banner wird wieder bedienbar gemacht, die Entscheidung bleibt beim Nutzer.
// Ein MutationObserver stellt den Style wieder her, falls die Seite beim Aufbau den head ersetzt.
export const CONSENT_BANNER_FIX_SCRIPT = `
(function () {
  var css = '#cmpbox, #cmpbox *, #cmpwrapper, #cmpwrapper * { pointer-events: auto !important; }';
  function ensure() {
    if (document.getElementById('tt-cmp-fix')) return;
    var style = document.createElement('style');
    style.id = 'tt-cmp-fix';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }
  ensure();
  new MutationObserver(ensure).observe(document.documentElement, { childList: true, subtree: true });
})();
true;
`;

// Auf diesen Seiten ist man noch nicht eingeloggt, auch wenn man den Login schon verlassen hat.
const AUTH_PATH_PREFIXES = ['/login', '/register', '/registrierung', '/passwort', '/password', '/forgot'];

type CookieValue = {
  name?: string;
  value?: string;
};

export function cookiesToHeader(cookies: Record<string, CookieValue>) {
  return Object.entries(cookies)
      .filter(([, cookie]) => cookie?.value)
      .map(([key, cookie]) => `${cookie.name || key}=${cookie.value}`)
      .join('; ');
}

// Pfad der URL, wenn sie zu myTischtennis gehört, sonst null (z. B. Weiterleitung auf einen Login Anbieter).
export function getMyttPath(url: string) {
  const match = /^https?:\/\/(?:www\.)?mytischtennis\.de(\/[^?#]*)?/i.exec(url);

  if (!match) return null;

  return (match[1] ?? '/').toLowerCase();
}

// Die Startseite mit diesem Status zeigt den Login Dialog.
export function hasUnauthenticatedStatus(url: string) {
  return /[?&]status=unauthenticated(?:&|#|$)/i.test(url);
}

export function isAuthPath(path: string) {
  return AUTH_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}-`));
}
