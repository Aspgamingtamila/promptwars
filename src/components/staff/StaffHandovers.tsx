import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInstitution } from '../../context/InstitutionContext';
import { storageEngine, useStorageSubscription } from '../../lib/storageEngine';
import { HandoverPriority } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { formatDateTime } from '../../lib/utils';
import { summarizeHandover, validateNonClinicalHandover } from '../../lib/gemini';

export const StaffHandovers: React.FC = () => {
  useStorageSubscription();
  const { currentUser } = useAuth();
  const { terminology, institutionType } = useInstitution();
  const staffId = currentUser?.id || '';

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<HandoverPriority>('Medium');
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const myShifts = storageEngine.listShifts({ staffProfileId: staffId });
  const activeShift = myShifts.find(s => s.status === 'In Progress') || myShifts[0];

  const allHandovers = storageEngine.listHandovers();
  const relevantHandovers = allHandovers.filter(h => {
    if (activeShift && h.work_area_id === activeShift.work_area_id) return true;
    if (h.created_by === staffId) return true;
    return false;
  });

  const handleGenerateAi = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please enter a title and description before generating summary.');
      return;
    }

    const val = validateNonClinicalHandover(description);
    if (!val.valid) {
      setWarningMessage(val.warning || 'Sensitive info detected.');
      return;
    }

    setWarningMessage(null);
    setIsGeneratingAi(true);
    try {
      const draft = await summarizeHandover(title, description, institutionType);
      setAiSummary(draft);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Title and description required.');
      return;
    }
    if (!activeShift) {
      alert('No shift assigned to link handover to.');
      return;
    }

    storageEngine.createHandover(
      {
        organization_id: storageEngine.getOrganization().id,
        shift_id: activeShift.id,
        work_area_id: activeShift.work_area_id,
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'Open',
        ai_summary: aiSummary.trim() || null,
        created_by: staffId,
        acknowledged_by: null,
        acknowledged_at: null,
        resolved_by: null,
        resolved_at: null,
        resolution_note: null
      },
      staffId
    );

    setIsCreateModalOpen(false);
    setTitle('');
    setDescription('');
    setAiSummary('');
  };

  const handleAcknowledge = (id: string) => {
    storageEngine.acknowledgeHandover(id, staffId);
  };

  return (
    <div className="flex flex-col w-full space-y-4 pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Shift Handovers &amp; Issues</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log notes for the incoming shift or review incoming transition items
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-primary-container hover:bg-primary text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          type="button"
        >
          + Log Handover
        </button>
      </div>

      {/* Relevant List */}
      {relevantHandovers.length === 0 ? (
        <EmptyState
          icon="sync_alt"
          title="No Open Handovers"
          description="Your assigned work area has no open equipment or hazard handovers from previous shifts."
          actionText="Log Transition Note"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {relevantHandovers.map(h => (
            <div
              key={h.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{h.title}</span>
                  <StatusBadge status={h.priority} size="sm" />
                </div>
                <StatusBadge status={h.status} size="sm" />
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700">{h.work_area?.name}</span>
                <span>•</span>
                <span>Logged by {h.creator?.full_name || 'Staff'} at {formatDateTime(h.created_at)}</span>
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {h.description}
              </p>

              {h.ai_summary && (
                <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-950 font-medium italic">
                  <span className="font-bold text-teal-900 block not-italic text-[11px] uppercase mb-0.5">
                    Summary Digest:
                  </span>
                  {h.ai_summary}
                </div>
              )}

              {h.status === 'Resolved' && h.resolution_note && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                  <span className="font-bold text-emerald-900 block text-[11px] uppercase">
                    Resolved by {h.resolver?.full_name || 'Admin'}:
                  </span>
                  {h.resolution_note}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  {h.status === 'Acknowledged' && h.acknowledger && `Acknowledged by ${h.acknowledger.full_name}`}
                </span>

                {h.status === 'Open' && (
                  <button
                    onClick={() => handleAcknowledge(h.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-bold transition-all shadow-2xs"
                    type="button"
                  >
                    Acknowledge Issue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE HANDOVER MODAL --- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Log Handover / Issue"
        subtitle={`Area: ${activeShift?.work_area?.name || 'Assigned Zone'}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {warningMessage && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-semibold">
              {warningMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Title / Subject *
            </label>
            <input
              type="text"
              placeholder="e.g., Buffer machine motor heating up; tagged out in closet"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Priority *
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as HandoverPriority)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Operational Description *
              </label>
              <span className="text-[10px] text-slate-400 font-bold">Zero Clinical PHI</span>
            </div>
            <textarea
              rows={3}
              placeholder="Describe physical location, equipment condition, or unfinished tasks..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              required
            />
          </div>

          {/* AI Helper */}
          <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary-container flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                Optional AI Digest
              </span>
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={isGeneratingAi}
                className="px-3 py-1 bg-primary-container text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {isGeneratingAi ? 'Drafting...' : 'Generate Draft'}
              </button>
            </div>
            {aiSummary && (
              <textarea
                rows={2}
                value={aiSummary}
                onChange={e => setAiSummary(e.target.value)}
                className="w-full p-2 bg-white border border-teal-300 rounded-lg text-xs font-medium"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              type="button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-container hover:bg-primary text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Submit Handover
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
