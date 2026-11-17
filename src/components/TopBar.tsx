import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { FacultyMember, WorkspaceView } from '../types/campus';

interface TopBarProps {
  activeView: WorkspaceView;
  onNavigate: (view: WorkspaceView) => void;
  loggedInFaculty: FacultyMember | null;
  onOpenLogin: () => void;
  onSignOut: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onNavigate,
  loggedInFaculty,
  onOpenLogin,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: WorkspaceView; label: string }[] = [
    { id: 'locator', label: 'Find Faculty' },
    { id: 'blocks', label: 'Campus Blocks' },
    { id: 'daily', label: 'Daily Schedule' },
    { id: 'manager', label: 'Timetable Manager' },
  ];

  const handleNavClick = (view: WorkspaceView) => {
    setMobileMenuOpen(false);
    if (view === 'manager' && !loggedInFaculty) {
      onOpenLogin();
      return;
    }
    onNavigate(view);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('locator')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          Smart Campus
        </button>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded ${
                  isActive
                    ? 'text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[21px] h-0.5 bg-blue-700"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {loggedInFaculty ? (
            <button
              type="button"
              onClick={onSignOut}
              className="hidden md:inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Sign Out · {loggedInFaculty.name.split(' ').slice(0, 2).join(' ')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="hidden md:inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Faculty Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex min-h-[44px] items-center justify-between rounded-lg px-3 text-left text-sm font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="mt-2 border-t border-slate-100 pt-2">
              {loggedInFaculty ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Sign Out ({loggedInFaculty.name})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Faculty Sign In
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
