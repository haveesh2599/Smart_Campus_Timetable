import React, { useState } from 'react';
import { Lock, Mail, X } from 'lucide-react';
import { Department, FacultyMember } from '../types/campus';
import { FacultyAvatar } from './FacultyAvatar';

interface FacultyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyList: FacultyMember[];
  departments: Department[];
  onLoginSuccess: (faculty: FacultyMember) => void;
}

export const FacultyLoginModal: React.FC<FacultyLoginModalProps> = ({
  isOpen,
  onClose,
  facultyList,
  departments,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('arjun.sharma@smartcampus.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const matched = facultyList.find(
      (f) => f.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!matched) {
      setErrorMessage(
        'No authorized faculty record matches that email. Select a faculty account below or enter a valid @smartcampus.edu address.'
      );
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your password to sign in.');
      return;
    }

    onLoginSuccess(matched);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="faculty-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2
              id="faculty-login-title"
              className="font-display text-xl font-bold text-slate-900"
            >
              Faculty Portal Sign In
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Authorized access for timetable management and schedule updates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="faculty-email"
              className="block text-xs font-semibold text-slate-700"
            >
              Faculty Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="faculty-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@smartcampus.edu"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="faculty-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="faculty-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Sign In to Timetable Manager
          </button>
        </form>

        {/* Quick account switcher for UI prototype demonstration */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 rounded-b-xl">
          <p className="text-xs font-semibold text-slate-600">
            Quick Demo Accounts
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Select a faculty member to preview the authorized timetable console.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {facultyList.slice(0, 3).map((faculty) => {
              const dept = departments.find((d) => d.id === faculty.departmentId);
              return (
                <button
                  key={faculty.id}
                  type="button"
                  onClick={() => onLoginSuccess(faculty)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FacultyAvatar
                      name={faculty.name}
                      avatarUrl={faculty.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {faculty.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {dept?.code} · {faculty.email}
                      </p>
                    </div>
                  </div>
                  <span className="ml-2 shrink-0 text-xs font-semibold text-blue-700">
                    Continue
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
