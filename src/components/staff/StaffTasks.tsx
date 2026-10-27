import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageEngine, useStorageSubscription } from '../../lib/storageEngine';
import { TaskItem, TaskStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { formatTime } from '../../lib/utils';

export const StaffTasks: React.FC = () => {
  useStorageSubscription();
  const { currentUser } = useAuth();
  const staffId = currentUser?.id || '';

  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [taskToBlock, setTaskToBlock] = useState<TaskItem | null>(null);
  const [blockerReasonInput, setBlockerReasonInput] = useState('');

  const [isDoneModalOpen, setIsDoneModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<TaskItem | null>(null);
  const [completionNoteInput, setCompletionNoteInput] = useState('');

  const myTasks = storageEngine.listTasks({ staffProfileId: staffId });

  const filteredTasks = myTasks.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    return true;
  });

  const handleStatusClick = (task: TaskItem, newStatus: TaskStatus) => {
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
      alert('Blocker reason required.');
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
      completionNoteInput.trim() || 'Completed as scheduled.',
      null,
      staffId
    );
    setIsDoneModalOpen(false);
    setTaskToComplete(null);
    setCompletionNoteInput('');
  };

  return (
    <div className="flex flex-col w-full space-y-4 pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Assigned Task Checklist</h1>
          <p className="text-xs text-slate-500 mt-0.5">Line items assigned to your shift</p>
        </div>
        <span className="px-3 py-1 bg-slate-100 rounded-full font-bold text-xs text-slate-700 tabular-nums">
          {myTasks.length} Assigned
        </span>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'To Do', 'In Progress', 'Blocked', 'Done'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              statusFilter === status
                ? 'bg-primary-container text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            type="button"
          >
            {status}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon="checklist"
          title="No Tasks in Filter"
          description="No tasks currently match this status filter."
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                task.status === 'Done'
                  ? 'bg-slate-50/70 border-slate-200 opacity-60'
                  : task.status === 'Blocked'
                  ? 'bg-amber-50/50 border-amber-300'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <StatusBadge status={task.priority} size="sm" />
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {task.work_area?.name}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{task.title}</h3>
                </div>
                <StatusBadge status={task.status} size="sm" />
              </div>

              {task.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
              )}

              {task.status === 'Blocked' && task.block_reason && (
                <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-xs text-amber-950 font-medium">
                  <span className="font-bold">Active Blocker:</span> {task.block_reason}
                </div>
              )}

              {task.status === 'Done' && task.completion_note && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                  <span className="font-bold">Completion note:</span> {task.completion_note}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono">
                  {task.due_at ? `Due: ${formatTime(task.due_at)}` : 'Standard Line Item'}
                </span>

                <div className="flex items-center gap-2">
                  {task.status !== 'In Progress' && task.status !== 'Done' && (
                    <button
                      onClick={() => handleStatusClick(task, 'In Progress')}
                      className="px-3 py-1 bg-teal-50 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 hover:bg-teal-100"
                      type="button"
                    >
                      Start
                    </button>
                  )}
                  {task.status !== 'Blocked' && task.status !== 'Done' && (
                    <button
                      onClick={() => handleStatusClick(task, 'Blocked')}
                      className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 hover:bg-amber-100"
                      type="button"
                    >
                      Report Blocker
                    </button>
                  )}
                  {task.status !== 'Done' && (
                    <button
                      onClick={() => handleStatusClick(task, 'Done')}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-2xs"
                      type="button"
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- BLOCKER MODAL --- */}
      <Modal
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        title="Report Blocker"
        subtitle={`Task: "${taskToBlock?.title}"`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Mandatory audit rule: Explain what physical hazard, missing equipment, or locked facility is blocking this task.
          </p>
          <textarea
            rows={3}
            placeholder="e.g., Spill kit empty in Janitor Closet 2..."
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

      {/* --- DONE MODAL --- */}
      <Modal
        isOpen={isDoneModalOpen}
        onClose={() => setIsDoneModalOpen(false)}
        title="Complete Line Item"
        subtitle={`Task: "${taskToComplete?.title}"`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">Provide an optional completion note:</p>
          <textarea
            rows={3}
            placeholder="e.g., Tested and verified egress lamps..."
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
              Mark Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
