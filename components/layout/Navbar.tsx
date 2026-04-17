'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User } from '@/types';
import { getCurrentUser, logout } from '@/lib/auth';

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme-mode');
    if (stored === 'dark') setTheme('dark');
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme-mode', theme);
    }
  }, [theme, mounted]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      <nav
        style={{
          background: !mounted || theme === 'light'
            ? 'rgba(255,255,255,0.92)'
            : 'rgba(15,15,15,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,122,0,0.15)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
        }}
        className="fixed w-full top-0 z-50 transition-all duration-300"
      >
        {/* Tricolor stripe */}
        <div className="sw-tricolor-bar" />

        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🇮🇳</span>
            <span
              className="text-xl font-black tracking-tight transition-colors"
              style={{ color: 'var(--sw-red)' }}
            >
              SwadeshiYatra
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/"
              className="font-semibold text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--foreground)' }}
            >
              Home
            </Link>
            <Link
              href="/planner"
              className="font-semibold text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--foreground)' }}
            >
              Trip Planner
            </Link>

            {/* Dark mode toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title="Toggle dark mode"
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border transition-all duration-200"
              style={{
                borderColor: 'rgba(255,122,0,0.35)',
                background: !mounted || theme === 'light' ? 'rgba(255,122,0,0.06)' : 'rgba(255,122,0,0.12)',
                color: 'var(--sw-saffron)',
              }}
            >
              {(!mounted || theme === 'light') ? '🌙 Dark' : '☀️ Light'}
            </button>

            {user ? (
              <>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="font-semibold text-sm" style={{ color: 'var(--sw-red)' }}>
                    🛡️ Admin Panel
                  </Link>
                )}
                {user.role !== 'TOURIST' && user.role !== 'ADMIN' && (
                  <Link href="/dashboard" className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                    Dashboard
                  </Link>
                )}
                <span className="text-sm font-semibold" style={{ color: 'var(--sw-saffron)' }}>
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="sw-btn-primary text-sm px-4 py-1.5"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="sw-btn-primary text-sm px-5 py-1.5"
                style={{ borderRadius: '9999px', display: 'inline-block' }}
              >
                Login / Register
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: 'var(--sw-red)' }}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden px-4 pb-4 flex flex-col gap-3 border-t"
            style={{ 
              borderColor: 'rgba(255,122,0,0.15)', 
              background: (!mounted || theme === 'light') ? 'rgba(255,255,255,0.97)' : 'rgba(20,20,20,0.97)' 
            }}
          >
            <Link href="/" className="font-semibold py-2 text-sm" style={{ color: 'var(--foreground)' }} onClick={() => setMenuOpen(false)}>Home</Link>
            <Link href="/planner" className="font-semibold py-2 text-sm" style={{ color: 'var(--foreground)' }} onClick={() => setMenuOpen(false)}>Trip Planner</Link>
            <button
              onClick={() => { setTheme(theme === 'light' ? 'dark' : 'light'); setMenuOpen(false); }}
              className="text-left font-semibold py-2 text-sm"
              style={{ color: 'var(--sw-saffron)' }}
            >
              {(!mounted || theme === 'light') ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode'}
            </button>
            {user ? (
              <>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="font-semibold py-2 text-sm" style={{ color: 'var(--sw-red)' }} onClick={() => setMenuOpen(false)}>🛡️ Admin Panel</Link>
                )}
                {user.role !== 'TOURIST' && user.role !== 'ADMIN' && (
                  <Link href="/dashboard" className="font-semibold py-2 text-sm" style={{ color: 'var(--foreground)' }} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                )}
                <button onClick={handleLogout} className="sw-btn-primary text-sm w-full text-center py-2">Logout</button>
              </>
            ) : (
              <Link href="/login" className="sw-btn-primary text-sm text-center py-2 block" onClick={() => setMenuOpen(false)}>Login / Register</Link>
            )}
          </div>
        )}
      </nav>

      {/* Spacer to offset fixed navbar */}
      <div style={{ height: '60px' }} />
    </>
  );
};

export default Navbar;
