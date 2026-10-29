export const MYTT_BASE_URL = 'https://www.mytischtennis.de';

// Der Flow startet direkt auf der Login-Seite. Muss gegen den echten Login-Redirect geprüft werden (Phase 0, Punkt 4).
export const MYTT_LOGIN_URL = `${MYTT_BASE_URL}/login?next=%2F`;

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

export function isAuthPath(path: string) {
  return AUTH_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}-`));
}
