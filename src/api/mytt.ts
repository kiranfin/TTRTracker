import { apiDelete, apiGet, apiPost, apiPut } from './client';

export type MyttScope = 'ttr:read' | 'ttr_history:read';

export function getMyttStatus() {
    return apiGet<unknown>(
        '/api/me/mytt/status',
        undefined,
        { authenticated: true }
    );
}

export function saveMyttCookie(cookie: string) {
    return apiPut<{ ok: true }>(
        '/api/me/mytt/cookie',
        { cookie },
        { authenticated: true }
    );
}

export function deleteMyttCookie() {
    return apiDelete<{ ok: true }>(
        '/api/me/mytt/cookie',
        { authenticated: true }
    );
}

export function getMyttGrants() {
    return apiGet<unknown>(
        '/api/me/mytt/grants',
        undefined,
        { authenticated: true }
    );
}

export function createMyttGrant(params: {
    granteeUsername: string;
    scopes: MyttScope[];
    expiresAt?: string | null;
}) {
    return apiPost<unknown>(
        '/api/me/mytt/grants',
        {
            granteeUsername: params.granteeUsername,
            scopes: params.scopes,
            expiresAt: params.expiresAt ?? null,
        },
        { authenticated: true }
    );
}

export function revokeMyttGrant(grantId: string) {
    return apiDelete<{ ok: true }>(
        `/api/me/mytt/grants/${encodeURIComponent(grantId)}`,
        { authenticated: true }
    );
}