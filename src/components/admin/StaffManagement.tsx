import React, { useState } from 'react';
import { useInstitution } from '../../context/InstitutionContext';
import { useAuth } from '../../context/AuthContext';
import { storageEngine, useStorageSubscription } from '../../lib/storageEngine';
import { StaffProfile, UserRole } from '../../types';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { Avatar } from '../common/Avatar';
import { formatDate, getErrorMessage } from '../../lib/utils';

export const StaffManagement: React.FC = () => {
  useStorageSubscription();
  const { terminology } = useInstitution();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [staffToDeactivate, setStaffToDeactivate] = useState<StaffProfile | null>(null);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [jobTitle, setJobTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const allProfiles = storageEngine.listProfiles();

  const filteredStaff = allProfiles.filter(staff => {
    if (roleFilter !== 'All' && staff.role !== roleFilter) return false;
    if (statusFilter !== 'All') {
      const activeBool = statusFilter === 'Active';
      if (staff.active !== activeBool) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = staff.full_name.toLowerCase().includes(q);
      const matchEmail = staff.email.toLowerCase().includes(q);
      const matchTitle = staff.job_title.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchTitle) return false;
    }
    return true;
  });

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('staff');
    setJobTitle('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffProfile) => {
    setEditingStaff(staff);
    setFullName(staff.full_name);
    setEmail(staff.email);
    setPhone(staff.phone || '');
    setRole(staff.role);
    setJobTitle(staff.job_title);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !email.trim() || !jobTitle.trim()) {
      setFormError('Full name, email, and job title are required.');
      return;
    }

    try {
      if (editingStaff) {
        storageEngine.updateStaff(
          editingStaff.id,
          {
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            role,
            job_title: jobTitle.trim()
          },
          currentUser?.id || 'user-admin-01'
        );
      } else {
        storageEngine.createStaff(
          {
            organization_id: storageEngine.getOrganization().id,
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            role,
            job_title: jobTitle.trim(),
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

  const handleToggleActiveConfirm = () => {
    if (!staffToDeactivate) return;
    storageEngine.toggleStaffActive(
      staffToDeactivate.id,
      currentUser?.id || 'user-admin-01'
    );
    setIsDeactivateModalOpen(false);
    setStaffToDeactivate(null);
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Staff &amp; Workforce Directory</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {allProfiles.length} Total Users
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage worker credentials, access levels, roles, and institutional assignments
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-white text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* 2. Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, email, job title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-800 focus:outline-none focus:border-primary-container"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 focus:outline-none focus:border-primary-container"
          >
            <option value="All">All Roles</option>
            <option value="admin">Admins</option>
            <option value="staff">Staff Members</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 focus:outline-none focus:border-primary-container"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* 3. Staff Table */}
      {filteredStaff.length === 0 ? (
        <EmptyState
          icon="group"
          title="No Staff Found"
          description="No worker profiles match your current search or status filter."
          actionText="Add New Staff"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Staff Member</th>
                  <th className="px-6 py-3.5">Role &amp; Title</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Registered</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map(staff => (
                  <tr
                    key={staff.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      !staff.active ? 'opacity-60 bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={staff.full_name} role={staff.role} size="lg" />
                        <div>
                          <span className="font-bold text-slate-900 block text-[13px]">{staff.full_name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{staff.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block text-[12px]">{staff.job_title}</span>
                      <span
                        className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-bold uppercase mt-0.5 ${
                          staff.role === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {staff.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">
                      {staff.phone || 'No phone recorded'}
                    </td>

                    <td className="px-6 py-4">
                      {staff.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(staff.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Edit staff details"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setStaffToDeactivate(staff);
                            setIsDeactivateModalOpen(true);
                          }}
                          className={`p-1 rounded-lg transition-colors ${
                            staff.active
                              ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                              : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                          }`}
                          title={staff.active ? 'Deactivate staff' : 'Reactivate staff'}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {staff.active ? 'person_off' : 'person_check'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT STAFF MODAL --- */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingStaff ? 'Edit Staff Profile' : 'Add New Staff Member'}
        subtitle={`Workforce management for ${terminology.orgName}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Alex Vance"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address (Login ID) *
            </label>
            <input
              type="email"
              placeholder="e.g., alex.vance@shiftbridge.org"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Access Role *
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary-container"
              >
                <option value="staff">Staff Member</option>
                <option value="admin">Operations Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone (Optional)
              </label>
              <input
                type="text"
                placeholder="+1-555-019-2831"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Job Title / Designation *
            </label>
            <input
              type="text"
              placeholder="e.g., Campus Facilities Lead / Environmental Logistics Lead"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-primary-container"
              required
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
              {editingStaff ? 'Save Changes' : 'Register Staff'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- DEACTIVATE / REACTIVATE CONFIRMATION MODAL --- */}
      <Modal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        title={staffToDeactivate?.active ? 'Confirm Staff Deactivation' : 'Reactivate Staff Member'}
        subtitle={`Staff: ${staffToDeactivate?.full_name}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            {staffToDeactivate?.active
              ? `Are you sure you want to deactivate ${staffToDeactivate?.full_name}? Deactivated staff cannot sign in or receive new shift assignments (FR-3).`
              : `Are you sure you want to reactivate ${staffToDeactivate?.full_name}? They will immediately be restored for shift rostering.`}
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsDeactivateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleActiveConfirm}
              className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-sm transition-all ${
                staffToDeactivate?.active
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              type="button"
            >
              {staffToDeactivate?.active ? 'Confirm Deactivation' : 'Reactivate Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
