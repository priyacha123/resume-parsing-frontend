'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { restoreSession } from './auth';

export function useAuthGuard() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  useEffect(() => {
    let active = true;

    async function checkSession() {
      const authenticated = await restoreSession();
      if (active) {
        setIsChecking(false);
        if (!authenticated) {
          router.replace('/login');
        }
      }
    }

    checkSession();
    const handleExpired = () => router.replace('/login');
    window.addEventListener('auth-expired', handleExpired);
    return () => {
      active = false;
      window.removeEventListener('auth-expired', handleExpired);
    };
  }, [router]);

  return isChecking;
}