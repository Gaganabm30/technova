import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Organization } from '../types';
import { api, getToken, setToken, removeToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    organizationName?: string;
    role?: string;
    department?: string;
    jobTitle?: string;
  }) => Promise<void>;
  exploreDemo: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setOrganization(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.me();
      setUser(res.user);
      if (res.organization) setOrganization(res.organization);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      removeToken();
      setUser(null);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setToken(res.token);
    setUser(res.user);
    if (res.organization) setOrganization(res.organization);
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    organizationName?: string;
    role?: string;
    department?: string;
    jobTitle?: string;
  }) => {
    const res = await api.register(data);
    setToken(res.token);
    setUser(res.user);
    if (res.organization) setOrganization(res.organization);
  };

  const exploreDemo = async () => {
    const res = await api.exploreDemo();
    setToken(res.token);
    setUser(res.user);
    if (res.organization) setOrganization(res.organization);
  };

  const completeOnboarding = async () => {
    const res = await api.completeOnboarding();
    setUser(res.user);
    if (organization) {
      setOrganization({ ...organization, onboardingCompleted: true });
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setOrganization(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.me();
      setUser(res.user);
      if (res.organization) setOrganization(res.organization);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const switchOrganization = async (orgId: string) => {
    const res = await api.switchOrganization(orgId);
    setToken(res.token);
    setUser(res.user);
    setOrganization(res.organization);
    window.dispatchEvent(new CustomEvent('workflow:organization-switched'));
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        loading,
        login,
        register,
        exploreDemo,
        completeOnboarding,
        logout,
        refreshUser,
        switchOrganization,
        hasRole,
      }}
    >
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
