import { apiDelete, apiGet, apiPost, apiPut } from './client';

export type MyttScope = 'ttr:read' | 'ttr_history:read';

export function getMyttStatus() {
    return apiGet<unknown>(
        '/api/me/mytt/status',
        undefined,
        { authenticated: true }
    );
}

// Der Cookie liegt nur noch auf dem Gerät. Ein Altbestand auf dem Server wird gelöscht.
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

/**
 * Lädt den zuletzt vom Gerät geholten Stand hoch, damit Empfänger einer Freigabe ihn sehen. `data` ist
 * die rohe Antwort von myTischtennis. Der Server prüft sie gegen seine Schemas.
 */
export function uploadMyttSnapshot(body: {
    nuid: string;
    ttrHistory: { fetchedAt: string; data: unknown };
    replacePlayer?: boolean;
}) {
    return apiPut<{ ok: true }>('/api/me/mytt/snapshots', body, { authenticated: true });
}
