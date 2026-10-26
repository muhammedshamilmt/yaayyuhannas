'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ userType?: string; team?: any } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const renderActionButton = (mobile = false) => {
    if (user?.userType === 'admin') {
      return (
        <Link
          href="/admin"
          onClick={() => mobile && setIsOpen(false)}
          className={`bg-indigo-600 text-white font-medium text-sm px-5 py-2 rounded-full hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-1.5 ${mobile ? 'block text-center mt-4' : ''}`}
        >
          <span>⚙️</span> Admin Panel
        </Link>
      );
    }
    if (user?.userType === 'team-captain' && user.team?.code) {
      return (
        <Link
          href={`/team-admin?team=${user.team.code}`}
          onClick={() => mobile && setIsOpen(false)}
          className={`text-white font-semibold text-sm px-5 py-2 rounded-full transition shadow-sm flex items-center justify-center gap-1.5 ${mobile ? 'block text-center mt-4' : ''}`}
          style={{ backgroundColor: user.team.color || '#2563EB' }}
        >
          <span>🛡️</span> {user.team.name || user.team.code} Portal
        </Link>
      );
    }
    return (
      <Link
        href="/login"
        onClick={() => mobile && setIsOpen(false)}
        className={`bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors ${mobile ? 'block text-center mt-4' : ''}`}
      >
        Join Festival
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="flex items-center justify-between px-8 py-4 sm:py-5 max-w-7xl mx-auto w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <Image
            src="/images/logo/logoayyuhannas.png"
            alt="AYYU HANNAS"
            width={44}
            height={44}
            className="w-10 h-10 sm:w-11 sm:h-11 object-full overflow-hidden rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105"
            priority
          />
          <div className="flex flex-col">
            <span className="font-bold text-lg sm:text-xl text-bold tracking-tight leading-none">
              AYYU HANNAS
            </span>
            <span className="text-[10px] font-semibold text-gray-500 uppercase leading-none mt-1">
              Arts Fest 2K26
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8 text-gray-500">
          <Link
            href="/#about"
            className={`hover:text-gray-900 transition-colors ${isActive('/#about') ? 'text-gray-900' : ''
              }`}
          >
            About
          </Link>
          <Link
            href="/teams"
            className={`hover:text-gray-900 transition-colors ${isActive('/teams') ? 'text-gray-900' : ''
              }`}
          >
            Teams
          </Link>
          <Link
            href="/schedule"
            className={`hover:text-gray-900 transition-colors ${isActive('/schedule') ? 'text-gray-900' : ''
              }`}
          >
            Schedule
          </Link>
          <Link
            href="/public-programme"
            className={`hover:text-gray-900 transition-colors ${isActive('/public-programme') || isActive('/programmes') ? 'text-gray-900 font-semibold' : ''
              }`}
          >
            Public Programme
          </Link>
          <Link
            href="/leaderboard"
            className={`hover:text-gray-900 transition-colors ${isActive('/leaderboard') ? 'text-gray-900' : ''
              }`}
          >
            Leaderboard
          </Link>
          <Link
            href="/results"
            className={`hover:text-gray-900 transition-colors ${isActive('/results') ? 'text-gray-900' : ''
              }`}
          >
            Results
          </Link>
          <Link
            href="/gallery"
            className={`hover:text-gray-900 transition-colors ${isActive('/gallery') ? 'text-gray-900' : ''
              }`}
          >
            Gallery
          </Link>
          <Link
            href="/#contact"
            className={`hover:text-gray-900 transition-colors ${isActive('/#contact') ? 'text-gray-900' : ''
              }`}
          >
            Contact
          </Link>
        </div>

        {/* Action Button */}
        <div className="hidden md:block">
          {renderActionButton(false)}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-8 py-4 space-y-4">
            <Link
              href="/#about"
              onClick={() => setIsOpen(false)}
              className={`block text-gray-500 hover:text-gray-900 transition-colors ${isActive('/#about') ? 'text-gray-900' : ''
                }`}
            >
              About
            </Link>
            <Link
              href="/teams"
              onClick={() => setIsOpen(false)}
              className={`block text-gray-500 hover:text-gray-900 transition-colors ${isActive('/teams') ? 'text-gray-900' : ''
                }`}
            >
              Teams
            </Link>
            <Link
              href="/schedule"
              onClick={() => setIsOpen(false)}
              className={`block text-gray-500 hover:text-gray-900 transition-colors ${isActive('/schedule') ? 'text-gray-900' : ''
                }`}
            >
              Schedule
            </Link>
            <Link
              href="/public-programme"
              onClick={() => setIsOpen(false)}
              className={`block text-gray-500 hover:text-gray-900 transition-colors ${isActive('/public-programme') || isActive('/programmes') ? 'text-gray-900 font-semibold' : ''
                }`}
            >
              Public Programme
            </Link>
            <Link
              href="/leaderboard"
              onClick={() => setIsOpen(false)}
              className={`block text-gray-500 hover:text-gray-900 transition-colors ${isActive('/leaderboard') ? 'text-gray-900' : ''
                }`}
            >
              Leaderboard
            </Link>
            <Link
              href="/results"
              onClick={() => setIsOpen(false)}
              className={`block text-gray-500 hover:text-gray-900 transition-colors ${isActive('/results') ? 'text-gray-900' : ''
                }`}
            >
              Results
            </Link>
            <Link
              href="/#contact"
              onClick={() => setIsOpen(false)}
              className={`block text-gray-500 hover:text-gray-900 transition-colors ${isActive('/#contact') ? 'text-gray-900' : ''
                }`}
            >
              Contact
            </Link>
            {renderActionButton(true)}
          </div>
        </div>
      )}
    </nav>
  );
}