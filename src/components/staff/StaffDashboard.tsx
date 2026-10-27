import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useInstitution } from '../../context/InstitutionContext';
import { storageEngine, useStorageSubscription } from '../../lib/storageEngine';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { formatTime, formatDate, formatDuration, isCheckInEligible } from '../../lib/utils';
import { TaskItem, TaskStatus, HandoverPriority } from '../../types';
import { summarizeHandover, validateNonClinicalHandover } from '../../lib/gemini';

interface StaffDashboardProps {
  onNavigateTab: (tab: 'my-shift' | 'my-tasks' | 'handovers' | 'profile') => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onNavigateTab }) => {
  useStorageSubscription();
  const { currentUser } = useAuth();
  const { terminology, institutionType } = useInstitution();

  const [activeTabSub, setActiveTabSub] = useState<'tasks' | 'handovers'>('tasks');

  // Modals
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [taskToBlock, setTaskToBlock] = useState<TaskItem | null>(null);
  const [blockerReasonInput, setBlockerReasonInput] = useState('');

  const [isDoneModalOpen, setIsDoneModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<TaskItem | null>(null);
  const [completionNoteInput, setCompletionNoteInput] = useState('');

  const [isCreateHandoverModalOpen, setIsCreateHandoverModalOpen] = useState(false);
  const [handoverTitle, setHandoverTitle] = useState('');
  const [handoverDesc, setHandoverDesc] = useState('');
  const [handoverPriority, setHandoverPriority] = useState<HandoverPriority>('Medium');
  const [handoverAiSummary, setHandoverAiSummary] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [handoverWarning, setHandoverWarning] = useState<string | null>(null);

  // Data Loading for current staff user
  const staffId = currentUser?.id || '';
  const myShifts = storageEngine.listShifts({ staffProfileId: staffId });
  const currentShift = myShifts.find(s => s.status === 'In Progress') || myShifts[0];

  // Attendance for current shift
  const currentAssignment = currentShift?.assignments?.find(a => a.staff_profile_id === staffId);
  const attendanceRecord = currentAssignment?.attendance;

  // My Tasks
  const myTasks = storageEngine.listTasks({ staffProfileId: staffId });
  const pendingTasks = myTasks.filter(t => t.status !== 'Done');

  // Handovers relevant to my current shift work area
  const areaHandovers = storageEngine
    .listHandovers({ workAreaId: currentShift?.work_area_id })
    .filter(h => h.status !== 'Resolved');

  // Check In Eligibility calculation
  const checkInCheck = currentShift
    ? isCheckInEligible(currentShift.starts_at, currentShift.ends_at)
    : { eligible: false, message: 'No active shift' };

  const handleCheckIn = () => {
    if (!currentAssignment) return;
    try {
      storageEngine.recordCheckIn(currentAssignment.id, staffId);
      // Confetti celebration
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err: any) {
      alert(err.message || 'Check in failed');
    }
  };

  const handleCheckOut = () => {
    if (!currentAssignment) return;
    if (window.confirm('Confirm shift checkout? Make sure you have logged any pending handovers.')) {
      try {
        storageEngine.recordCheckOut(currentAssignment.id, staffId);
      } catch (err: any) {
        alert(err.message || 'Check out failed');
      }
    }
  };

  const handleTaskStatusChange = (task: TaskItem, newStatus: TaskStatus) => {
    if (newStatus === 'Blocked') {
      setTaskToBlock(task);
      setBlockerReasonInput(task.block_reason || '');
      setIsBlockerModalOpen(true);
      return;
    }

    if (newStatus === 'Done') {
      setTaskToComplete(task);
      setCompletionNoteInput(task.completion_note || '');
      setIsDoneModalOpen(true);
      return;
    }

    storageEngine.updateTaskStatus(task.id, newStatus, null, null, staffId);
  };

  const handleBlockConfirm = () => {
    if (!taskToBlock || !blockerReasonInput.trim()) {
      alert('A blocker reason is mandatory.');
      return;
    }
    storageEngine.updateTaskStatus(taskToBlock.id, 'Blocked', null, blockerReasonInput.trim(), staffId);
    setIsBlockerModalOpen(false);
    setTaskToBlock(null);
    setBlockerReasonInput('');
  };

  const handleDoneConfirm = () => {
    if (!taskToComplete) return;
    storageEngine.updateTaskStatus(
      taskToComplete.id,
      'Done',
      completionNoteInput.trim() || 'Task completed.',
      null,
      staffId
    );
    setIsDoneModalOpen(false);
    setTaskToComplete(null);
    setCompletionNoteInput('');
  };

  const handleGenerateAiSummary = async () => {
    if (!handoverTitle.trim() || !handoverDesc.trim()) {
      alert('Please enter a title and description before generating summary.');
      return;
    }

    const val = validateNonClinicalHandover(handoverDesc);
    if (!val.valid) {
      setHandoverWarning(val.warning || 'Sensitive info detected.');
      return;
    }

    setHandoverWarning(null);
    setIsGeneratingAi(true);
    try {
      const summary = await summarizeHandover(handoverTitle, handoverDesc, institutionType);
      setHandoverAiSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCreateHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverTitle.trim() || !handoverDesc.trim()) {
      alert('Title and description required.');
      return;
    }
    if (!currentShift) {
      alert('No active shift to link handover to.');
      return;
    }

    storageEngine.createHandover(
      {
        organization_id: storageEngine.getOrganization().id,
        shift_id: currentShift.id,
        work_area_id: currentShift.work_area_id,
        title: handoverTitle.trim(),
        description: handoverDesc.trim(),
        priority: handoverPriority,
        status: 'Open',
        ai_summary: handoverAiSummary.trim() || null,
        created_by: staffId,
        acknowledged_by: null,
        acknowledged_at: null,
        resolved_by: null,
        resolved_at: null,
        resolution_note: null
      },
      staffId
    );

    setIsCreateHandoverModalOpen(false);
    setHandoverTitle('');
    setHandoverDesc('');
    setHandoverAiSummary('');
  };

  const handleAcknowledgeHandover = (id: string) => {
    storageEngine.acknowledgeHandover(id, staffId);
  };

  return (
    <div className="flex flex-col w-full space-y-5 pb-20 max-w-3xl mx-auto">
      {/* 1. Staff Hero Card: Current Assigned Shift */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden">
        {/* Department decorative backdrop tag */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Shift Assignment
            </span>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {terminology.orgName}
          </span>
        </div>

        {currentShift ? (
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {currentShift.title}
            </h1>

            <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                <span className="material-symbols-outlined text-[18px] text-primary-container">domain</span>
                {currentShift.work_area?.name}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-slate-800">
                <span className="material-symbols-outlined text-[18px] text-slate-400">schedule</span>
                {formatTime(currentShift.starts_at)} – {formatTime(currentShift.ends_at)} (
                {formatDuration(currentShift.starts_at, currentShift.ends_at)})
              </span>
            </div>

            {currentShift.notes && (
              <p className="text-xs text-slate-600 mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px] mb-0.5">
                  Supervisor Notes:
                </span>
                {currentShift.notes}
              </p>
            )}

            {/* Attendance Action Button Area */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Attendance Status:</span>
                <StatusBadge status={attendanceRecord?.status || 'Not Checked In'} />
              </div>

              {/* Action Buttons based on Attendance Status */}
              <div>
                {(!attendanceRecord || attendanceRecord.status === 'Not Checked In') && (
                  <button
                    onClick={handleCheckIn}
                    disabled={!checkInCheck.eligible}
                    className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                      checkInCheck.eligible
                        ? 'bg-primary-container hover:bg-primary text-white scale-[1.02] active:scale-[0.98]'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                    <span>Confirm Shift Check-In</span>
                  </button>
                )}

                {attendanceRecord?.status === 'Checked In' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      In at {formatTime(attendanceRecord.checked_in_at || '')}
                    </span>
                    <button
                      onClick={handleCheckOut}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      type="button"
                    >
                      Check Out
                    </button>
                  </div>
                )}

                {attendanceRecord?.status === 'Checked Out' && (
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                    Checked Out at {formatTime(attendanceRecord.checked_out_at || '')}
                  </span>
                )}
              </div>
            </div>

            {!checkInCheck.eligible && attendanceRecord?.status === 'Not Checked In' && (
              <p className="text-[11px] text-amber-700 mt-2 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                {checkInCheck.message}
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            icon="schedule"
            title="No Shift Assigned Today"
            description="You do not have any active shift assignments. Contact your facility manager if this is an error."
          />
        )}
      </section>

      {/* 2. Quick Action Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsCreateHandoverModalOpen(true)}
          className="flex-1 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 font-bold text-xs text-slate-800 flex items-center justify-center gap-2 transition-all"
          type="button"
        >
          <span className="material-symbols-outlined text-amber-600 text-[20px]">swap_horiz</span>
          <span>+ Report Blocker / Handover</span>
        </button>
      </div>

      {/* 3. Operational Sub-Deck (Tasks vs Handovers Tabs) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        {/* Toggle Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabSub('tasks')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabSub === 'tasks'
                  ? 'bg-primary-container text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              type="button"
            >
              <span>My Tasks ({pendingTasks.length})</span>
            </button>
            <button
              onClick={() => setActiveTabSub('handovers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabSub === 'handovers'
                  ? 'bg-primary-container text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              type="button"
            >
              <span>Area Handovers ({areaHandovers.length})</span>
            </button>
          </div>

          <button
            onClick={() => onNavigateTab(activeTabSub === 'tasks' ? 'my-tasks' : 'handovers')}
            className="text-xs font-bold text-primary-container hover:underline"
            type="button"
          >
            View All &rarr;
          </button>
        </div>

        {/* Tab 1: Tasks */}
        {activeTabSub === 'tasks' && (
          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <EmptyState
                icon="checklist"
                title="All Clear!"
                description="You currently have no tasks assigned to your shift."
              />
            ) : (
              myTasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                    task.status === 'Done'
                      ? 'bg-slate-50/60 border-slate-200 opacity-60'
                      : task.status === 'Blocked'
                      ? 'bg-amber-50/40 border-amber-300'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{task.title}</span>
                      <StatusBadge status={task.priority} size="sm" />
                    </div>
                    <StatusBadge status={task.status} size="sm" />
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                  )}

                  {task.status === 'Blocked' && task.block_reason && (
                    <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-xs text-amber-950 font-medium">
                      <span className="font-bold">Active Blocker:</span> {task.block_reason}
                    </div>
                  )}

                  {/* Quick Action Buttons for Staff */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {task.due_at ? `Due by ${formatTime(task.due_at)}` : 'Routine line item'}
                    </span>

                    <div className="flex items-center gap-2">
                      {task.status !== 'In Progress' && task.status !== 'Done' && (
                        <button
                          onClick={() => handleTaskStatusChange(task, 'In Progress')}
                          className="px-3 py-1 rounded-lg bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200 hover:bg-teal-100"
                          type="button"
                        >
                          Start
                        </button>
                      )}
                      {task.status !== 'Blocked' && task.status !== 'Done' && (
                        <button
                          onClick={() => handleTaskStatusChange(task, 'Blocked')}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 hover:bg-amber-100"
                          type="button"
                        >
                          Report Blocker...
                        </button>
                      )}
                      {task.status !== 'Done' && (
                        <button
                          onClick={() => handleTaskStatusChange(task, 'Done')}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 shadow-2xs"
                          type="button"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Area Handovers */}
        {activeTabSub === 'handovers' && (
          <div className="space-y-3">
            {areaHandovers.length === 0 ? (
              <EmptyState
                icon="sync_alt"
                title="Zero Pending Handovers"
                description="No open transition notes for your work area."
              />
            ) : (
              areaHandovers.map(handover => (
                <div
                  key={handover.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{handover.title}</span>
                    <StatusBadge status={handover.priority} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {handover.ai_summary || handover.description}
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Logged by: {handover.creator?.full_name || 'Staff'}</span>
                    {handover.status === 'Open' ? (
                      <button
                        onClick={() => handleAcknowledgeHandover(handover.id)}
                        className="px-3 py-1 rounded-lg bg-primary-container text-white font-bold"
                        type="button"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <StatusBadge status="Acknowledged" size="sm" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* --- BLOCKER REASON MODAL --- */}
      <Modal
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        title="Report Blocker"
        subtitle={`Task: "${taskToBlock?.title}"`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Explain what obstacle, locked room, or missing equipment is preventing this task:
          </p>
          <textarea
            rows={3}
            placeholder="e.g., Room locked; keys not on pegboard..."
            value={blockerReasonInput}
            onChange={e => setBlockerReasonInput(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-500"
            required
          />
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsBlockerModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleBlockConfirm}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
              type="button"
            >
              Confirm Blocker
            </button>
          </div>
        </div>
      </Modal>

      {/* --- TASK DONE COMPLETION NOTE MODAL --- */}
      <Modal
        isOpen={isDoneModalOpen}
        onClose={() => setIsDoneModalOpen(false)}
        title="Complete Line Item"
        subtitle={`Task: "${taskToComplete?.title}"`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">Optional completion verification note:</p>
          <textarea
            rows={3}
            placeholder="e.g., Area sanitized, trash emptied..."
            value={completionNoteInput}
            onChange={e => setCompletionNoteInput(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
          />
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsDoneModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleDoneConfirm}
              className="px-4 py-2 bg-primary-container hover:bg-primary text-white text-xs font-bold rounded-xl"
              type="button"
            >
              Complete Task
            </button>
          </div>
        </div>
      </Modal>

      {/* --- LOG HANDOVER MODAL --- */}
      <Modal
        isOpen={isCreateHandoverModalOpen}
        onClose={() => setIsCreateHandoverModalOpen(false)}
        title="Log Handover / Issue for Next Shift"
        subtitle={`Work Area: ${currentShift?.work_area?.name || 'Assigned Zone'}`}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateHandoverSubmit} className="space-y-4">
          {handoverWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-semibold">
              {handoverWarning}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Issue Subject *
            </label>
            <input
              type="text"
              placeholder="e.g., Spill in hallway 3, caution cones placed"
              value={handoverTitle}
              onChange={e => setHandoverTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Priority *
            </label>
            <select
              value={handoverPriority}
              onChange={e => setHandoverPriority(e.target.value as HandoverPriority)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Operational Details * (Zero Clinical PHI)
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Left side elevator doors sticky; maintenance notified."
              value={handoverDesc}
              onChange={e => setHandoverDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              required
            />
          </div>

          {/* AI Draft helper */}
          <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary-container flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                Optional AI Digest
              </span>
              <button
                type="button"
                onClick={handleGenerateAiSummary}
                disabled={isGeneratingAi}
                className="px-3 py-1 bg-primary-container text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {isGeneratingAi ? 'Drafting...' : 'Generate Summary'}
              </button>
            </div>
            {handoverAiSummary && (
              <textarea
                rows={2}
                value={handoverAiSummary}
                onChange={e => setHandoverAiSummary(e.target.value)}
                className="w-full p-2 bg-white border border-teal-300 rounded-lg text-xs"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsCreateHandoverModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              type="button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-container hover:bg-primary text-white text-xs font-bold rounded-xl"
            >
              Submit Handover
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
