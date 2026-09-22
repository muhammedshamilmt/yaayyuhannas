"use client";

import React, { useState } from 'react';
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { signInWithGoogle, signOutUser } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      };

      // For now, we'll implement a simple email/password check
      // You can replace this with your actual authentication logic
      if (data.email && data.password) {
        const displayName = data.email.split('@')[0];
        const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

        localStorage.setItem('currentUser', JSON.stringify({
          name: displayName,
          email: data.email,
          avatarUrl,
          isAdmin: data.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        }));

        toast({
          title: "Welcome back!",
          description: `Hello ${displayName}`,
        });

        // Redirect based on admin status
        if (data.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
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
      
      // Check team membership and user type
      const teamCheckResponse = await fetch('/api/auth/check-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      
      const teamCheckResult = await teamCheckResponse.json();
      
      if (!teamCheckResult.success) {
        throw new Error('Failed to verify team membership');
      }

      let userData;
      let redirectPath = '/';
      let welcomeMessage = `Signed in as ${displayName}`;

      if (teamCheckResult.userType === 'admin') {
        userData = {
          name: displayName,
          email: user.email,
          avatarUrl,
          userType: 'admin',
          isAdmin: true,
          authProvider: 'google',
        };
        redirectPath = '/admin';
        welcomeMessage += ' (Admin)';
      } else if (teamCheckResult.userType === 'team-captain') {
        const team = teamCheckResult.team;
        userData = {
          name: displayName,
          email: user.email,
          avatarUrl,
          userType: 'team-captain',
          isAdmin: false,
          team: team,
          authProvider: 'google',
        };
        redirectPath = '/team-admin';
        welcomeMessage += ` (${team.name} Captain)`;
      } else {
        userData = {
          name: displayName,
          email: user.email,
          avatarUrl,
          userType: 'user',
          isAdmin: false,
          authProvider: 'google',
        };
        welcomeMessage += ' (User)';
      }

      // Store user data in localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));

      toast({
        title: 'Welcome!',
        description: welcomeMessage,
      });

      // Redirect based on user type
      router.push(redirectPath);

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
        variant: 'destructive'
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