import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('notable_token'));
  const [loading, setLoading] = useState(true);

  const authFetch = useCallback(async (url, options = {}) => {
    const t = localStorage.getItem('notable_token');
    const headers = { ...options.headers };
    if (t) headers['Authorization'] = `Bearer ${t}`;
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('notable_token');
      setToken(null);
      setUser(null);
      window.location.href = '/';
      throw new Error('Session expired');
    }
    return res;
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authFetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Invalid token');
      })
      .then(userData => {
        setUser(userData);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('notable_token');
        setToken(null);
        setUser(null);
        setLoading(false);
      });
  }, [token, authFetch]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('notable_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('notable_token');
    setToken(null);
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await authFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, changePassword, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
