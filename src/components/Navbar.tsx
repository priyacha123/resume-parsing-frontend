'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';
import Cookies from 'js-cookie';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = Cookies.get('access_token');
    setIsLoggedIn(!!token);
  }, [pathname]);

  function handleLogout() {
    logout();
    setIsLoggedIn(false);
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-900 tracking-tight text-lg">ResumeMatch</span>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              ATS Analyzer
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
              pathname === '/dashboard'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Matcher
          </Link>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md transition-colors shadow-xs"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
