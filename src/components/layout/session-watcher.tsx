
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';

export function SessionWatcher() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  // We use state to track the previous login status.
  const [wasLoggedIn, setWasLoggedIn] = useState(false);

  useEffect(() => {
    // We don't want to run this logic on the initial load.
    if (loading) {
      return;
    }

    const isLoggedIn = !!user;

    // If the user was logged in, but is now logged out, their session has expired.
    if (wasLoggedIn && !isLoggedIn) {
      // Avoid showing the toast on the login/signup pages if they logged out manually.
      if (pathname !== '/login' && pathname !== '/signup') {
         toast({
            variant: 'destructive',
            title: 'Session Expired',
            description: 'You have been logged out for security. Please log in again.',
        });
        router.push('/login');
      }
    }

    // Update the state for the next check.
    setWasLoggedIn(isLoggedIn);

  }, [user, loading, wasLoggedIn, toast, router, pathname]);

  // This component does not render anything.
  return null;
}
