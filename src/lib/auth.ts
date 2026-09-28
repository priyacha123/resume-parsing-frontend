import api from './api';
import Cookies from 'js-cookie';
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export async function register(username: string, password: string) {
    const res = await api.post('/auth/register/', { username, password });
    return res.data;
}

export async function login(username: string, password: string) {
    const res = await api.post('/auth/login/', { username, password })

    const { access, refresh } = res.data;

    // Store tokens in cookies — expires matches your backend's token lifetimes
    // Use the root path so tokens remain available after navigating from
    // /login to /dashboard or any other application route.
    Cookies.set('access_token', access, { expires: 1 / 96, path: '/' }) // ~15 minutes
    Cookies.set('refresh_token', refresh, { expires: 7, path: '/' }) // 7 days
    window.dispatchEvent(new Event('auth-state-changed'));

    return res.data;
}

export async function logout() {
    const refresh = Cookies.get('refresh_token');
    try {
        if (refresh) {
            await api.post('/auth/logout/', { refresh });
        }
    } catch {
        // Local token cleanup must still complete if the API is unavailable.
    } finally {
        Cookies.remove('access_token', { path: '/' });
        Cookies.remove('refresh_token', { path: '/' });
        window.dispatchEvent(new Event('auth-state-changed'));
    }
}

export function isAuthenticated() {
    return !!Cookies.get('access_token');
}

export async function restoreSession() {
    if (isAuthenticated()) {
        return true;
    }

    const refresh = Cookies.get('refresh_token');
    if (!refresh) {
        return false;
    }

    try {
        const res = await axios.post(`${baseURL}/auth/refresh/`, { refresh });
        Cookies.set('access_token', res.data.access, { expires: 1 / 96, path: '/' });
        if (res.data.refresh) {
            Cookies.set('refresh_token', res.data.refresh, { expires: 7, path: '/' });
        }
        window.dispatchEvent(new Event('auth-state-changed'));
        return true;
    } catch {
        await logout();
        return false;
    }
}