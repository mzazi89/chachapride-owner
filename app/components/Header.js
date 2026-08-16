'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/rides', label: 'Rides' },
    { href: '/drivers', label: 'Drivers' },
    { href: '/settlements', label: 'Settlements' },
    { href: '/messages', label: 'Messages' },
    { href: '/ride-types', label: 'Ride types' },
  ];

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-black tracking-tight text-gray-900"
          >
            chacha<span className="text-blue-600">pride</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  isActive(link.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              Hi, {firstName}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
            >
              Log out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive(link.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between px-1">
              <span className="text-sm font-medium text-gray-700">
                Hi, {firstName}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
