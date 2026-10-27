import React, { useState } from 'react';
import { useInstitution } from '../../context/InstitutionContext';
import { useAuth } from '../../context/AuthContext';
import { storageEngine, useStorageSubscription } from '../../lib/storageEngine';
import { Shift, AttendanceStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { Avatar } from '../common/Avatar';
import {
  formatTime,
  formatDate,
  formatDuration,
  isOvernightShift,
  checkStaffShiftOverlap,
  exportToCSV,
  getErrorMessage
} from '../../lib/utils';

interface ShiftRosterProps {
  onOpenCreateShiftModal?: () => void;
}

export const ShiftRoster: React.FC<ShiftRosterProps> = () => {
  useStorageSubscription();
  const { terminology, institutionType } = useInstitution();
  const { currentUser } = useAuth();

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [areaFilter, setAreaFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [shiftToCancel, setShiftToCancel] = useState<Shift | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Attendance Correction Modal
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [activeAttendanceRecord, setActiveAttendanceRecord] = useState<{
    attendanceId: string;
    staffName: string;
    currentStatus: AttendanceStatus;
  } | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<AttendanceStatus>('Checked In');
  const [correctionReason, setCorrectionReason] = useState('');

  // Shift Form State
  const [formAreaId, setFormAreaId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('16:00');
  const [formIsOvernight, setFormIsOvernight] = useState(false);
  const [formSelectedStaff, setFormSelectedStaff] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formOverrideConfirmed, setFormOverrideConfirmed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Data Loading
  const allShifts = storageEngine.listShifts({ institutionType });
  const workAreas = storageEngine.listWorkAreas(institutionType).filter(a => a.active);
  const activeStaff = storageEngine.listProfiles().filter(p => p.active && p.role === 'staff');

  // Filter Shifts
  const filteredShifts = allShifts.filter(shift => {
    if (statusFilter !== 'All' && shift.status !== statusFilter) return false;
    if (areaFilter !== 'All' && shift.work_area_id !== areaFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = shift.title.toLowerCase().includes(q);
      const matchArea = shift.work_area?.name.toLowerCase().includes(q);
      const matchStaff = shift.assignments?.some(a => a.staff?.full_name.toLowerCase().includes(q));
      if (!matchTitle && !matchArea && !matchStaff) return false;
    }
    return true;
  });

  // Calculate Overlaps for form preview
  const calculatedStartsAt = `${selectedDate}T${formStartTime}:00Z`;
  const nextDay = new Date(new Date(selectedDate).getTime() + 86400000);
  const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
  const calculatedEndsAt = formIsOvernight
    ? `${nextDayStr}T${formEndTime}:00Z`
    : `${selectedDate}T${formEndTime}:00Z`;

  const overlapConflicts = formSelectedStaff
    .map(staffId => {
      const staffObj = activeStaff.find(s => s.id === staffId);
      return checkStaffShiftOverlap(
        allShifts,
        staffId,
        staffObj?.full_name || 'Staff',
        calculatedStartsAt,
        calculatedEndsAt
      );
    })
    .filter(Boolean);

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formAreaId) {
      setFormError('Please select a valid work area.');
      return;
    }
    if (!formTitle.trim()) {
      setFormError('Shift title is required.');
      return;
    }
    const startTimestamp = Date.parse(calculatedStartsAt);
    const endTimestamp = Date.parse(calculatedEndsAt);
    if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp) || endTimestamp <= startTimestamp) {
      setFormError('End time must be later than start time. Enable the overnight option if the shift crosses midnight.');
      return;
    }
    if (formSelectedStaff.length === 0) {
      setFormError('Please assign at least one staff member.');
      return;
    }
    if (overlapConflicts.length > 0 && !formOverrideConfirmed) {
      setFormError('Staff overlap conflict detected. Please review warning and confirm override.');
      return;
    }

    try {
      storageEngine.createShift(
        {
          organization_id: storageEngine.getOrganization().id,
          work_area_id: formAreaId,
          title: formTitle.trim(),
          institution_type: institutionType,
          starts_at: calculatedStartsAt,
          ends_at: calculatedEndsAt,
          status: 'Scheduled',
          notes: formNotes.trim() || null,
          created_by: currentUser?.id || 'user-admin-01',
          staffIds: formSelectedStaff
        },
        currentUser?.id || 'user-admin-01',
        overlapConflicts.length > 0 ? 'Supervisor confirmed manual override of scheduling overlap' : undefined
      );

      // Reset form & close
      setIsCreateModalOpen(false);
      setFormTitle('');
      setFormAreaId('');
      setFormSelectedStaff([]);
      setFormNotes('');
      setFormOverrideConfirmed(false);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Failed to create shift.'));
    }
  };

  const handleCancelShiftConfirm = () => {
    if (!shiftToCancel) return;
    if (!cancelReason.trim()) {
      alert('A cancellation reason is required.');
      return;
    }
    storageEngine.cancelShift(shiftToCancel.id, cancelReason.trim(), currentUser?.id || 'user-admin-01');
    setIsCancelModalOpen(false);
    setShiftToCancel(null);
    setCancelReason('');
  };

  const handleCorrectAttendanceConfirm = () => {
    if (!activeAttendanceRecord) return;
    if (!correctionReason.trim() || correctionReason.trim().length < 4) {
      alert('A descriptive correction reason (min 4 characters) is required for compliance.');
      return;
    }

    storageEngine.correctAttendance(
      activeAttendanceRecord.attendanceId,
      correctionStatus,
      correctionReason.trim(),
      currentUser?.id || 'user-admin-01'
    );
    setIsAttendanceModalOpen(false);
    setActiveAttendanceRecord(null);
    setCorrectionReason('');
  };

  const handleExportCSV = () => {
    const rows = filteredShifts.map(s => ({
      ID: s.id,
      Title: s.title,
      Area: s.work_area?.name || '',
      Date: formatDate(s.starts_at),
      Start: formatTime(s.starts_at),
      End: formatTime(s.ends_at),
      Status: s.status,
      Assignees: s.assignments?.map(a => a.staff?.full_name).join('; ') || 'Unassigned',
      Notes: s.notes || ''
    }));
    exportToCSV(`ShiftBridge_Roster_${institutionType}_${selectedDate}.csv`, rows);
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* 1. Header & Controls Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Shift Roster &amp; Coverage</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {filteredShifts.length} Shifts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational roster planning, overnight crossover tracking, and shift collision detection
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-white text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create Shift</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search shifts, areas, staff..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-800 focus:outline-none focus:border-primary-container"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 focus:outline-none focus:border-primary-container"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Area Filter */}
          <select
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 focus:outline-none focus:border-primary-container hidden sm:block"
          >
            <option value="All">All Zones ({workAreas.length})</option>
            {workAreas.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Navigator */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-end md:self-auto">
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
            }}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
            title="Previous Day"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <div className="px-2 text-[12px] font-bold text-slate-800 tabular-nums">
            {formatDate(selectedDate)}
          </div>
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
            }}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
            title="Next Day"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* 3. Shifts List */}
      {filteredShifts.length === 0 ? (
        <EmptyState
          icon="event_busy"
          title="No Shifts Found"
          description={`No shifts scheduled matching the current filters for ${terminology.areaLabel}.`}
          actionText="Create New Shift"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredShifts.map(shift => {
            const overnight = isOvernightShift(shift.starts_at, shift.ends_at);
            const duration = formatDuration(shift.starts_at, shift.ends_at);

            return (
              <div
                key={shift.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all overflow-hidden flex flex-col md:flex-row items-stretch"
              >
                {/* Left Accent Bar */}
                <div
                  className={`w-full md:w-2 shrink-0 ${
                    shift.status === 'Cancelled'
                      ? 'bg-rose-400'
                      : shift.status === 'In Progress'
                      ? 'bg-primary-container'
                      : 'bg-indigo-600'
                  }`}
                />

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  {/* Top Row: Title, Area, Time, Status */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 leading-tight">{shift.title}</h3>
                        <StatusBadge status={shift.status} />
                        {overnight && <StatusBadge status="Overnight" />}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">domain</span>
                          {shift.work_area?.name || 'Unassigned Area'}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-mono text-slate-700">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
                          {formatTime(shift.starts_at)} – {formatTime(shift.ends_at)} ({duration})
                        </span>
                      </div>
                      {shift.notes && (
                        <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {shift.notes}
                        </p>
                      )}
                    </div>

                    {/* Quick Shift Actions */}
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      {shift.status !== 'Cancelled' && (
                        <button
                          onClick={() => {
                            setShiftToCancel(shift);
                            setIsCancelModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                          type="button"
                        >
                          Cancel Shift
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Assigned Staff & Live Attendance Indicators */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Assigned Workforce ({shift.assignments?.length || 0}):
                      </span>

                      {!shift.assignments || shift.assignments.length === 0 ? (
                        <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          No staff assigned (Understaffed slot)
                        </span>
                      ) : (
                        shift.assignments.map(assignment => {
                          const staffName = assignment.staff?.full_name || 'Staff';
                          const attStatus = assignment.attendance?.status || 'Not Checked In';

                          return (
                            <div
                              key={assignment.id}
                              className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1"
                            >
                              <Avatar name={staffName} role={assignment.staff?.role} size="sm" className="!h-5 !w-5 !text-[8px]" />
                              <span className="text-[12px] font-bold text-slate-800">{staffName}</span>
                              <StatusBadge status={attStatus} size="sm" />

                              {/* Supervisor Attendance Correction Trigger */}
                              {assignment.attendance && (
                                <button
                                  onClick={() => {
                                    setActiveAttendanceRecord({
                                      attendanceId: assignment.attendance!.id,
                                      staffName,
                                      currentStatus: attStatus
                                    });
                                    setCorrectionStatus(attStatus);
                                    setIsAttendanceModalOpen(true);
                                  }}
                                  className="text-[10px] text-primary-container hover:underline ml-1 font-semibold"
                                  title="Auditable supervisor correction"
                                  type="button"
                                >
                                  Override
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CREATE SHIFT MODAL --- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Shift"
        subtitle={`Schedule workforce coverage for ${terminology.orgName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateShift} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* Work Area Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Work Area / Facility Zone *
            </label>
            <select
              value={formAreaId}
              onChange={e => setFormAreaId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              required
            >
              <option value="">-- Select Work Area --</option>
              {workAreas.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Shift Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Morning Sanitation & Facility Lockup"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              required
            />
          </div>

          {/* Times & Overnight Flag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={formStartTime}
                onChange={e => setFormStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={formEndTime}
                onChange={e => setFormEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
                required
              />
            </div>
          </div>

          {/* Overnight Crossover Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
            <input
              type="checkbox"
              checked={formIsOvernight}
              onChange={e => setFormIsOvernight(e.target.checked)}
              className="rounded text-primary-container focus:ring-0"
            />
            <div className="flex flex-col text-xs">
              <span className="font-bold">Overnight Shift (Spans Midnight)</span>
              <span className="text-[11px] text-purple-700">End time will land on the following calendar day.</span>
            </div>
          </label>

          {/* Staff Assignment Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Assign Staff Members ({formSelectedStaff.length} selected) *
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {activeStaff.map(staff => {
                const isSelected = formSelectedStaff.includes(staff.id);
                return (
                  <label
                    key={staff.id}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setFormSelectedStaff(formSelectedStaff.filter(id => id !== staff.id));
                          } else {
                            setFormSelectedStaff([...formSelectedStaff, staff.id]);
                          }
                        }}
                        className="rounded text-primary-container focus:ring-0"
                      />
                      <span className="text-xs font-semibold text-slate-800">{staff.full_name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{staff.job_title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Overlap Conflict Warning Banner */}
          {overlapConflicts.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[18px] text-amber-700">warning</span>
                <span>Scheduling Collision Detected!</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                {overlapConflicts.map((c, i) => (
                  <li key={i}>
                    <strong>{c?.staffName}</strong> is already assigned to shift{' '}
                    <em>"{c?.existingShift.title}"</em> (
                    {formatTime(c?.existingShift.starts_at || '')} - {formatTime(c?.existingShift.ends_at || '')})
                  </li>
                ))}
              </ul>
              <label className="flex items-center gap-2 pt-1 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formOverrideConfirmed}
                  onChange={e => setFormOverrideConfirmed(e.target.checked)}
                  className="rounded text-amber-700"
                />
                <span>Supervisor Override: Confirm duplicate assignment despite overlap.</span>
              </label>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Shift Instructions &amp; Protocols (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Check chemical inventory in Prep Bay before commencing..."
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-container hover:bg-primary text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Schedule Shift
            </button>
          </div>
        </form>
      </Modal>

      {/* --- CANCEL SHIFT MODAL --- */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Shift Cancellation"
        subtitle={`Cancelling: "${shiftToCancel?.title}"`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Please provide an operational rationale for cancelling this shift. This will be permanently recorded in
            the compliance audit trail.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Cancellation Reason *
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Facility closed due to weather advisory..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-rose-500"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              type="button"
            >
              Keep Shift
            </button>
            <button
              onClick={handleCancelShiftConfirm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              type="button"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>

      {/* --- SUPERVISOR ATTENDANCE CORRECTION MODAL --- */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Supervisor Attendance Correction"
        subtitle={`Staff: ${activeAttendanceRecord?.staffName}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            <strong>Auditable Event:</strong> Supervisors can correct attendance status if a worker had battery failure
            or verified physical presence. A formal reason is mandatory per PRD Section 6.3.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              New Attendance Status *
            </label>
            <select
              value={correctionStatus}
              onChange={e => setCorrectionStatus(e.target.value as AttendanceStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary-container"
            >
              <option value="Not Checked In">Not Checked In</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Absent">Absent (Manager Override)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Correction Reason (Mandatory Audit Requirement) *
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Staff phone battery died at 15:00; verified departure in person at facility gate."
              value={correctionReason}
              onChange={e => setCorrectionReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsAttendanceModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleCorrectAttendanceConfirm}
              className="px-4 py-2 bg-primary-container hover:bg-primary text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              type="button"
            >
              Save Correction
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
