const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function extractErrorMessage(data: unknown, fallback: string) {
  const value = data as any;

  return (
    value?.error?.message ||
    value?.message ||
    value?.data?.error?.message ||
    fallback
  );
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

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const text = await response.text();

  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(data, `API-Fehler ${response.status}`),
      response.status
    );
  }

  return data as T;
}

export function getApiBaseUrl() {
  return API_BASE_URL ?? '';
}
