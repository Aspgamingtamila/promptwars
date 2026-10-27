import React from 'react';
import { cn } from '../../lib/utils';
import { useInstitution } from '../../context/InstitutionContext';

export type AdminTab =
  | 'overview-command'
  | 'shift-roster'
  | 'operational-tasks'
  | 'shift-handovers'
  | 'staff-management'
  | 'work-areas'
  | 'audit-events';

interface SidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { terminology, institutionType } = useInstitution();

  const navItems: { id: AdminTab; label: string; icon: string; section: 'operations' | 'infra' }[] = [
    { id: 'overview-command', label: 'Overview / Command', icon: 'grid_view', section: 'operations' },
    { id: 'shift-roster', label: 'Shift Roster & Coverage', icon: 'calendar_today', section: 'operations' },
    { id: 'operational-tasks', label: 'Operational Tasks', icon: 'checklist', section: 'operations' },
    { id: 'shift-handovers', label: 'Shift Handovers', icon: 'sync_alt', section: 'operations' },
    { id: 'staff-management', label: 'Staff Management', icon: 'group', section: 'infra' },
    { id: 'work-areas', label: 'Work Areas', icon: 'domain', section: 'infra' },
    { id: 'audit-events', label: 'Compliance Audit Trail', icon: 'policy', section: 'infra' }
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-slate-200/80">
      {/* Brand Header */}
      <div className="h-16 px-space-md flex items-center gap-space-sm bg-surface-container-lowest border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
          <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
        </div>
        <div className="flex flex-col">
          <span className="font-title-md text-title-md text-on-surface tracking-tight leading-none font-bold">
            ShiftBridge
          </span>
          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold mt-0.5">
            Workforce Core
          </span>
        </div>
      </div>

      {/* Active Console Banner */}
      <div className="px-space-md py-2.5 bg-surface-container-low border-b border-slate-100">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-sm text-[11px] uppercase tracking-wider font-semibold">Active Console</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
            Live Ops
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-space-sm py-space-md space-y-1 overflow-y-auto">
        <div className="px-space-sm pb-space-xs font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
          Operations Command
        </div>
        {navItems
          .filter(item => item.section === 'operations')
          .map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-space-sm px-space-md py-2.5 rounded-xl transition-all text-left',
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                )}
                type="button"
              >
                <span className={cn('material-symbols-outlined text-[20px]', isActive ? 'text-on-primary' : 'text-slate-500')}>
                  {item.icon}
                </span>
                <span className="text-[13.5px] leading-snug">{item.label}</span>
              </button>
            );
          })}

        <div className="pt-space-md px-space-sm pb-space-xs font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
          Workforce &amp; Infrastructure
        </div>
        {navItems
          .filter(item => item.section === 'infra')
          .map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-space-sm px-space-md py-2.5 rounded-xl transition-all text-left',
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                )}
                type="button"
              >
                <span className={cn('material-symbols-outlined text-[20px]', isActive ? 'text-on-primary' : 'text-slate-500')}>
                  {item.icon}
                </span>
                <span className="text-[13.5px] leading-snug">{item.label}</span>
              </button>
            );
          })}
      </nav>

      {/* Dispatch Sync Status Footer */}
      <div className="p-space-md bg-surface-container-lowest border-t border-slate-100">
        <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-slate-200/60">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase font-bold">Dispatch Sync</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          </div>
          <span className="text-[12px] font-medium text-on-surface truncate">
            {institutionType === 'school_college' ? 'Campus Support Zone #1-6' : 'Hospital Non-Clinical Corridors'}
          </span>
          <span className="text-[11px] text-slate-500 truncate font-mono">
            {terminology.facilityCode}
          </span>
        </div>
      </div>
    </aside>
  );
};
