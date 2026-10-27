import React, { useState } from 'react';
import { useInstitution } from '../../context/InstitutionContext';
import { useAuth } from '../../context/AuthContext';
import { storageEngine, useStorageSubscription } from '../../lib/storageEngine';
import { TaskItem, TaskPriority, TaskStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { formatTime, formatDate, exportToCSV } from '../../lib/utils';

export const TaskManagement: React.FC = () => {
  useStorageSubscription();
  const { terminology, institutionType } = useInstitution();
  const { currentUser } = useAuth();

  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [areaFilter, setAreaFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [taskToBlock, setTaskToBlock] = useState<TaskItem | null>(null);
  const [blockerReasonInput, setBlockerReasonInput] = useState('');

  const [isDoneModalOpen, setIsDoneModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<TaskItem | null>(null);
  const [completionNoteInput, setCompletionNoteInput] = useState('');

  // Form State for Create Task
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('Medium');
  const [formAreaId, setFormAreaId] = useState('');
  const [formShiftId, setFormShiftId] = useState('');
  const [formDueTime, setFormDueTime] = useState('14:00');
  const [formStaffIds, setFormStaffIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Data Loading
  const allTasks = storageEngine.listTasks({ institutionType });
  const workAreas = storageEngine.listWorkAreas(institutionType).filter(a => a.active);
  const shifts = storageEngine.listShifts({ institutionType }).filter(s => s.status !== 'Cancelled');
  const activeStaff = storageEngine.listProfiles().filter(p => p.active && p.role === 'staff');

  // Counts for filter pills
  const counts = {
    all: allTasks.length,
    todo: allTasks.filter(t => t.status === 'To Do').length,
    inProgress: allTasks.filter(t => t.status === 'In Progress').length,
    blocked: allTasks.filter(t => t.status === 'Blocked').length,
    done: allTasks.filter(t => t.status === 'Done').length
  };

  // Filtered List
  const filteredTasks = allTasks.filter(task => {
    if (statusFilter !== 'All' && task.status !== statusFilter) return false;
    if (areaFilter !== 'All' && task.work_area_id !== areaFilter) return false;
    if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError('Task title is required.');
      return;
    }
    if (!formAreaId) {
      setFormError('Please select a valid work area.');
      return;
    }

    // Default to first active shift if unselected
    const targetShiftId = formShiftId || (shifts.length > 0 ? shifts[0].id : '');
    if (!targetShiftId) {
      setFormError('No shifts available to link this task to. Please create a shift first.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const calculatedDueAt = formDueTime ? `${todayStr}T${formDueTime}:00Z` : undefined;

    try {
      storageEngine.createTask(
        {
          organization_id: storageEngine.getOrganization().id,
          work_area_id: formAreaId,
          shift_id: targetShiftId,
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          priority: formPriority,
          status: 'To Do',
          due_at: calculatedDueAt || null,
          completed_at: null,
          block_reason: null,
          completion_note: null,
          created_by: currentUser?.id || 'user-admin-01',
          staffIds: formStaffIds
        },
        currentUser?.id || 'user-admin-01'
      );

      // Reset form & close
      setIsCreateModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      setFormAreaId('');
      setFormShiftId('');
      setFormStaffIds([]);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create task.');
    }
  };

  const handleSetStatus = (task: TaskItem, newStatus: TaskStatus) => {
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

    // Simple transition to To Do or In Progress
    storageEngine.updateTaskStatus(
      task.id,
      newStatus,
      null,
      null,
      currentUser?.id || 'user-admin-01'
    );
  };

  const handleBlockConfirm = () => {
    if (!taskToBlock) return;
    if (!blockerReasonInput.trim()) {
      alert('A blocker reason is mandatory.');
      return;
    }

    storageEngine.updateTaskStatus(
      taskToBlock.id,
      'Blocked',
      null,
      blockerReasonInput.trim(),
      currentUser?.id || 'user-admin-01'
    );
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
      currentUser?.id || 'user-admin-01'
    );
    setIsDoneModalOpen(false);
    setTaskToComplete(null);
    setCompletionNoteInput('');
  };

  const handleExportCSV = () => {
    const rows = filteredTasks.map(t => ({
      ID: t.id,
      Title: t.title,
      Description: t.description || '',
      Priority: t.priority,
      Status: t.status,
      Area: t.work_area?.name || '',
      Shift: t.shift?.title || '',
      DueTime: t.due_at ? formatTime(t.due_at) : '',
      Assignees: t.assignments?.map(a => a.staff?.full_name).join('; ') || 'Unassigned',
      BlockerReason: t.block_reason || '',
      CompletionNote: t.completion_note || ''
    }));
    exportToCSV(`ShiftBridge_Tasks_${institutionType}.csv`, rows);
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* 1. Header & Controls Strip */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Operational Tasks &amp; Checklists</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
              Live Cycle
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>{terminology.staffCategory}</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-primary-container tabular-nums">
              {allTasks.length} Total Line Items Tracked
            </span>
          </p>
        </div>

        {/* View Mode & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">view_agenda</span>
              <span>Segmented Grid</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">view_column</span>
              <span>Kanban Board</span>
            </button>
          </div>

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
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* 2. Operational Compliance Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-200/60 text-amber-900 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">policy</span>
          </div>
          <div>
            <span className="text-[13px] font-bold text-amber-950 block">{terminology.complianceTitle}</span>
            <span className="text-[11px] text-amber-800 leading-snug">{terminology.complianceSubtitle}</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-amber-900 text-[11px] font-bold border border-amber-200 self-end md:self-auto shrink-0 shadow-2xs">
          <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
          <span>{terminology.complianceGrade}</span>
        </div>
      </div>

      {/* 3. Filter Chips Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'All', label: 'All', count: counts.all },
            { id: 'To Do', label: 'To Do', count: counts.todo },
            { id: 'In Progress', label: 'In Progress', count: counts.inProgress },
            { id: 'Blocked', label: 'Blocked', count: counts.blocked },
            { id: 'Done', label: 'Done', count: counts.done }
          ].map(chip => {
            const isActive = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  isActive
                    ? 'bg-primary-container text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
                type="button"
              >
                <span>{chip.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Area & Priority Filters */}
        <div className="flex items-center gap-2">
          <select
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 focus:outline-none focus:border-primary-container"
          >
            <option value="All">All Areas ({workAreas.length})</option>
            {workAreas.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 focus:outline-none focus:border-primary-container"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* 4. Task Display: Segmented Grid OR Kanban */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon="checklist"
          title="No Tasks Found"
          description={`No operational tasks matching the selected filters for ${terminology.orgName}.`}
          actionText="Create Line Item"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        /* SEGMENTED GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`p-5 rounded-2xl border bg-white shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between ${
                task.status === 'Blocked'
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <StatusBadge status={task.priority} size="sm" />
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                      {task.work_area?.name}
                    </span>
                  </div>
                  <StatusBadge status={task.status} size="sm" />
                </div>

                <h3 className="text-[14px] font-bold text-slate-900 leading-snug">{task.title}</h3>
                {task.description && (
                  <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                )}

                {/* Blocked Reason Callout */}
                {task.status === 'Blocked' && task.block_reason && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900">
                    <div className="flex items-center gap-1 font-bold mb-0.5">
                      <span className="material-symbols-outlined text-[14px] text-amber-700">warning</span>
                      <span>Active Operational Blocker:</span>
                    </div>
                    <p>{task.block_reason}</p>
                  </div>
                )}

                {/* Completion Note */}
                {task.status === 'Done' && task.completion_note && (
                  <div className="mt-3 p-2 rounded-xl bg-emerald-50 border border-emerald-200/60 text-[11px] text-emerald-900">
                    <span className="font-bold">Completion note:</span> {task.completion_note}
                  </div>
                )}
              </div>

              {/* Card Footer: Assignees & Status Quick Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {/* Assignees */}
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {task.assignments && task.assignments.length > 0 ? (
                    task.assignments.map(a => (
                      <img
                        key={a.id}
                        src={a.staff?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={a.staff?.full_name}
                        title={a.staff?.full_name}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                      />
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                  )}
                </div>

                {/* Status Changer Select */}
                <select
                  value={task.status}
                  onChange={e => handleSetStatus(task, e.target.value as TaskStatus)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:border-primary-container"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked...</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['To Do', 'In Progress', 'Blocked', 'Done'] as TaskStatus[]).map(columnStatus => {
            const columnTasks = filteredTasks.filter(t => t.status === columnStatus);

            return (
              <div
                key={columnStatus}
                className="bg-slate-100/60 p-3.5 rounded-2xl border border-slate-200/60 flex flex-col gap-3 min-h-[400px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">{columnStatus}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold tabular-nums">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Tasks */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {columnTasks.map(task => (
                    <div
                      key={task.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <StatusBadge status={task.priority} size="sm" />
                        <span className="text-[10px] text-slate-400 font-mono">
                          {task.due_at ? formatTime(task.due_at) : ''}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-bold text-slate-900 leading-snug">{task.title}</h4>
                      {task.status === 'Blocked' && task.block_reason && (
                        <p className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200 font-medium">
                          {task.block_reason}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[120px]">{task.work_area?.name}</span>
                        <button
                          onClick={() => {
                            const next: Record<TaskStatus, TaskStatus> = {
                              'To Do': 'In Progress',
                              'In Progress': 'Done',
                              'Blocked': 'In Progress',
                              'Done': 'To Do'
                            };
                            handleSetStatus(task, next[task.status]);
                          }}
                          className="text-primary-container font-bold hover:underline"
                          type="button"
                        >
                          Advance &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CREATE TASK MODAL --- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Operational Line Item"
        subtitle={`Assign task checklist for ${terminology.orgName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Terminal Disinfection of Hallway Utility Closet 3B"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Work Instructions &amp; SOP (Non-Clinical Only)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Scrub utility sinks, empty gray water sumps, sanitize mop heads..."
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
            />
          </div>

          {/* Area & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Work Area *
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
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority Level *
              </label>
              <select
                value={formPriority}
                onChange={e => setFormPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-primary-container"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Target Shift & Due Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Associated Shift
              </label>
              <select
                value={formShiftId}
                onChange={e => setFormShiftId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              >
                <option value="">-- Active Daily Shifts --</option>
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({formatTime(s.starts_at)} - {formatTime(s.ends_at)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Due Time
              </label>
              <input
                type="time"
                value={formDueTime}
                onChange={e => setFormDueTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Assign Staff Members ({formStaffIds.length} selected)
            </label>
            <div className="max-h-28 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {activeStaff.map(staff => {
                const isSelected = formStaffIds.includes(staff.id);
                return (
                  <label
                    key={staff.id}
                    className="flex items-center justify-between p-1 rounded-lg hover:bg-white cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setFormStaffIds(formStaffIds.filter(id => id !== staff.id));
                          } else {
                            setFormStaffIds([...formStaffIds, staff.id]);
                          }
                        }}
                        className="rounded text-primary-container focus:ring-0"
                      />
                      <span className="font-semibold text-slate-800">{staff.full_name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{staff.job_title}</span>
                  </label>
                );
              })}
            </div>
          </div>

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
              Create Task
            </button>
          </div>
        </form>
      </Modal>

      {/* --- BLOCKER REASON MODAL --- */}
      <Modal
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        title="Report Operational Blocker"
        subtitle={`Task: "${taskToBlock?.title}"`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            <strong>Mandatory Audit Requirement:</strong> State exactly what physical obstacle, missing equipment, or
            safety hazard prevents completion so operations can resolve it.
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Blocker Rationale *
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Access ladder locked inside Facilities Vault B; awaiting physical master key..."
              value={blockerReasonInput}
              onChange={e => setBlockerReasonInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-500"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsBlockerModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleBlockConfirm}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
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
          <p className="text-xs text-slate-600">
            Provide an optional completion note detailing actions taken or physical verification.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Completion Note (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Egress points inspected, lamps green, supplies topped up..."
              value={completionNoteInput}
              onChange={e => setCompletionNoteInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsDoneModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleDoneConfirm}
              className="px-4 py-2 bg-primary-container hover:bg-primary text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              type="button"
            >
              Mark Completed
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
