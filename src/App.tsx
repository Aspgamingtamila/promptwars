import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useInstitution } from './context/InstitutionContext';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar, AdminTab } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { StaffBottomNav, StaffTab } from './components/common/StaffBottomNav';

// Admin Views
import { OverviewDeck } from './components/admin/OverviewDeck';
import { ShiftRoster } from './components/admin/ShiftRoster';
import { TaskManagement } from './components/admin/TaskManagement';
import { HandoverDeck } from './components/admin/HandoverDeck';
import { StaffManagement } from './components/admin/StaffManagement';
import { WorkAreas } from './components/admin/WorkAreas';
import { AuditEvents } from './components/admin/AuditEvents';

// Staff Views
import { StaffDashboard } from './components/staff/StaffDashboard';
import { StaffTasks } from './components/staff/StaffTasks';
import { StaffHandovers } from './components/staff/StaffHandovers';
import { StaffProfile } from './components/staff/StaffProfile';

export const AppContent: React.FC = () => {
  const { currentUser, isAdmin, isStaff } = useAuth();
  const { terminology } = useInstitution();

  // Admin Tab State
  const [adminTab, setAdminTab] = useState<AdminTab>('overview-command');

  // Staff Tab State
  const [staffTab, setStaffTab] = useState<StaffTab>('my-shift');

  // Preview Mode for Admin to preview Staff View
  const [adminStaffPreview, setAdminStaffPreview] = useState(false);

  if (!currentUser) {
    return <LoginPage />;
  }

  // --- STAFF ROLE INTERFACE ---
  if (isStaff || (isAdmin && adminStaffPreview)) {
    return (
      <div className="min-h-screen bg-surface flex flex-col antialiased">
        {/* Header with Mode Toggle and Persona Switcher */}
        <Header />

        {/* Staff Preview Return Banner (if admin) */}
        {isAdmin && adminStaffPreview && (
          <div className="pt-16 px-4 py-2 bg-amber-500 text-amber-950 font-bold text-xs flex items-center justify-between z-30">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Supervisor Preview Mode: Viewing mobile console as field staff</span>
            </div>
            <button
              onClick={() => setAdminStaffPreview(false)}
              className="px-2 py-0.5 bg-amber-900 text-white rounded text-[11px] font-bold"
              type="button"
            >
              Exit Preview &rarr;
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 px-4 py-5 ${isAdmin && adminStaffPreview ? 'pt-2' : 'pt-20'} max-w-4xl w-full mx-auto`}>
          {staffTab === 'my-shift' && <StaffDashboard onNavigateTab={setStaffTab} />}
          {staffTab === 'my-tasks' && <StaffTasks />}
          {staffTab === 'handovers' && <StaffHandovers />}
          {staffTab === 'profile' && <StaffProfile />}
        </main>

        {/* Bottom Navigation for Staff */}
        <StaffBottomNav activeTab={staffTab} onTabChange={setStaffTab} />
      </div>
    );
  }

  // --- ADMIN / OPERATIONS COMMAND INTERFACE ---
  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans antialiased text-on-surface">
      {/* Desktop Sidebar Navigation */}
      <Sidebar activeTab={adminTab} onTabChange={setAdminTab} />

      {/* Main Container */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Fixed Header */}
        <Header />

        {/* Breadcrumb / Mode Bar */}
        <div className="pt-16">
          <div className="w-full px-4 lg:px-6 py-2.5 bg-surface-container-lowest border-b border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] font-semibold">
              <span className="text-slate-400">ShiftBridge</span>
              <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
              <span className="text-slate-400">Command Deck</span>
              <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
              <span className="text-primary-container font-bold uppercase tracking-wider">
                {adminTab.replace('-', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdminStaffPreview(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold border border-teal-200 transition-colors"
                type="button"
                title="Preview staff mobile view"
              >
                <span className="material-symbols-outlined text-[14px]">smartphone</span>
                <span className="hidden sm:inline">Preview Staff Console</span>
              </button>

              <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface-container text-slate-600 text-[11px] font-medium border border-slate-200">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">verified_user</span>
                <span>Operations Admin Override Enabled</span>
              </div>
            </div>
          </div>

          {/* Main Operational View */}
          <main className="w-full px-4 lg:px-6 py-6 bg-surface flex-1">
            {adminTab === 'overview-command' && (
              <OverviewDeck
                onNavigateTab={setAdminTab}
                onOpenCreateShift={() => setAdminTab('shift-roster')}
                onOpenCreateHandover={() => setAdminTab('shift-handovers')}
              />
            )}
            {adminTab === 'shift-roster' && <ShiftRoster />}
            {adminTab === 'operational-tasks' && <TaskManagement />}
            {adminTab === 'shift-handovers' && <HandoverDeck />}
            {adminTab === 'staff-management' && <StaffManagement />}
            {adminTab === 'work-areas' && <WorkAreas />}
            {adminTab === 'audit-events' && <AuditEvents />}
          </main>
        </div>
      </div>
    </div>
  );
};
