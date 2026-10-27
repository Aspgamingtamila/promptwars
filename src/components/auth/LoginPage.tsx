import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const demoMode = import.meta.env.DEV
    && typeof window !== 'undefined'
    && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const ok = await signIn(email.trim(), password);
      if (!ok) {
        setError('Sign-in failed. Check the demo credentials and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo-only');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="p-8 text-center bg-surface-container-low/50 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <span className="material-symbols-outlined text-[28px]">swap_horiz</span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">ShiftBridge</h1>
          <p className="text-xs font-semibold text-primary-container uppercase tracking-wider mt-1">
            Dual-Sector Workforce Coordination
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Higher Education &amp; Hospital Non-Clinical Support System
          </p>
        </div>

        {!demoMode ? (
          <div className="p-8">
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <h2 className="font-bold">Secure sign-in is not configured</h2>
              <p className="mt-2">
                This prototype has no production authentication or server-backed data layer. Demo accounts are disabled in production builds. Do not use it with real staff or operational data.
              </p>
            </div>
          </div>
        ) : (
        /* Form Body */
        <div className="p-8 space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            Development demo only. The demo password is public and does not protect real data.
          </div>
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@shiftbridge.org"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary-container hover:bg-primary text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Local-only demo account selector */}
          <div className="pt-4 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Local Demo Accounts
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@shiftbridge.org')}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-amber-950 block">Operations Admin</span>
                  <span className="text-[11px] text-amber-800 font-mono">admin@shiftbridge.org</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                  Fill
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('staff.campus@shiftbridge.org')}
                className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/60 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-teal-950 block">Campus Facilities Staff</span>
                  <span className="text-[11px] text-teal-800 font-mono">staff.campus@shiftbridge.org</span>
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-200/60 px-2 py-0.5 rounded-full">
                  Fill
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('staff.hospital@shiftbridge.org')}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/60 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-indigo-950 block">Hospital Environmental Staff</span>
                  <span className="text-[11px] text-indigo-800 font-mono">staff.hospital@shiftbridge.org</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-200/60 px-2 py-0.5 rounded-full">
                  Fill
                </span>
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
