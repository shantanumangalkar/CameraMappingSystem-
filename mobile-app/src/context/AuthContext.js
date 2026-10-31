import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY, USER_KEY } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);

  // Restore stored session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.warn('Failed to restore auth session:', err);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (username, password) => {
    setAuthActionLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.success) {
        const { token, refreshToken, ...userData } = response.data;
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
        setToken(token);
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (err) {
      const errorMsg = err?.message || err?.error || (typeof err === 'string' ? err : 'Network error / invalid credentials');
      return { success: false, message: errorMsg };
    } finally {
      setAuthActionLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (err) {
      console.warn('Error clearing storage on logout', err);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isAdmin = userRole === 'ROLE_ADMIN';
  const isOfficer = userRole === 'ROLE_POLICE_OFFICER';
  const isSurveyor = userRole === 'ROLE_SURVEY_PERSON';

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        token,
        loading,
        authActionLoading,
        login,
        logout,
        isAdmin,
        isOfficer,
        isSurveyor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
