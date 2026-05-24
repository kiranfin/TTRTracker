import { apiGet, apiPost } from './client';
import { clearAccessToken, saveAccessToken } from '../storage/authToken';

export type AppUser = {
    id: string;
    username: string;
};

type AuthResponse = {
    data: {
        user: AppUser;
        accessToken: string;
    };
};

type MeResponse = {
    data: {
        user: AppUser;
    };
};

export async function registerAppUser(params: {
    username: string;
    password: string;
}) {
    const response = await apiPost<AuthResponse>('/api/auth/register', params);

    await saveAccessToken(response.data.accessToken);

    return response.data.user;
}

export async function loginAppUser(params: {
    username: string;
    password: string;
}) {
    const response = await apiPost<AuthResponse>('/api/auth/login', params);

    await saveAccessToken(response.data.accessToken);

    return response.data.user;
}

export async function getCurrentAppUser() {
    const response = await apiGet<MeResponse>(
        '/api/auth/me',
        undefined,
        { authenticated: true }
    );

    return response.data.user;
}

export async function logoutAppUser() {
    await clearAccessToken();
}