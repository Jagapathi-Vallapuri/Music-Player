import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

let onUnauthorizedLogout = null;

export const injectLogoutHandler = (logoutFn) => {
    onUnauthorizedLogout = typeof logoutFn === 'function' ? logoutFn : null;
};

api.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem('token');
            if (token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isHandlingUnauthorized = false;
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            if (!isHandlingUnauthorized) {
                isHandlingUnauthorized = true;
                try {
                    if (onUnauthorizedLogout) onUnauthorizedLogout();
                } finally {
                    setTimeout(() => { isHandlingUnauthorized = false; }, 500);
                }
            }
        }
        return Promise.reject(error);
    }
);


export const register = async (username, email, password) => {
    try {
        const response = await api.post('/auth/register', { username, email, password });
        if (response.data && response.data.success === false) {
            throw new Error(response.data.message || 'Registration failed');
        }
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Registration failed');
    }
};

export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Login failed');
    }
}

export const verify2FA = async (email, code, type = 'login', sessionId = undefined) => {
    try {
        const body = { email, code, type };
        if (sessionId) body.sessionId = sessionId;
        const response = await api.post('/auth/verify-2fa', body);
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || '2FA verification failed');
    }
};

// Profile helpers
export const getMe = async () => {
    try {
        const res = await api.get('/users/me');
        return res.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to fetch profile');
    }
};

export const updateAbout = async (about) => {
    try {
        const res = await api.patch('/users/me', { about });
        return res.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to update about');
    }
};

export const uploadAvatar = async (file) => {
    try {
        const form = new FormData();
        form.append('avatar', file);
        const res = await api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to upload avatar');
    }
};

export default api;