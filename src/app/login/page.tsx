"use client";

import React, { useState } from 'react';
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { signInWithGoogle, signOutUser } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminEmail } from '@/lib/adminAuth';

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Amazing platform! The user experience is seamless and the features are exactly what I needed."
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "This service has transformed how I work. Clean design, powerful features, and excellent support."
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity."
  },
];

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();

  const processSuccessfulAuth = async (
    email: string,
    displayName: string,
    avatarUrl: string,
    authProvider: 'email' | 'google'
  ) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check team membership and user type from backend
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const targetTeamCode = urlParams?.get('team') || localStorage.getItem('selectedTeam');

    const teamCheckResponse = await fetch('/api/auth/check-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: cleanEmail,
        teamCode: targetTeamCode || undefined 
      }),
    });

    const teamCheckResult = await teamCheckResponse.json();

    if (!teamCheckResult.success) {
      throw new Error(teamCheckResult.error || 'Failed to verify account permissions');
    }

    if (teamCheckResult.accessDisabled) {
      toast({
        title: 'Team Admin Access Revoked',
        description: 'Your portal access for this team was suspended by the festival administrator.',
        variant: 'destructive',
      });
    }

    let userData: {
      name: string;
      email: string;
      avatarUrl: string;
      userType: 'admin' | 'team-captain' | 'user';
      isAdmin: boolean;
      authProvider: string;
      team?: any;
    };
    let redirectPath = '/';
    let welcomeMessage = `Signed in as ${displayName}`;

    if (teamCheckResult.userType === 'admin') {
      userData = {
        name: displayName,
        email: cleanEmail,
        avatarUrl,
        userType: 'admin',
        isAdmin: true,
        authProvider,
      };
      redirectPath = '/admin';
      welcomeMessage += ' (Admin)';
    } else if (teamCheckResult.userType === 'team-captain') {
      const team = teamCheckResult.team;
      userData = {
        name: displayName,
        email: cleanEmail,
        avatarUrl,
        userType: 'team-captain',
        isAdmin: false,
        team: team,
        authProvider,
      };
      redirectPath = `/team-admin?team=${team.code}`;
      welcomeMessage += ` (${team.name} Team Admin)`;
    } else {
      userData = {
        name: displayName,
        email: cleanEmail,
        avatarUrl,
        userType: 'user',
        isAdmin: false,
        authProvider,
      };
      welcomeMessage += ' (User)';
    }

    // Store user data in localStorage
    localStorage.setItem('currentUser', JSON.stringify(userData));
    if (userData.team?.code) {
      localStorage.setItem('selectedTeam', userData.team.code);
    } else {
      localStorage.removeItem('selectedTeam');
    }

    // Synchronize in-memory auth state
    try {
      login(userData);
    } catch (authErr) {
      console.error('Error synchronizing auth context:', authErr);
    }

    toast({
      title: 'Welcome!',
      description: welcomeMessage,
    });

    // Full window navigation ensures all contexts and layouts reload with fresh auth state
    window.location.href = redirectPath;
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = (formData.get('email') as string)?.trim().toLowerCase();
      const password = formData.get('password') as string;

      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      const displayName = email.split('@')[0];
      const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

      await processSuccessfulAuth(email, displayName, avatarUrl, 'email');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const result = await signInWithGoogle();
      const user = result.user;

      if (!user.email) {
        throw new Error('No email found in Google account');
      }

      const displayName = user.displayName || user.email.split('@')[0];
      const avatarUrl = user.photoURL || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

      await processSuccessfulAuth(user.email, displayName, avatarUrl, 'google');
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      // Sign out from Firebase if there was an error
      try {
        await signOutUser();
      } catch (signOutError) {
        console.error('Error signing out:', signOutError);
      }

      toast({
        title: 'Google Sign-in Failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    toast({
      title: "Password Reset",
      description: "Password reset functionality will be implemented soon.",
    });
  };

  const handleCreateAccount = () => {
    router.push('/signup');
  };

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        title={
          <span className="font-light text-foreground tracking-tighter">
            Welcome Back
          </span>
        }
        description="Sign in to your account and continue your journey with Herald Group"
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
      
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Signing in...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;