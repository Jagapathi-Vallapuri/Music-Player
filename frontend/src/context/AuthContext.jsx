import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { injectLogoutHandler } from '../../client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    injectLogoutHandler(() => logout(false));
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const t = localStorage.getItem('token');
        const u = localStorage.getItem('user');
        if (t) setToken(t);
        if (u) setUser(JSON.parse(u));
        if (t) {
          try {
            const res = await api.get('/auth/validate');
            if (res.data?.valid) {
              if (res.data.user) {
                setUser(res.data.user);
                localStorage.setItem('user', JSON.stringify(res.data.user));
              }
            } else {
              if (!cancelled) logout(false);
            }
          } catch (err) {
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
              if (!cancelled) logout(false);
            } // else ignore transient errors
          }
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };
    bootstrap();
    return () => { cancelled = true; };
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  const logout = (navigateAway = true) => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('pendingEmail');
      sessionStorage.removeItem('pendingSessionId');
    }
    if (navigateAway) navigate('/');
  };

  const updateUser = (partial) => {
    setUser(prev => {
      const updated = { ...(prev || {}), ...(typeof partial === 'function' ? partial(prev) : partial) };
      try { localStorage.setItem('user', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
  };

  const value = {
    token,
    user,
    login,
    logout,
  updateUser,
    isAuthenticated: !!token,
    authLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
