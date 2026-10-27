import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInstitution } from '../../context/InstitutionContext';
import { storageEngine } from '../../lib/storageEngine';
import { formatDate } from '../../lib/utils';
import { Avatar } from '../common/Avatar';

export const StaffProfile: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const { terminology } = useInstitution();

  const myShifts = storageEngine.listShifts({ staffProfileId: currentUser?.id });
  const myTasks = storageEngine.listTasks({ staffProfileId: currentUser?.id });
  const doneTasks = myTasks.filter(t => t.status === 'Done');

  return (
    <div className="flex flex-col w-full space-y-5 pb-20 max-w-xl mx-auto">
      {/* Profile Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
        <Avatar name={currentUser?.full_name} role={currentUser?.role} size="xl" className="!h-20 !w-20 !text-2xl mb-3 ring-4 shadow-md" />
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{currentUser?.full_name}</h2>
        <span className="text-xs font-semibold text-slate-500 mt-0.5">{currentUser?.job_title}</span>
        <span className="mt-2 px-3 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold uppercase tracking-wider">
          {currentUser?.role === 'admin' ? 'Operations Admin' : 'Field Staff Member'}
        </span>

        {/* Stats Strip */}
        <div className="w-full grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums block">
              {myShifts.length}
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Shifts</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums block">
              {doneTasks.length}
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Tasks</span>
          </div>
        </div>
      </div>

      {/* Details List */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Profile Details</h3>

        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
          <span className="text-slate-500">Email Address (Login):</span>
          <span className="font-mono font-bold text-slate-800">{currentUser?.email}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
          <span className="text-slate-500">Contact Phone:</span>
          <span className="font-mono text-slate-800">{currentUser?.phone || 'Not recorded'}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
          <span className="text-slate-500">Assigned Organization:</span>
          <span className="font-semibold text-slate-800">{terminology.orgName}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-500">Account Registered:</span>
          <span className="font-mono text-slate-600">{formatDate(currentUser?.created_at || '')}</span>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={signOut}
        className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
        type="button"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        <span>Sign Out of ShiftBridge</span>
      </button>
    </div>
  );
};
