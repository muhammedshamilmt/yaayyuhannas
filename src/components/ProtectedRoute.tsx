"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireTeamCaptain?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireTeamCaptain = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        
        if (!storedUser) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(storedUser);
        
        if (requireAdmin && user.userType !== 'admin') {
          router.push('/');
          return;
        }

        if (requireTeamCaptain && user.userType !== 'team-captain' && user.userType !== 'admin') {
          router.push('/');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem('currentUser');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requireAdmin, requireTeamCaptain]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Router will handle redirect
  }

  return <>{children}</>;
};