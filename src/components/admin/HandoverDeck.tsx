import React, { useState } from 'react';
import { useInstitution } from '../../context/InstitutionContext';
import { useAuth } from '../../context/AuthContext';
import { storageEngine, useStorageSubscription } from '../../lib/storageEngine';
import { HandoverLog, HandoverPriority, HandoverStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { formatDateTime, exportToCSV } from '../../lib/utils';
import { summarizeHandover, validateNonClinicalHandover } from '../../lib/gemini';

export const HandoverDeck: React.FC = () => {
  useStorageSubscription();
  const { terminology, institutionType } = useInstitution();
  const { currentUser } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [handoverToResolve, setHandoverToResolve] = useState<HandoverLog | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');

  // Create Handover Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<HandoverPriority>('Medium');
  const [formAreaId, setFormAreaId] = useState('');
  const [formShiftId, setFormShiftId] = useState('');
  const [formNextShiftId, setFormNextShiftId] = useState('');
  const [formAiSummary, setFormAiSummary] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Data Loading
  const allHandovers = storageEngine.listHandovers();
  const workAreas = storageEngine.listWorkAreas(institutionType).filter(a => a.active);
  const shifts = storageEngine.listShifts({ institutionType }).filter(s => s.status !== 'Cancelled');

  // Counts
  const counts = {
    all: allHandovers.length,
    open: allHandovers.filter(h => h.status === 'Open').length,
    acknowledged: allHandovers.filter(h => h.status === 'Acknowledged').length,
    resolved: allHandovers.filter(h => h.status === 'Resolved').length
  };

  const filteredHandovers = allHandovers.filter(h => {
    if (statusFilter !== 'All' && h.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && h.priority !== priorityFilter) return false;
    return true;
  });

  const handleGenerateAiSummary = async () => {
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Please enter a title and description before generating an AI summary.');
      return;
    }

    // Check PHI
    const validation = validateNonClinicalHandover(formDescription);
    if (!validation.valid) {
      setFormWarning(validation.warning || 'Sensitive patient data detected.');
      return;
    }

    setFormWarning(null);
    setIsGeneratingAi(true);
    try {
      const summary = await summarizeHandover(formTitle, formDescription, institutionType);
      setFormAiSummary(summary);
    } catch (err: any) {
      console.error('Error generating AI summary:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCreateHandover = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormWarning(null);

    if (!formTitle.trim()) {
      setFormError('Handover title is required.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Detailed handover notes are required.');
      return;
    }
    if (!formAreaId) {
      setFormError('Please select a work area.');
      return;
    }

    const validation = validateNonClinicalHandover(formDescription);
    if (!validation.valid) {
      setFormWarning(validation.warning || 'PHI detected.');
      return;
    }

    const targetShiftId = formShiftId || (shifts.length > 0 ? shifts[0].id : '');
    if (!targetShiftId) {
      setFormError('No shifts available to link this handover to. Please schedule a shift first.');
      return;
    }

    try {
      storageEngine.createHandover(
        {
          organization_id: storageEngine.getOrganization().id,
          shift_id: targetShiftId,
          next_shift_id: formNextShiftId || null,
          work_area_id: formAreaId,
          title: formTitle.trim(),
          description: formDescription.trim(),
          priority: formPriority,
          status: 'Open',
          ai_summary: formAiSummary.trim() || null,
          created_by: currentUser?.id || 'user-admin-01',
          acknowledged_by: null,
          acknowledged_at: null,
          resolved_by: null,
          resolved_at: null,
          resolution_note: null
        },
        currentUser?.id || 'user-admin-01'
      );

      // Reset & close
      setIsCreateModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      setFormAiSummary('');
      setFormAreaId('');
      setFormShiftId('');
      setFormNextShiftId('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to record handover.');
    }
  };

  const handleAcknowledge = (handover: HandoverLog) => {
    storageEngine.acknowledgeHandover(handover.id, currentUser?.id || 'user-admin-01');
  };

  const handleResolveConfirm = () => {
    if (!handoverToResolve) return;
    if (!resolutionNoteInput.trim()) {
      alert('A resolution note explaining how the issue was fixed is required.');
      return;
    }

    storageEngine.resolveHandover(
      handoverToResolve.id,
      resolutionNoteInput.trim(),
      currentUser?.id || 'user-admin-01'
    );
    setIsResolveModalOpen(false);
    setHandoverToResolve(null);
    setResolutionNoteInput('');
  };

  const handleExportCSV = () => {
    const rows = filteredHandovers.map(h => ({
      ID: h.id,
      Title: h.title,
      Status: h.status,
      Priority: h.priority,
      Area: h.work_area?.name || '',
      Shift: h.shift?.title || '',
      LoggedBy: h.creator?.full_name || '',
      CreatedAt: formatDateTime(h.created_at),
      Description: h.description,
      AISummary: h.ai_summary || '',
      AcknowledgedBy: h.acknowledger?.full_name || '',
      ResolvedBy: h.resolver?.full_name || '',
      ResolutionNote: h.resolution_note || ''
    }));
    exportToCSV(`ShiftBridge_Handovers_${institutionType}.csv`, rows);
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* 1. Compliance Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-200/60 text-amber-900 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">shield_with_heart</span>
          </div>
          <div>
            <p className="text-[13px] font-bold text-amber-950 leading-tight">
              Institutional Privacy &amp; Operations Compliance Protocol
            </p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Strictly non-clinical shift logs; contains zero patient health or confidential student records.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white border border-amber-200 text-slate-700">
            Audit Cycle #448-B
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-200/60 text-amber-900">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-pulse" />
            Chain of Custody Active
          </span>
        </div>
      </div>

      {/* 2. Primary Page Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Shift Transition Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight mt-1">
            Shift Handovers &amp; Operational Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track unresolved issues, safety handoffs, and shift-to-shift transition notes across operational teams.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export Manifest</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-white text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Create Handover</span>
          </button>
        </div>
      </div>

      {/* 3. Metric Badges / Status Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'All', label: 'All Registered Logs', count: counts.all, icon: 'receipt_long' },
          { id: 'Open', label: 'Open Issues', count: counts.open, icon: 'pending_actions' },
          { id: 'Acknowledged', label: 'Acknowledged', count: counts.acknowledged, icon: 'visibility' },
          { id: 'Resolved', label: 'Resolved Logs', count: counts.resolved, icon: 'task_alt' }
        ].map(tab => {
          const isSelected = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                isSelected
                  ? 'bg-white border-primary-container ring-1 ring-primary-container shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
              }`}
              type="button"
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{tab.label}</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{tab.count}</span>
              </div>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. Handovers List */}
      {filteredHandovers.length === 0 ? (
        <EmptyState
          icon="sync_alt"
          title="No Handover Records"
          description="There are currently no transition notes matching your filter criteria."
          actionText="Log Transition Note"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-3.5">
          {filteredHandovers.map(handover => (
            <div
              key={handover.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-3"
            >
              {/* Header: Title, Priority, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">{handover.title}</h3>
                  <StatusBadge status={handover.priority} size="sm" />
                  <StatusBadge status={handover.status} size="sm" />
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatDateTime(handover.created_at)}
                </span>
              </div>

              {/* Sub-meta: Area & Shifts */}
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <span className="material-symbols-outlined text-[15px] text-slate-400">domain</span>
                  {handover.work_area?.name}
                </span>
                <span>•</span>
                <span>From: {handover.shift?.title}</span>
                {handover.next_shift && (
                  <>
                    <span>•</span>
                    <span className="text-purple-700 font-semibold">Next Shift: {handover.next_shift.title}</span>
                  </>
                )}
                <span>•</span>
                <span>Created by: {handover.creator?.full_name || 'Staff'}</span>
              </div>

              {/* Description */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[13px] text-slate-800 leading-relaxed">
                <span className="font-bold text-slate-500 text-[11px] block uppercase tracking-wider mb-0.5">
                  Original Log:
                </span>
                {handover.description}
              </div>

              {/* AI Generated Draft Summary */}
              {handover.ai_summary && (
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/70 text-[12px] text-teal-950 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-teal-900 text-[11px] uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[15px] text-primary-container">auto_awesome</span>
                    <span>AI Shift Summary Digest:</span>
                  </div>
                  <p className="font-medium italic leading-relaxed">{handover.ai_summary}</p>
                </div>
              )}

              {/* Resolution Note if Resolved */}
              {handover.status === 'Resolved' && handover.resolution_note && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[12px] text-emerald-950 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-emerald-900 font-bold text-[11px] uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[15px] text-emerald-700">check_circle</span>
                    <span>Resolved by {handover.resolver?.full_name || 'Admin'} at {formatDateTime(handover.resolved_at || '')}:</span>
                  </div>
                  <p className="font-medium mt-0.5">{handover.resolution_note}</p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  {handover.status === 'Acknowledged' && handover.acknowledger && (
                    <span>Acknowledged by {handover.acknowledger.full_name}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {handover.status === 'Open' && (
                    <button
                      onClick={() => handleAcknowledge(handover)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors border border-slate-200"
                      type="button"
                    >
                      Acknowledge Issue
                    </button>
                  )}

                  {handover.status !== 'Resolved' && (
                    <button
                      onClick={() => {
                        setHandoverToResolve(handover);
                        setIsResolveModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors shadow-2xs"
                      type="button"
                    >
                      Resolve Issue...
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE HANDOVER MODAL --- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Log Shift Transition Handover"
        subtitle="Pass unresolved items, safety observations, or equipment maintenance to incoming shift"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateHandover} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
              {formError}
            </div>
          )}

          {formWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-semibold">
              {formWarning}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Handover Subject / Issue Title *
            </label>
            <input
              type="text"
              placeholder="e.g., North Wing Corridor 3 Floor Buffer Motor Overheating"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              required
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
                onChange={e => setFormPriority(e.target.value as HandoverPriority)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-primary-container"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Current & Next Shift */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Originating Shift
              </label>
              <select
                value={formShiftId}
                onChange={e => setFormShiftId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              >
                <option value="">-- Active Shift --</option>
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Next Shift (Optional)
              </label>
              <select
                value={formNextShiftId}
                onChange={e => setFormNextShiftId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              >
                <option value="">-- Any Incoming Shift --</option>
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Detailed Log &amp; Safety Protocol *
              </label>
              <span className="text-[10px] text-slate-400 font-bold">Strictly Zero Clinical PHI</span>
            </div>
            <textarea
              rows={3}
              placeholder="e.g., Industrial rotary floor buffer #03 began emitting motor heat smell at 08:30. Power cord unplugged and machine tagged out in Utility Room 3A..."
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              required
            />
          </div>

          {/* AI Handover Summarizer Trigger & Human-in-the-Loop Review */}
          <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-primary-container font-bold text-xs">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span>AI Handover Summarizer (Human Review Mandatory)</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiSummary}
                disabled={isGeneratingAi}
                className="px-3 py-1 rounded-lg bg-primary-container hover:bg-primary text-white text-[11px] font-bold shadow-2xs transition-all disabled:opacity-50"
              >
                {isGeneratingAi ? 'Synthesizing...' : 'Generate Draft Summary'}
              </button>
            </div>

            {formAiSummary && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Generated Digest (Review &amp; Edit before submission):
                </span>
                <textarea
                  rows={2}
                  value={formAiSummary}
                  onChange={e => setFormAiSummary(e.target.value)}
                  className="w-full p-2 bg-white border border-teal-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none"
                />
              </div>
            )}
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
              Record Handover
            </button>
          </div>
        </form>
      </Modal>

      {/* --- RESOLVE HANDOVER MODAL --- */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Handover Issue"
        subtitle={`Closing item: "${handoverToResolve?.title}"`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Explain the physical resolution, replacement part, or supervisor approval taken to close this item.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Resolution Note *
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Verified voltage and motion trigger. Replaced sensor with OEM part #8812. Closed ticket."
              value={resolutionNoteInput}
              onChange={e => setResolutionNoteInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsResolveModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleResolveConfirm}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              type="button"
            >
              Confirm Resolution
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
