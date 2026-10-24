'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, setAccessToken } from './api-client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const refreshRes = await apiClient.auth.refresh();
      if (refreshRes?.data?.accessToken) {
        setAccessToken(refreshRes.data.accessToken);
        const meRes = await apiClient.auth.me();
        setUser(meRes.data.user);
        setProfile(meRes.data.profile);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (credentials) => {
    const res = await apiClient.auth.login(credentials);
    setUser(res.data.user);
    setProfile(res.data.profile);
    return res.data;
  };

  const register = async (data) => {
    const res = await apiClient.auth.register(data);
    return res.data;
  };

  const logout = async () => {
    await apiClient.auth.logout();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const res = await apiClient.profile.get();
      setProfile(res.data.profile);
      return res.data;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

