import React, { useState } from 'react';
import { useInstitution } from '../../context/InstitutionContext';
import { useAuth } from '../../context/AuthContext';
import { storageEngine, useStorageSubscription } from '../../lib/storageEngine';
import { WorkArea, InstitutionType } from '../../types';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { formatDate, getErrorMessage } from '../../lib/utils';

export const WorkAreas: React.FC = () => {
  useStorageSubscription();
  const { terminology, institutionType } = useInstitution();
  const { currentUser } = useAuth();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<WorkArea | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<InstitutionType>(institutionType);
  const [formError, setFormError] = useState<string | null>(null);

  const workAreas = storageEngine.listWorkAreas(institutionType);
  const shifts = storageEngine.listShifts({ institutionType });

  const handleOpenCreate = () => {
    setEditingArea(null);
    setName('');
    setDescription('');
    setTargetType(institutionType);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (area: WorkArea) => {
    setEditingArea(area);
    setName(area.name);
    setDescription(area.description || '');
    setTargetType(area.institution_type);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Area name is required.');
      return;
    }

    try {
      if (editingArea) {
        storageEngine.updateWorkArea(
          editingArea.id,
          {
            name: name.trim(),
            description: description.trim() || null,
            institution_type: targetType
          },
          currentUser?.id || 'user-admin-01'
        );
      } else {
        storageEngine.createWorkArea(
          {
            organization_id: storageEngine.getOrganization().id,
            name: name.trim(),
            description: description.trim() || null,
            institution_type: targetType,
            active: true
          },
          currentUser?.id || 'user-admin-01'
        );
      }

      setIsFormModalOpen(false);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Operation failed.'));
    }
  };

  const handleToggleActive = (area: WorkArea) => {
    storageEngine.toggleWorkAreaActive(area.id, currentUser?.id || 'user-admin-01');
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Work Areas &amp; Physical Zones</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {workAreas.length} Configured
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active facilities, maintenance corridors, and sanitation hubs for {terminology.orgName}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-white text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
          <span>Add Work Area</span>
        </button>
      </div>

      {/* 2. Grid of Work Areas */}
      {workAreas.length === 0 ? (
        <EmptyState
          icon="domain"
          title="No Work Areas Configured"
          description={`No operational facilities configured for ${terminology.orgName}. Add your first work area to begin shift rostering.`}
          actionText="Create Work Area"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workAreas.map(area => {
            const shiftCount = shifts.filter(s => s.work_area_id === area.id && s.status !== 'Cancelled').length;

            return (
              <div
                key={area.id}
                className={`p-5 rounded-2xl border bg-white shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between ${
                  !area.active ? 'opacity-50 border-dashed border-slate-300 bg-slate-50' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="p-2 rounded-xl bg-slate-100 text-primary-container inline-flex">
                      <span className="material-symbols-outlined text-[20px]">domain</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        area.active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {area.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{area.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {area.description || 'No additional spatial notes.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {shiftCount} Active {shiftCount === 1 ? 'Shift' : 'Shifts'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(area)}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Edit area"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(area)}
                      className={`text-[11px] font-bold hover:underline ${
                        area.active ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                      type="button"
                    >
                      {area.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- ADD / EDIT WORK AREA MODAL --- */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingArea ? 'Edit Work Area' : 'Create Work Area'}
        subtitle={`Zone management for ${terminology.orgName}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveArea} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Work Area / Zone Name *
            </label>
            <input
              type="text"
              placeholder={terminology.areaExamples}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sector Alignment *
            </label>
            <select
              value={targetType}
              onChange={e => setTargetType(e.target.value as InstitutionType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary-container"
            >
              <option value="school_college">Colleges &amp; Schools (Campus)</option>
              <option value="hospital">Hospitals (Non-Clinical Support)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description &amp; Facility Boundaries (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Academic instructional halls 101-108, tiered auditoriums, and media hubs..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-container hover:bg-primary text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {editingArea ? 'Save Changes' : 'Create Zone'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
