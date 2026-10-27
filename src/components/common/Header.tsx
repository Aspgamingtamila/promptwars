import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInstitution } from '../../context/InstitutionContext';
import { formatDate } from '../../lib/utils';
import { StaffProfile } from '../../types';

interface HeaderProps {
  onToggleViewMode?: () => void;
  isStaffPreview?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleViewMode, isStaffPreview = false }) => {
  const { currentUser, switchUser, signOut, availableDemoUsers } = useAuth();
  const { institutionType, setInstitutionType, resetAllData } = useInstitution();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const todayStr = formatDate(new Date().toISOString());

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md z-40 flex items-center justify-between px-4 lg:px-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-slate-200/80">
      {/* Left: Dual Sector Switcher & Date */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center p-0.5 rounded-xl bg-surface-container-high border border-slate-200">
          <button
            onClick={() => setInstitutionType('school_college')}
            className={`px-3 py-1.5 rounded-lg font-label-md text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
              institutionType === 'school_college'
                ? 'bg-surface-container-lowest text-on-surface shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                institutionType === 'school_college' ? 'bg-primary-container' : 'bg-slate-400'
              }`}
            />
            <span>Colleges &amp; Schools</span>
          </button>
          <button
            onClick={() => setInstitutionType('hospital')}
            className={`px-3 py-1.5 rounded-lg font-label-md text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
              institutionType === 'hospital'
                ? 'bg-surface-container-lowest text-on-surface shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                institutionType === 'hospital' ? 'bg-primary-container' : 'bg-slate-400'
              }`}
            />
            <span>Hospitals (Non-Clinical)</span>
          </button>
        </div>

        <div className="hidden xl:flex items-center gap-2 pl-2 text-on-surface-variant text-[13px]">
          <span className="material-symbols-outlined text-[18px] text-primary-container">event_available</span>
          <span className="font-data-tabular tabular-nums font-medium text-slate-700">
            {todayStr} • Live Operational Cycle
          </span>
        </div>
      </div>

      {/* Right Controls: Demo User Switcher & Profile */}
      <div className="flex items-center gap-3">
        {/* Reset Seed Button */}
        <button
          onClick={() => {
            if (window.confirm('Reset all shifts, attendance, and tasks back to initial seed data?')) {
              resetAllData();
              window.location.reload();
            }
          }}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition-colors border border-slate-200"
          title="Reset sample records to default demo state"
          type="button"
        >
          <span className="material-symbols-outlined text-[14px]">restart_alt</span>
          <span>Reset Demo</span>
        </button>

        {/* Switch Persona Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-container-low transition-colors border border-slate-200/80 bg-white shadow-xs"
            type="button"
            aria-expanded={showUserDropdown}
          >
            <img
              alt={currentUser?.full_name || 'Profile'}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
              src={
                currentUser?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
            />
            <div className="flex flex-col text-left pr-1 hidden sm:flex">
              <span className="font-label-md text-[13px] font-bold text-on-surface leading-tight">
                {currentUser?.full_name}
              </span>
              <span className="text-[11px] font-medium text-on-surface-variant leading-tight capitalize">
                {currentUser?.role === 'admin' ? 'Operations Admin' : currentUser?.job_title}
              </span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-slate-400">
              {showUserDropdown ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* User Switcher Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Demo Persona Switcher
                </span>
                <span className="text-[11px] text-slate-500">
                  Switch roles instantly to test RBAC &amp; permissions.
                </span>
              </div>

              <div className="space-y-1">
                {availableDemoUsers.map(user => {
                  const isCurrent = user.id === currentUser?.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user);
                        setShowUserDropdown(false);
                      }}
                      disabled={!user.active}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors ${
                        isCurrent
                          ? 'bg-primary-container/10 border border-primary-container/30 text-primary-container'
                          : user.active
                          ? 'hover:bg-slate-50 text-slate-700'
                          : 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                      }`}
                      type="button"
                    >
                      <img
                        src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={user.full_name}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold truncate">{user.full_name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                              user.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 truncate block">
                          {user.job_title} {!user.active && '(Deactivated)'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 mt-2 pt-1">
                <button
                  onClick={() => {
                    signOut();
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
