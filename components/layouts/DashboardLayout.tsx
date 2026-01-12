'use client';

import { ReactNode } from 'react';
import { MobileNav } from '@/components/ui/MobileNav';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  title?: string;
  subtitle?: string;
}

const navItems = {
  STUDENT: [
    { label: 'Dashboard', href: '/student', icon: '🏠' },
    { label: 'Lessons', href: '/student/lessons', icon: '📚' },
    { label: 'Chat', href: '/student/chat', icon: '💬' },
    { label: 'Leaderboard', href: '/student/leaderboard', icon: '🏆' },
    { label: 'Achievements', href: '/student/achievements', icon: '🎖️' },
    { label: 'Transactions', href: '/student/transactions', icon: '💰' },
  ],
  TEACHER: [
    { label: 'Dashboard', href: '/teacher', icon: '🏠' },
    { label: 'Create Lesson', href: '/teacher/create-lesson', icon: '✏️' },
    { label: 'My Lessons', href: '/teacher/lessons', icon: '📚' },
    { label: 'Students', href: '/teacher/students', icon: '👥' },
  ],
  ADMIN: [
    { label: 'Dashboard', href: '/admin', icon: '🏠' },
    { label: 'Users', href: '/admin/users', icon: '👥' },
    { label: 'Subjects', href: '/admin/subjects', icon: '📖' },
    { label: 'Experts', href: '/admin/experts', icon: '🤖' },
    { label: 'Content', href: '/admin/content', icon: '📝' },
  ],
};

export function DashboardLayout({ children, role, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Navigation */}
      <MobileNav items={navItems[role]} role={role} />

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 lg:block">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            AILesson
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{role}</p>
        </div>

        <nav className="space-y-2">
          {navItems[role].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <a
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ⚙️ Settings
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        <ResponsiveContainer className="py-6 lg:py-8">
          {(title || subtitle) && (
            <div className="mb-6 lg:mb-8">
              {title && (
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 lg:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </ResponsiveContainer>
      </main>
    </div>
  );
}
