'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Wallet, PieChart, BarChart3, Settings, Sparkles } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Accounts', href: '/accounts', icon: Wallet },
  { name: 'Budgets', href: '/budgets', icon: PieChart },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Quick Parse', href: '/parser', icon: Sparkles },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 border-r border-border bg-card/80 backdrop-blur-xl p-6 sticky top-0 h-screen shadow-sm">
        <div className="flex items-center gap-3.5 mb-10 px-2">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/25">
            S
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight">Saku</h1>
            <p className="text-xs text-muted font-medium">Private Finance PWA</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1'
                    : 'text-muted hover:bg-muted/10 hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-border text-xs text-muted font-medium">
          <p className="font-bold text-foreground">Saku v1.0</p>
          <p className="mt-0.5">100% Client-Side Encrypted</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0">
        <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              S
            </div>
            <span className="font-extrabold text-lg">Saku</span>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/85 backdrop-blur-2xl z-30 px-3 py-2.5 flex justify-around items-center shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all ${
                isActive ? 'text-primary font-extrabold scale-105' : 'text-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}
        <Link
          href="/parser"
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl text-primary font-bold"
        >
          <Sparkles className="h-5 w-5 mb-1" />
          <span className="text-[10px] tracking-tight">Parser</span>
        </Link>
      </nav>
    </div>
  );
}