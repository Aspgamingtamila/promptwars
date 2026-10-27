import React from 'react';
import { cn } from '../../lib/utils';

export type StaffTab = 'my-shift' | 'my-tasks' | 'handovers' | 'profile';

interface StaffBottomNavProps {
  activeTab: StaffTab;
  onTabChange: (tab: StaffTab) => void;
  pendingTasksCount?: number;
  openHandoversCount?: number;
}

export const StaffBottomNav: React.FC<StaffBottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingTasksCount = 0,
  openHandoversCount = 0
}) => {
  const tabs: { id: StaffTab; label: string; icon: string; badge?: number }[] = [
    { id: 'my-shift', label: 'My Shift', icon: 'schedule' },
    { id: 'my-tasks', label: 'My Tasks', icon: 'checklist', badge: pendingTasksCount },
    { id: 'handovers', label: 'Handovers', icon: 'sync_alt', badge: openHandoversCount },
    { id: 'profile', label: 'Profile', icon: 'account_circle' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-around px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all relative',
              isActive
                ? 'text-primary-container font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            )}
            type="button"
          >
            <div className="relative">
              <span className={cn('material-symbols-outlined text-[24px]', isActive ? 'text-primary-container scale-110' : 'text-slate-400')}>
                {tab.icon}
              </span>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-4 text-center leading-tight">
                  {tab.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[11px] tracking-tight mt-0.5 leading-none">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
