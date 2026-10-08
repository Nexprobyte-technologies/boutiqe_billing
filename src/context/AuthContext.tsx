import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (!localStorage.getItem('boutique_token')) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getCurrentUser();
        if (res.success && res.user) {
          setUser(res.user);
        }
      } catch {
        localStorage.removeItem('boutique_token');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    if (res.success) {
      setUser(res.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('boutique_token');
    setUser(null);
  };

  const switchRole = async (role: string) => {
    try {
      const res = await api.switchDemoRole(role);
      if (res.success) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Failed to switch role', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
