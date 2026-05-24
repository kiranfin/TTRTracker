import { getAccessToken } from '../storage/authToken';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string | number | undefined>;
  body?: unknown;
  authenticated?: boolean;
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
  };
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  if (!API_BASE_URL) {
    throw new ApiError('EXPO_PUBLIC_API_BASE_URL fehlt in .env');
  }

  const base = API_BASE_URL.replace(/\/$/, '');
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

    throw new ApiError(
        error.message,
        response.status,
        error.code,
        error.details
    );
  }

  return data as T;
}

export async function apiGet<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
    options?: { authenticated?: boolean }
): Promise<T> {
  return apiRequest<T>(path, {
    method: 'GET',
    params,
    authenticated: options?.authenticated,
  });
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
  return API_BASE_URL ?? '';
}