import type { PlayerTtrHistoryResponse, PlayerTtrResponse } from '../types/tttracker';
import { ApiError } from './client';

const MYTT_API_URL = 'https://www.mytischtennis.de';

export type HeadToHeadResult = {
    data: unknown[];
    error: unknown | null;
};

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asNumberOrNull(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value.replace(',', '.'));

        if (Number.isFinite(parsed)) return parsed;
    }

    return null;
}

function asStringOrNull(value: unknown) {
    return typeof value === 'string' && value.trim() ? value : null;
}

function looksLikeLoginPage(contentType: string, body: string) {
    if (!contentType.includes('text/html')) return false;

    const lower = body.toLowerCase();

    return lower.includes('type="password"') && (lower.includes('login') || lower.includes('einloggen') || lower.includes('anmelden'));
}

// Direkter Aufruf der drei Login Endpunkte von myTischtennis mit dem Cookie vom Gerät.
// credentials: 'omit', damit auf iOS nicht der Cookie Speicher der Plattform den Header überschreibt.
async function requestMytt(params: { method: 'GET' | 'POST'; path: string; cookie: string; body?: URLSearchParams }) {
    const response = await fetch(`${MYTT_API_URL}${params.path}`, {
        method: params.method,
        credentials: 'omit',
        headers: {
            Accept: 'application/json',
            Cookie: params.cookie,
            ...(params.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        },
        body: params.body?.toString(),
    });

    const text = await response.text();

    if ([401, 403, 419].includes(response.status) || looksLikeLoginPage(response.headers.get('content-type') ?? '', text)) {
        throw new ApiError('myTischtennis-Session ist abgelaufen.', 401, 'MYTT_AUTH_EXPIRED');
    }

    if (!response.ok) {
        throw new ApiError(`myTischtennis-Fehler ${response.status}`, response.status, 'MYTT_UPSTREAM_ERROR');
    }

    try {
        return asRecord(JSON.parse(text));
    } catch {
        throw new ApiError('myTischtennis lieferte keine gültige Antwort.', 502, 'MYTT_UPSTREAM_ERROR');
    }
}

export const myttDirect = {
    async getPlayerTtr(cookie: string, nuid: string): Promise<PlayerTtrResponse> {
        const result = await requestMytt({ method: 'GET', path: `/api/ttr/player/${encodeURIComponent(nuid)}`, cookie });
        const ttr = asNumberOrNull(result.ttr);
        const error = result.error ?? null;

        return {
            data: { nuid, available: error === null && ttr !== null, ttr, error },
            meta: { source: 'device' },
        };
    },

    async getPlayerTtrHistory(cookie: string, nuid: string): Promise<PlayerTtrHistoryResponse> {
        const result = await requestMytt({ method: 'GET', path: `/api/ttr/history/${encodeURIComponent(nuid)}`, cookie });
        const error = result.error ?? null;

        return {
            data: {
                nuid,
                available: error === null,
                ttr: asNumberOrNull(result.ttr),
                qttr: asNumberOrNull(result.vq_ttr) ?? asNumberOrNull(result.ttr_last_fixed),
                qttrDate: asStringOrNull(result.ttr_last_fixed_date),
                maxTtr: asNumberOrNull(result.max_ttr),
                ttrDate: asStringOrNull(result.ttr_date),
                maxTtrDate: asStringOrNull(result.max_ttr_date),
                clubName: asStringOrNull(result.club_name),
                personName: asStringOrNull(result.person_name),
                events: Array.isArray(result.event) ? result.event : [],
                error,
            },
            meta: { source: 'device' },
        };
    },

    async getHeadToHead(cookie: string, otherUser: string): Promise<HeadToHeadResult> {
        const result = await requestMytt({
            method: 'POST',
            path: '/api/head-to-head',
            cookie,
            body: new URLSearchParams({ other_user: otherUser }),
        });

        return { data: Array.isArray(result.data) ? result.data : [], error: result.error ?? null };
    },
};
