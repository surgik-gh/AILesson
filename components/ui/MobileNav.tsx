'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useKeyboardNavigation, useFocusTrap } from '@/hooks/useKeyboardNavigation';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

interface MobileNavProps {
  items: NavItem[];
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export function MobileNav({ items, role = 'STUDENT' }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Keyboard navigation for closing menu with Escape
  useKeyboardNavigation({
    onEscape: closeMenu,
    enabled: isOpen,
  });

  // Focus trap when menu is open
  useFocusTrap(navRef, isOpen);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 lg:hidden rounded-lg bg-white p-2 shadow-lg dark:bg-gray-800"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
      >
        <div className="flex h-6 w-6 flex-col justify-center gap-1">
          <span
            className={`h-0.5 w-full bg-gray-900 transition-all dark:bg-white ${
              isOpen ? 'translate-y-1.5 rotate-45' : ''
            }`}
            aria-hidden="true"
          />
          <span
            className={`h-0.5 w-full bg-gray-900 transition-all dark:bg-white ${
              isOpen ? 'opacity-0' : ''
            }`}
            aria-hidden="true"
          />
          <span
            className={`h-0.5 w-full bg-gray-900 transition-all dark:bg-white ${
              isOpen ? '-translate-y-1.5 -rotate-45' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu */}
      <nav
        ref={navRef}
        id="mobile-navigation"
        className={`fixed right-0 top-0 z-40 h-full w-64 transform bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-gray-800 lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex h-full flex-col p-6 pt-20">
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {role} Menu
            </p>
          </div>

          <ul className="space-y-2" role="list">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={toggleMenu}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.icon && <span className="text-xl" role="img" aria-label={`${item.label} icon`}>{item.icon}</span>}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto">
            <Link
              href="/settings"
              onClick={toggleMenu}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Go to settings"
            >
              <span role="img" aria-label="Settings icon">⚙️</span> Settings
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
