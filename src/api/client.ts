import { getAccessToken } from '../storage/authToken';
import { ensureApiTargetLoaded, getApiBaseUrlForTarget, getApiTarget } from './apiTarget';
import { cachedGet } from './responseCache';

export { clearApiCache, invalidateApiCache } from './responseCache';

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  // Bei einem 429: so lange bittet das Backend zu warten.
  retryAfterSeconds?: number;

  constructor(message: string, status?: number, code?: string, details?: unknown, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string | number | undefined>;
  body?: unknown;
  authenticated?: boolean;
};

type ApiGetOptions = {
  authenticated?: boolean;
  // false schaltet den Zwischenspeicher für diesen Aufruf ab.
  cache?: boolean;
};

function extractError(data: unknown, fallback: string) {
  const value = data as any;

  return {
    message:
        value?.error?.message ||
        value?.message ||
        value?.data?.error?.message ||
        fallback,
    code:
        value?.error?.code ||
        value?.code ||
        value?.data?.error?.code,
    details:
        value?.error?.details ||
        value?.details ||
        value?.data?.error?.details,
    retryAfterSeconds:
        typeof value?.error?.retryAfterSeconds === 'number' ? (value.error.retryAfterSeconds as number) : undefined,
  };
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    throw new ApiError(
        getApiTarget() === 'local'
            ? 'Lokale Backend-Adresse unbekannt, EXPO_PUBLIC_LOCAL_API_BASE_URL in .env setzen'
            : 'EXPO_PUBLIC_API_BASE_URL fehlt in .env'
    );
  }

  const base = apiBaseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const query = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  const qs = query.toString();
  return `${base}${cleanPath}${qs ? `?${qs}` : ''}`;
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(
    path: string,
    options: ApiRequestOptions = {}
): Promise<T> {
  await ensureApiTargetLoaded();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.authenticated) {
    const token = await getAccessToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path, options.params), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const error = extractError(data, `API-Fehler ${response.status}`);

    const retryAfterHeader = Number(response.headers.get('retry-after'));

    throw new ApiError(
        error.message,
        response.status,
        error.code,
        error.details,
        error.retryAfterSeconds ?? (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : undefined)
    );
  }

  return data as T;
}

export async function apiGet<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
    options?: ApiGetOptions
): Promise<T> {
  const load = () =>
      apiRequest<T>(path, {
        method: 'GET',
        params,
        authenticated: options?.authenticated,
      });

  // Angemeldete Anfragen (Login Daten) haben ihren eigenen Cache in myttData.
  if (options?.authenticated || options?.cache === false) {
    return load();
  }

  // Die Basis URL gehört zum Cache Key, also muss das API Ziel schon geladen sein.
  await ensureApiTargetLoaded();

  return cachedGet<T>({ baseUrl: getApiBaseUrl(), path, params, load });
}

export async function apiPost<T>(
    path: string,
    body?: unknown,
    options?: { authenticated?: boolean }
): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body,
    authenticated: options?.authenticated,
  });
}

export async function apiPut<T>(
    path: string,
    body?: unknown,
    options?: { authenticated?: boolean }
): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    body,
    authenticated: options?.authenticated,
  });
}

export async function apiDelete<T>(
    path: string,
    options?: { authenticated?: boolean }
): Promise<T> {
  return apiRequest<T>(path, {
    method: 'DELETE',
    authenticated: options?.authenticated,
  });
}

export function getApiBaseUrl() {
  return getApiBaseUrlForTarget(getApiTarget()) ?? '';
}