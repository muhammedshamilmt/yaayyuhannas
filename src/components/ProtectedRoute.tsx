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
  const [userEmail, setUserEmail] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        
        if (!storedUser) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(storedUser);
        if (!user || !user.email) {
          localStorage.removeItem('currentUser');
          router.push('/login');
          return;
        }

        if (isMounted) {
          setUserEmail(user.email);
        }

        // Live verification of email against database
        try {
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const currentTeamCode = urlParams?.get('team') || localStorage.getItem('selectedTeam') || user.team?.code;

          const res = await fetch('/api/auth/check-team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: user.email,
              teamCode: currentTeamCode || undefined 
            }),
          });

          const data = await res.json();

          if (data && data.success) {
            const updatedUser = {
              ...user,
              userType: data.userType,
              isAdmin: data.userType === 'admin',
              team: data.team || user.team,
            };

            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            if (data.team?.code) {
              localStorage.setItem('selectedTeam', data.team.code);
            }

            if (requireAdmin && data.userType !== 'admin') {
              if (isMounted) {
                setIsAuthorized(false);
                setIsLoading(false);
              }
              return;
            }

            if (requireTeamCaptain && data.userType !== 'team-captain' && data.userType !== 'admin') {
              if (isMounted) {
                setIsAuthorized(false);
                setIsLoading(false);
              }
              return;
            }

            if (isMounted) {
              setIsAuthorized(true);
            }
            return;
          }
        } catch (fetchErr) {
          console.warn('Backend live verification failed, falling back to local credentials:', fetchErr);
        }

        // Fallback: check stored credentials if API is unreachable
        if (requireAdmin && user.userType !== 'admin') {
          if (isMounted) {
            setIsAuthorized(false);
          }
          return;
        }

        if (requireTeamCaptain && user.userType !== 'team-captain' && user.userType !== 'admin') {
          if (isMounted) {
            setIsAuthorized(false);
          }
          return;
        }

        if (isMounted) {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem('currentUser');
        router.push('/login');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router, requireAdmin, requireTeamCaptain]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-poppins">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
            🚫
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-600 mb-4">
            {userEmail ? (
              <>
                You are currently signed in as <strong className="text-gray-900">{userEmail}</strong>, but this email has not been granted {requireAdmin ? 'Admin' : 'Team Admin'} access.
              </>
            ) : (
              'You do not have permission to access this area.'
            )}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 text-left mb-6 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <span>💡</span> Need Access?
            </p>
            <p>
              Please contact the Festival Administrator to add your email ({userEmail || 'your email'}) under <strong>Team Admin Emails</strong> in the administration console.
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('selectedTeam');
                window.location.href = '/login';
              }}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
            >
              Sign In with a Different Account
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-xl transition"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};