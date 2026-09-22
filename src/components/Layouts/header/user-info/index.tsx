"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOutUser } from '@/lib/firebase';
import Image from 'next/image';

interface User {
  name: string;
  email: string;
  avatarUrl: string;
  userType: 'admin' | 'team-captain' | 'user';
  isAdmin?: boolean;
  team?: {
    _id: string;
    code: string;
    name: string;
    color: string;
  };
  authProvider?: string;
}

export function UserInfo() {
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Sign out from Firebase if user used Google auth
      if (user?.authProvider === 'google') {
        await signOutUser();
      }
      
      // Clear local storage
      localStorage.removeItem('currentUser');
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still redirect even if Firebase logout fails
      localStorage.removeItem('currentUser');
      router.push('/login');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
        <div className="hidden lg:block">
          <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-12 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
        </div>
      </div>
    );
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
      >
        {user.avatarUrl.includes('dicebear') ? (
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">{initials}</span>
          </div>
        ) : (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full shadow-lg"
          />
        )}
        <div className="hidden lg:block text-left">
          <div className="text-sm font-medium text-gray-900">{user.name}</div>
          <div className="text-xs text-gray-600">
            {user.userType === 'admin' ? 'Admin' : 
             user.userType === 'team-captain' ? `${user.team?.name} Captain` : 'User'} • {user.authProvider === 'google' ? 'Google' : 'Local'}
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-600">{user.email}</div>
          </div>
          <button
            onClick={() => {
              setShowDropdown(false);
              router.push('/');
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            View Landing Page
          </button>
          {user.userType === 'team-captain' && (
            <button
              onClick={() => {
                setShowDropdown(false);
                router.push('/team-admin');
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Team Dashboard
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
