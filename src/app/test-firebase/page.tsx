"use client";

import { useState } from 'react';
import { signInWithGoogle, signOutUser } from '@/lib/firebase';

export default function TestFirebase() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithGoogle();
      setUser(result.user);
      console.log('Sign-in successful:', result.user);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setError(error.message || 'An error occurred during sign-in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await signOutUser();
      setUser(null);
      console.log('Sign-out successful');
    } catch (error: any) {
      console.error('Sign-out error:', error);
      setError(error.message || 'An error occurred during sign-out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Firebase Test</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {user ? (
          <div className="space-y-4">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <strong>Signed in as:</strong> {user.email}
            </div>
            
            <div className="space-y-2">
              <p><strong>Name:</strong> {user.displayName || 'N/A'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>UID:</strong> {user.uid}</p>
            </div>
            
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-center">
              Click the button below to test Google Sign-In
            </p>
            
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}