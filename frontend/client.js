import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


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

export default api;