import React, { useState } from 'react';
import { useInstitution } from '../../context/InstitutionContext';
import { storageEngine, useStorageSubscription } from '../../lib/storageEngine';
import { StatusBadge } from '../common/StatusBadge';
import { AdminTab } from '../common/Sidebar';

interface OverviewDeckProps {
  onNavigateTab: (tab: AdminTab) => void;
  onOpenCreateShift: () => void;
  onOpenCreateHandover: () => void;
}

export const OverviewDeck: React.FC<OverviewDeckProps> = ({
  onNavigateTab,
  onOpenCreateShift,
  onOpenCreateHandover
}) => {
  useStorageSubscription();
  const { terminology, institutionType, toggleInstitutionType } = useInstitution();
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Fetch live operational records from storageEngine
  const shifts = storageEngine.listShifts({ institutionType });
  const tasks = storageEngine.listTasks({ institutionType });
  const handovers = storageEngine.listHandovers();
  const workAreas = storageEngine.listWorkAreas(institutionType).filter(a => a.active);

  // Computed metrics
  const activeShiftsCount = shifts.filter(s => s.status !== 'Cancelled').length;
  
  // Understaffed shifts: shifts with 0 assignments
  const understaffedShiftsCount = shifts.filter(
    s => s.status !== 'Cancelled' && (!s.assignments || s.assignments.length === 0)
  ).length;

  // Attendance metrics
  let totalAssignedRosters = 0;
  let checkedInCount = 0;
  shifts.forEach(s => {
    if (s.status !== 'Cancelled' && s.assignments) {
      totalAssignedRosters += s.assignments.length;
      s.assignments.forEach(a => {
        if (a.attendance?.status === 'Checked In') {
          checkedInCount++;
        }
      });
    }
  });
  const attendanceRate = totalAssignedRosters > 0 
    ? Math.round((checkedInCount / totalAssignedRosters) * 100) 
    : 100;

  // Tasks metrics
  const openTasksCount = tasks.filter(t => t.status !== 'Done').length;
  const blockedTasks = tasks.filter(t => t.status === 'Blocked');

  // Handover metrics
  const unresolvedHandovers = handovers.filter(h => h.status !== 'Resolved');
  const criticalHandovers = unresolvedHandovers.filter(h => h.priority === 'Critical' || h.priority === 'High');

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* 1. Operational Header Strip */}
      <section className="w-full bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
              Live Dispatch Core
            </span>
            <span className="font-mono text-slate-500 text-[12px] font-medium">
              Facility Code: {terminology.facilityCode}
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-slate-600 text-[13px] font-semibold">
              <span className="material-symbols-outlined text-[16px] text-primary-container">schedule</span>
              Morning Cycle (07:00 – 15:30)
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
            {terminology.orgName}
          </h1>
          <p className="text-sm text-slate-500">{terminology.subtitle}</p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={onOpenCreateHandover}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[13px] transition-colors border border-slate-200"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-700">swap_horiz</span>
            <span>+ Log Handover</span>
          </button>
          <button
            onClick={onOpenCreateShift}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-white font-semibold text-[13px] shadow-sm transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_task</span>
            <span>+ Create Shift</span>
          </button>
        </div>
      </section>

      {/* 2. Dual Sector Mode Switcher Demo Callout */}
      <div className="w-full bg-[#f0f4f8] p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-600/10 flex items-center justify-center text-teal-800 shrink-0">
            <span className="material-symbols-outlined text-[24px]">domain_verification</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-slate-900">Dual-Sector Architecture Preview</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                System Sandbox
              </span>
            </div>
            <span className="text-[12px] text-slate-600 mt-0.5">
              Quick toggle view between higher education facilities management and hospital environmental sanitation support.
            </span>
          </div>
        </div>

        <div className="inline-flex items-center p-1 rounded-xl bg-white shadow-xs border border-slate-200 shrink-0">
          <button
            onClick={() => institutionType !== 'school_college' && toggleInstitutionType()}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all ${
              institutionType === 'school_college'
                ? 'bg-primary-container text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span>Colleges &amp; Schools</span>
          </button>
          <button
            onClick={() => institutionType !== 'hospital' && toggleInstitutionType()}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all ${
              institutionType === 'hospital'
                ? 'bg-primary-container text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">local_hospital</span>
            <span>Hospitals (Non-Clinical)</span>
          </button>
        </div>
      </div>

      {/* 3. Operational Alert Callout Strip */}
      {!alertDismissed && (
        <div className="w-full bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-700">warning</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-[13px] font-bold text-amber-900">Immediate Attention:</span>
              <span className="text-[13px] text-amber-900">
                {understaffedShiftsCount > 0
                  ? `${understaffedShiftsCount} scheduled shift slot(s) currently unassigned in today's cycle.`
                  : blockedTasks.length > 0
                  ? `${blockedTasks.length} operational line item(s) currently marked Blocked requiring supervisor intervention.`
                  : 'Roster coverage and safety threshold standards fully compliant across all zones.'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => onNavigateTab('shift-roster')}
              className="px-3 py-1 rounded-lg bg-white text-amber-900 hover:bg-amber-100/50 text-[12px] font-bold shadow-xs border border-amber-200 transition-colors"
              type="button"
            >
              Rebalance Deck
            </button>
            <button
              onClick={() => setAlertDismissed(true)}
              className="p-1 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-100/50"
              title="Dismiss notice"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Four Interactive Live Metric Summary Cards (Bento Grid) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: Scheduled Shifts */}
        <div
          onClick={() => onNavigateTab('shift-roster')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Operations</span>
              <h3 className="text-[15px] font-bold text-slate-800 mt-0.5">Today’s Scheduled Shifts</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
          </div>
          <div className="my-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                {activeShiftsCount}
              </span>
              <span className="text-xs font-medium text-slate-500">Rosters Active</span>
            </div>
            {understaffedShiftsCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                {understaffedShiftsCount} Unassigned
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Full Coverage
              </span>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[12px]">
            <span>View detailed roster</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </div>

        {/* Metric 2: Checked In Staff */}
        <div
          onClick={() => onNavigateTab('shift-roster')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Attendance</span>
              <h3 className="text-[15px] font-bold text-slate-800 mt-0.5">Staff Checked In</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
          </div>
          <div className="my-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                {checkedInCount}
              </span>
              <span className="text-xs font-medium text-slate-500">of {totalAssignedRosters} Assigned</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold">
              {attendanceRate}% Present
            </span>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[12px]">
            <span>Review attendance logs</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </div>

        {/* Metric 3: Open Task Backlog */}
        <div
          onClick={() => onNavigateTab('operational-tasks')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Execution Progress</span>
              <h3 className="text-[15px] font-bold text-slate-800 mt-0.5">Open Task Items</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">checklist</span>
            </div>
          </div>
          <div className="my-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                {openTasksCount}
              </span>
              <span className="text-xs font-medium text-slate-500">Incomplete</span>
            </div>
            {blockedTasks.length > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                {blockedTasks.length} Blocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                0 Blockers
              </span>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[12px]">
            <span>Open tasks board</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </div>

        {/* Metric 4: Active Shift Handovers */}
        <div
          onClick={() => onNavigateTab('shift-handovers')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shift Transition</span>
              <h3 className="text-[15px] font-bold text-slate-800 mt-0.5">Active Handovers</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">sync_alt</span>
            </div>
          </div>
          <div className="my-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                {unresolvedHandovers.length}
              </span>
              <span className="text-xs font-medium text-slate-500">Unresolved Logs</span>
            </div>
            {criticalHandovers.length > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                {criticalHandovers.length} High/Crit
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                Normal priority
              </span>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[12px]">
            <span>Review transition log</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </div>
      </section>

      {/* 5. Work Area Coverage Matrix */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Zone Coverage &amp; Shift Assignments</h2>
            <p className="text-xs text-slate-500">Active roster distribution across {terminology.areaLabel}</p>
          </div>
          <button
            onClick={() => onNavigateTab('shift-roster')}
            className="text-xs font-bold text-primary-container hover:underline flex items-center gap-1"
            type="button"
          >
            <span>View Complete Roster</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workAreas.map(area => {
            const areaShifts = shifts.filter(s => s.work_area_id === area.id && s.status !== 'Cancelled');
            const totalAssignedInArea = areaShifts.reduce((acc, s) => acc + (s.assignments?.length || 0), 0);

            return (
              <div
                key={area.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-1">{area.name}</h4>
                    {totalAssignedInArea > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold shrink-0">
                        {totalAssignedInArea} Staff
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0">
                        Unfilled
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{area.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-medium">
                    {areaShifts.length} {areaShifts.length === 1 ? 'Shift' : 'Shifts'} Scheduled
                  </span>
                  <button
                    onClick={() => onNavigateTab('shift-roster')}
                    className="text-primary-container font-bold hover:underline"
                    type="button"
                  >
                    Manage
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Two-Column Split: Blocked Items Spotlight & Recent Handovers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Urgent Blocked Tasks */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">block</span>
                <h3 className="text-base font-bold text-slate-900">Blocked Line Items Spotlight</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                {blockedTasks.length} Issues
              </span>
            </div>

            {blockedTasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-emerald-600 text-[28px] mb-1">check_circle</span>
                <p className="text-xs font-bold text-slate-800">Zero Blocked Tasks</p>
                <p className="text-[11px] text-slate-500 mt-0.5">All scheduled operations executing smoothly without impediment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-900">{task.title}</span>
                      <StatusBadge status="Blocked" />
                    </div>
                    <div className="text-[12px] text-amber-900 bg-amber-100/60 p-2 rounded-lg border border-amber-200/60 font-medium">
                      <span className="font-bold">Reason:</span> {task.block_reason}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Area: {task.work_area?.name}</span>
                      <button
                        onClick={() => onNavigateTab('operational-tasks')}
                        className="text-primary-container font-bold hover:underline"
                        type="button"
                      >
                        Resolve in Tasks &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right: Active Handover Transition Queue */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[20px]">sync_alt</span>
                <h3 className="text-base font-bold text-slate-900">Shift Handover Transition Queue</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold">
                {unresolvedHandovers.length} Pending
              </span>
            </div>

            {unresolvedHandovers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-emerald-600 text-[28px] mb-1">done_all</span>
                <p className="text-xs font-bold text-slate-800">All Handovers Resolved</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Shift transitions are clear with no pending equipment or hazard items.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unresolvedHandovers.slice(0, 3).map(handover => (
                  <div
                    key={handover.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-900">{handover.title}</span>
                      <StatusBadge status={handover.status} />
                    </div>
                    <p className="text-[12px] text-slate-600 line-clamp-2">
                      {handover.ai_summary || handover.description}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Logged by: {handover.creator?.full_name || 'Staff'}</span>
                      <button
                        onClick={() => onNavigateTab('shift-handovers')}
                        className="text-primary-container font-bold hover:underline"
                        type="button"
                      >
                        Action Handover &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
