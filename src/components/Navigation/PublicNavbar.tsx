'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
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
              Arts Fest 2K25
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
          <Link
            href="/login"
            className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            Join Festival
          </Link>
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
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="block bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors text-center mt-4"
            >
              Join Festival
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}