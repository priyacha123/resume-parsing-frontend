import api from './api';
import Cookies from 'js-cookie';

export async function register(username: string, password: string) {
    const res = await api.post('/auth/register/', { username, password });
    return res.data;
}

export async function login(username: string, password: string) {
    const res = await api.post('/auth/login/', { username, password })

    const { access, refresh } = res.data;

    // Store tokens in cookies — expires matches your backend's token lifetimes
    Cookies.set('access_token', access, { expires: 1/96}) // ~15 minutes
    Cookies.set('refresh_token', refresh, { expires: 7 }) // 7 days

    return res.data;
}

export function logout() {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
}

export function isAuthenticated() {
    return !!Cookies.get('access_token');
}