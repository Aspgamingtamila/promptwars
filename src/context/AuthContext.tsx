import React, { createContext, useContext, useState, useEffect } from 'react';
import { StaffProfile, UserRole } from '../types';
import { storageEngine } from '../lib/storageEngine';

const isLocalhost = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const isDemoBuild = import.meta.env.DEV && isLocalhost;
const DEMO_PASSWORD = 'demo-only';

interface AuthContextType {
  currentUser: StaffProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  switchUser: (profile: StaffProfile) => void;
  signOut: () => void;
  availableDemoUsers: StaffProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const availableDemoUsers = isDemoBuild ? storageEngine.listProfiles() : [];

  useEffect(() => {
    // The local demo session is not an authentication mechanism. Never restore it
    // in a production build, and never grant a default administrator session.
    if (!isDemoBuild) {
      localStorage.removeItem('shiftbridge_auth_user_id');
      setIsLoading(false);
      return;
    }

    const savedUserId = localStorage.getItem('shiftbridge_auth_user_id');
    if (savedUserId) {
      const profile = storageEngine.getProfileById(savedUserId);
      if (profile && profile.active) {
        setCurrentUser(profile);
      } else {
        localStorage.removeItem('shiftbridge_auth_user_id');
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // This mock sign-in exists only to preview seeded data with `vite dev`.
    // Production builds must use a real server-verified authentication provider.
    if (!isDemoBuild || password !== DEMO_PASSWORD) {
      return false;
    }

    const user = storageEngine.getProfileByEmail(email);
    if (!user) {
      return false;
    }
    if (!user.active) {
      throw new Error('This account has been deactivated. Please contact your operations administrator.');
    }
    setCurrentUser(user);
    localStorage.setItem('shiftbridge_auth_user_id', user.id);
    return true;
  };

  const switchUser = (profile: StaffProfile) => {
    if (!isDemoBuild) {
      return;
    }
    if (!profile.active) {
      alert('Cannot switch to a deactivated staff account.');
      return;
    }
    setCurrentUser(profile);
    localStorage.setItem('shiftbridge_auth_user_id', profile.id);
  };

  const signOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('shiftbridge_auth_user_id');
  };

  const role = currentUser?.role || null;
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAdmin,
        isStaff,
        isLoading,
        signIn,
        switchUser,
        signOut,
        availableDemoUsers
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
