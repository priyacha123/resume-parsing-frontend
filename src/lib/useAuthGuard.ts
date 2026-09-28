'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { restoreSession } from './auth';

export function useAuthGuard() {
  const router = useRouter();
  useEffect(() => {
    let active = true;

    async function checkSession() {
      const authenticated = await restoreSession();
      if (active && !authenticated) {
        router.replace('/login');
      }
    }

    checkSession();
    return () => {
      active = false;
    };
  }, [router]);
}