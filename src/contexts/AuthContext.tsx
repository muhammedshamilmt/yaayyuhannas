"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthUser {
  name: string;
  email: string;
  avatarUrl: string;
  isAdmin: boolean;
  authProvider?: string;
  userType?: 'admin' | 'team-captain' | 'user';
  team?: {
    code: string;
    name?: string;
    id?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }

    // Listen to Firebase auth state changes
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setFirebaseUser(firebaseUser);
      setLoading(false);
    });

    setLoading(false);

    return () => unsubscribe();
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('currentUser');
    // Note: Firebase signOut should be called from the component that triggers logout
  };

  const value = {
    user,
    firebaseUser,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};