import { useState, useEffect } from 'react';
import {
  Organization,
  StaffProfile,
  WorkArea,
  Shift,
  ShiftAssignment,
  AttendanceRecord,
  TaskItem,
  TaskAssignment,
  HandoverLog,
  AuditEvent,
  InstitutionType,
  ShiftStatus,
  AttendanceStatus,
  TaskStatus,
  HandoverStatus
} from '../types';
import {
  initialOrganization,
  initialProfiles,
  initialWorkAreas,
  initialShifts,
  initialShiftAssignments,
  initialAttendance,
  initialTasks,
  initialTaskAssignments,
  initialHandovers,
  initialAuditEvents
} from './seedData';

const STORAGE_KEY = 'shiftbridge_state_v1';

interface ShiftBridgeState {
  organization: Organization;
  profiles: StaffProfile[];
  workAreas: WorkArea[];
  shifts: Shift[];
  shiftAssignments: ShiftAssignment[];
  attendance: AttendanceRecord[];
  tasks: TaskItem[];
  taskAssignments: TaskAssignment[];
  handovers: HandoverLog[];
  auditEvents: AuditEvent[];
}

export function isShiftBridgeState(value: unknown): value is ShiftBridgeState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<ShiftBridgeState>;
  return Boolean(
    candidate.organization
    && typeof candidate.organization.id === 'string'
    && Array.isArray(candidate.profiles)
    && Array.isArray(candidate.workAreas)
    && Array.isArray(candidate.shifts)
    && Array.isArray(candidate.shiftAssignments)
    && Array.isArray(candidate.attendance)
    && Array.isArray(candidate.tasks)
    && Array.isArray(candidate.taskAssignments)
    && Array.isArray(candidate.handovers)
    && Array.isArray(candidate.auditEvents)
  );
}

function loadState(): ShiftBridgeState {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isShiftBridgeState(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load ShiftBridge local state, falling back to seed data:', err);
    }
  }
  const defaultState: ShiftBridgeState = {
    organization: initialOrganization,
    profiles: initialProfiles,
    workAreas: initialWorkAreas,
    shifts: initialShifts,
    shiftAssignments: initialShiftAssignments,
    attendance: initialAttendance,
    tasks: initialTasks,
    taskAssignments: initialTaskAssignments,
    handovers: initialHandovers,
    auditEvents: initialAuditEvents
  };
  saveState(defaultState);
  return defaultState;
}

function saveState(state: ShiftBridgeState) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save ShiftBridge state to localStorage:', err);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('shiftbridge:state_changed'));
  }
}

class StorageEngine {
  private state: ShiftBridgeState;

  constructor() {
    this.state = loadState();
  }

  // --- Reset / Demo helper ---
  public resetToDefaultSeed(): ShiftBridgeState {
    this.state = {
      organization: { ...initialOrganization },
      profiles: [...initialProfiles],
      workAreas: [...initialWorkAreas],
      shifts: [...initialShifts],
      shiftAssignments: [...initialShiftAssignments],
      attendance: [...initialAttendance],
      tasks: [...initialTasks],
      taskAssignments: [...initialTaskAssignments],
      handovers: [...initialHandovers],
      auditEvents: [...initialAuditEvents]
    };
    saveState(this.state);
    return this.state;
  }

  // --- Organization & Mode Switching ---
  public getOrganization(): Organization {
    return this.state.organization;
  }

  public updateInstitutionType(type: InstitutionType, actorId: string): Organization {
    this.state.organization = {
      ...this.state.organization,
      institution_type: type,
      updated_at: new Date().toISOString()
    };
    this.recordAuditEvent(
      'INSTITUTION_MODE_SWITCH',
      'organization',
      this.state.organization.id,
      `Toggled active operations mode to ${type === 'school_college' ? 'Colleges & Schools' : 'Hospitals (Non-Clinical)'}`,
      { new_mode: type },
      actorId
    );
    saveState(this.state);
    return this.state.organization;
  }

  // --- Profiles & Staff Management ---
  public listProfiles(orgId?: string): StaffProfile[] {
    return this.state.profiles.filter(p => !orgId || p.organization_id === orgId);
  }

  public getProfileById(id: string): StaffProfile | undefined {
    return this.state.profiles.find(p => p.id === id);
  }

  public getProfileByEmail(email: string): StaffProfile | undefined {
    return this.state.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
  }

  public createStaff(
    payload: Omit<StaffProfile, 'id' | 'created_at' | 'updated_at'>,
    actorId: string
  ): StaffProfile {
    const newStaff: StaffProfile = {
      ...payload,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.state.profiles.push(newStaff);
    this.recordAuditEvent(
      'STAFF_CREATED',
      'profile',
      newStaff.id,
      `Added new staff member: ${newStaff.full_name} (${newStaff.job_title})`,
      { email: newStaff.email, role: newStaff.role },
      actorId
    );
    saveState(this.state);
    return newStaff;
  }

  public updateStaff(
    id: string,
    updates: Partial<StaffProfile>,
    actorId: string
  ): StaffProfile {
    const index = this.state.profiles.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Staff profile with id ${id} not found`);

    const old = this.state.profiles[index];
    const updated: StaffProfile = {
      ...old,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.state.profiles[index] = updated;

    this.recordAuditEvent(
      'STAFF_UPDATED',
      'profile',
      id,
      `Updated staff record: ${updated.full_name}`,
      { changes: updates },
      actorId
    );
    saveState(this.state);
    return updated;
  }

  public toggleStaffActive(id: string, actorId: string): StaffProfile {
    const staff = this.getProfileById(id);
    if (!staff) throw new Error('Staff not found');

    const nextActive = !staff.active;
    return this.updateStaff(
      id,
      { active: nextActive },
      actorId
    );
  }

  // --- Work Areas ---
  public listWorkAreas(institutionType?: InstitutionType): WorkArea[] {
    return this.state.workAreas.filter(a => {
      if (institutionType && a.institution_type !== institutionType) return false;
      return true;
    });
  }

  public createWorkArea(
    payload: Omit<WorkArea, 'id' | 'created_at' | 'updated_at'>,
    actorId: string
  ): WorkArea {
    const newArea: WorkArea = {
      ...payload,
      id: `area-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.state.workAreas.push(newArea);
    this.recordAuditEvent(
      'WORK_AREA_CREATED',
      'work_area',
      newArea.id,
      `Created work area: ${newArea.name} (${newArea.institution_type})`,
      { name: newArea.name },
      actorId
    );
    saveState(this.state);
    return newArea;
  }

  public updateWorkArea(
    id: string,
    updates: Partial<WorkArea>,
    actorId: string
  ): WorkArea {
    const index = this.state.workAreas.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Work area not found');

    const updated = {
      ...this.state.workAreas[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.state.workAreas[index] = updated;
    this.recordAuditEvent(
      'WORK_AREA_UPDATED',
      'work_area',
      id,
      `Modified work area ${updated.name}`,
      { updates },
      actorId
    );
    saveState(this.state);
    return updated;
  }

  public toggleWorkAreaActive(id: string, actorId: string): WorkArea {
    const area = this.state.workAreas.find(a => a.id === id);
    if (!area) throw new Error('Work area not found');

    return this.updateWorkArea(id, { active: !area.active }, actorId);
  }

  // --- Shifts & Rostering ---
  public listShifts(filters?: {
    institutionType?: InstitutionType;
    status?: ShiftStatus;
    workAreaId?: string;
    staffProfileId?: string;
    date?: string;
  }): Shift[] {
    let result = [...this.state.shifts];

    if (filters?.institutionType) {
      result = result.filter(s => s.institution_type === filters.institutionType);
    }
    if (filters?.status) {
      result = result.filter(s => s.status === filters.status);
    }
    if (filters?.workAreaId) {
      result = result.filter(s => s.work_area_id === filters.workAreaId);
    }
    if (filters?.date) {
      // Compare YYYY-MM-DD
      result = result.filter(s => s.starts_at.startsWith(filters.date!));
    }
    if (filters?.staffProfileId) {
      const assignedShiftIds = new Set(
        this.state.shiftAssignments
          .filter(sa => sa.staff_profile_id === filters.staffProfileId)
          .map(sa => sa.shift_id)
      );
      result = result.filter(s => assignedShiftIds.has(s.id));
    }

    // Hydrate associations
    return result.map(shift => {
      const workArea = this.state.workAreas.find(a => a.id === shift.work_area_id);
      const assignments = this.state.shiftAssignments
        .filter(sa => sa.shift_id === shift.id)
        .map(sa => {
          const staff = this.state.profiles.find(p => p.id === sa.staff_profile_id);
          const att = this.state.attendance.find(a => a.shift_assignment_id === sa.id);
          return {
            ...sa,
            staff,
            attendance: att
          };
        });

      return {
        ...shift,
        work_area: workArea,
        assignments
      };
    });
  }

  public getShiftById(id: string): Shift | undefined {
    return this.listShifts().find(s => s.id === id);
  }

  public createShift(
    payload: Omit<Shift, 'id' | 'created_at' | 'updated_at'> & { staffIds?: string[] },
    actorId: string,
    overrideReason?: string
  ): Shift {
    const shiftId = `shift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newShift: Shift = {
      id: shiftId,
      organization_id: payload.organization_id || this.state.organization.id,
      work_area_id: payload.work_area_id,
      title: payload.title,
      institution_type: payload.institution_type,
      starts_at: payload.starts_at,
      ends_at: payload.ends_at,
      status: payload.status || 'Scheduled',
      notes: payload.notes || null,
      created_by: actorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.state.shifts.unshift(newShift);

    // Create assignments & attendance
    if (payload.staffIds && payload.staffIds.length > 0) {
      payload.staffIds.forEach(staffId => {
        const assignmentId = `assign-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const assignment: ShiftAssignment = {
          id: assignmentId,
          organization_id: newShift.organization_id,
          shift_id: shiftId,
          staff_profile_id: staffId,
          created_at: new Date().toISOString()
        };
        this.state.shiftAssignments.push(assignment);

        const attendanceRecord: AttendanceRecord = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          organization_id: newShift.organization_id,
          shift_assignment_id: assignmentId,
          status: 'Not Checked In',
          checked_in_at: null,
          checked_out_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.state.attendance.push(attendanceRecord);
      });
    }

    this.recordAuditEvent(
      'SHIFT_CREATED',
      'shift',
      shiftId,
      `Created shift "${newShift.title}" (${payload.staffIds?.length || 0} assignees)${overrideReason ? ' [Overlap Override Confirmed]' : ''}`,
      {
        title: newShift.title,
        starts_at: newShift.starts_at,
        ends_at: newShift.ends_at,
        override_reason: overrideReason || null
      },
      actorId
    );

    saveState(this.state);
    return this.getShiftById(shiftId)!;
  }

  public updateShift(
    id: string,
    updates: Partial<Shift> & { staffIds?: string[] },
    actorId: string
  ): Shift {
    const index = this.state.shifts.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Shift not found');

    const updated: Shift = {
      ...this.state.shifts[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.state.shifts[index] = updated;

    if (updates.staffIds) {
      // Re-assign staff: remove unselected, add newly selected
      const currentAssignments = this.state.shiftAssignments.filter(sa => sa.shift_id === id);
      const currentStaffIds = currentAssignments.map(sa => sa.staff_profile_id);

      // Add missing
      updates.staffIds.forEach(staffId => {
        if (!currentStaffIds.includes(staffId)) {
          const assignmentId = `assign-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          this.state.shiftAssignments.push({
            id: assignmentId,
            organization_id: updated.organization_id,
            shift_id: id,
            staff_profile_id: staffId,
            created_at: new Date().toISOString()
          });
          this.state.attendance.push({
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            organization_id: updated.organization_id,
            shift_assignment_id: assignmentId,
            status: 'Not Checked In',
            checked_in_at: null,
            checked_out_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
    }

    this.recordAuditEvent(
      'SHIFT_UPDATED',
      'shift',
      id,
      `Updated shift "${updated.title}"`,
      { updates },
      actorId
    );

    saveState(this.state);
    return this.getShiftById(id)!;
  }

  public cancelShift(id: string, reason: string, actorId: string): Shift {
    const shift = this.state.shifts.find(s => s.id === id);
    if (!shift) throw new Error('Shift not found');

    shift.status = 'Cancelled';
    shift.updated_at = new Date().toISOString();

    this.recordAuditEvent(
      'SHIFT_CANCELLED',
      'shift',
      id,
      `Cancelled shift "${shift.title}". Reason: ${reason}`,
      { cancellation_reason: reason },
      actorId
    );

    saveState(this.state);
    return this.getShiftById(id)!;
  }

  // --- Attendance ---
  public recordCheckIn(assignmentId: string, actorId: string): AttendanceRecord {
    const index = this.state.attendance.findIndex(a => a.shift_assignment_id === assignmentId);
    if (index === -1) throw new Error('Attendance record not found for shift assignment');

    const current = this.state.attendance[index];
    if (current.status === 'Checked In') {
      throw new Error('Already checked in to this shift');
    }

    const timestamp = new Date().toISOString();
    const updated: AttendanceRecord = {
      ...current,
      status: 'Checked In',
      checked_in_at: timestamp,
      updated_at: timestamp
    };
    this.state.attendance[index] = updated;

    this.recordAuditEvent(
      'ATTENDANCE_CHECKIN',
      'attendance',
      updated.id,
      `Staff checked in at ${timestamp}`,
      { shift_assignment_id: assignmentId, checked_in_at: timestamp },
      actorId
    );

    saveState(this.state);
    return updated;
  }

  public recordCheckOut(assignmentId: string, actorId: string): AttendanceRecord {
    const index = this.state.attendance.findIndex(a => a.shift_assignment_id === assignmentId);
    if (index === -1) throw new Error('Attendance record not found');

    const current = this.state.attendance[index];
    if (current.status !== 'Checked In') {
      throw new Error('Cannot check out before checking in');
    }

    const timestamp = new Date().toISOString();
    const updated: AttendanceRecord = {
      ...current,
      status: 'Checked Out',
      checked_out_at: timestamp,
      updated_at: timestamp
    };
    this.state.attendance[index] = updated;

    this.recordAuditEvent(
      'ATTENDANCE_CHECKOUT',
      'attendance',
      updated.id,
      `Staff checked out at ${timestamp}`,
      { shift_assignment_id: assignmentId, checked_out_at: timestamp },
      actorId
    );

    saveState(this.state);
    return updated;
  }

  public correctAttendance(
    attendanceId: string,
    newStatus: AttendanceStatus,
    reason: string,
    adminId: string
  ): AttendanceRecord {
    const index = this.state.attendance.findIndex(a => a.id === attendanceId);
    if (index === -1) throw new Error('Attendance record not found');

    if (!reason || reason.trim().length < 4) {
      throw new Error('A descriptive correction reason is strictly required by audit policy.');
    }

    const old = this.state.attendance[index];
    const timestamp = new Date().toISOString();
    const updated: AttendanceRecord = {
      ...old,
      status: newStatus,
      corrected_by: adminId,
      correction_reason: reason,
      updated_at: timestamp,
      checked_in_at: newStatus === 'Checked In' && !old.checked_in_at ? timestamp : old.checked_in_at,
      checked_out_at: newStatus === 'Checked Out' && !old.checked_out_at ? timestamp : old.checked_out_at
    };
    this.state.attendance[index] = updated;

    this.recordAuditEvent(
      'ATTENDANCE_CORRECTION',
      'attendance',
      attendanceId,
      `Supervisor corrected attendance status to "${newStatus}". Reason: ${reason}`,
      {
        previous_status: old.status,
        new_status: newStatus,
        correction_reason: reason
      },
      adminId
    );

    saveState(this.state);
    return updated;
  }

  // --- Tasks & Checklists ---
  public listTasks(filters?: {
    institutionType?: InstitutionType;
    status?: TaskStatus;
    shiftId?: string;
    workAreaId?: string;
    staffProfileId?: string;
  }): TaskItem[] {
    let result = [...this.state.tasks];

    if (filters?.shiftId) {
      result = result.filter(t => t.shift_id === filters.shiftId);
    }
    if (filters?.status) {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters?.workAreaId) {
      result = result.filter(t => t.work_area_id === filters.workAreaId);
    }
    if (filters?.staffProfileId) {
      const assignedTaskIds = new Set(
        this.state.taskAssignments
          .filter(ta => ta.staff_profile_id === filters.staffProfileId)
          .map(ta => ta.task_id)
      );
      result = result.filter(t => assignedTaskIds.has(t.id));
    }

    // Hydrate associations
    return result.map(task => {
      const workArea = this.state.workAreas.find(a => a.id === task.work_area_id);
      const shift = this.state.shifts.find(s => s.id === task.shift_id);
      const assignments = this.state.taskAssignments
        .filter(ta => ta.task_id === task.id)
        .map(ta => ({
          ...ta,
          staff: this.state.profiles.find(p => p.id === ta.staff_profile_id)
        }));

      return {
        ...task,
        work_area: workArea,
        shift,
        assignments
      };
    });
  }

  public createTask(
    payload: Omit<TaskItem, 'id' | 'created_at' | 'updated_at'> & { staffIds?: string[] },
    actorId: string
  ): TaskItem {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTask: TaskItem = {
      id: taskId,
      organization_id: payload.organization_id || this.state.organization.id,
      shift_id: payload.shift_id,
      work_area_id: payload.work_area_id,
      title: payload.title,
      description: payload.description || null,
      priority: payload.priority || 'Medium',
      status: payload.status || 'To Do',
      due_at: payload.due_at || null,
      completed_at: payload.completed_at || null,
      block_reason: payload.block_reason || null,
      completion_note: payload.completion_note || null,
      created_by: actorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.state.tasks.unshift(newTask);

    if (payload.staffIds && payload.staffIds.length > 0) {
      payload.staffIds.forEach(staffId => {
        this.state.taskAssignments.push({
          id: `ta-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          organization_id: newTask.organization_id,
          task_id: taskId,
          staff_profile_id: staffId,
          created_at: new Date().toISOString()
        });
      });
    }

    this.recordAuditEvent(
      'TASK_CREATED',
      'task',
      taskId,
      `Created task "${newTask.title}" [Priority: ${newTask.priority}]`,
      { title: newTask.title, priority: newTask.priority },
      actorId
    );

    saveState(this.state);
    return this.listTasks().find(t => t.id === taskId)!;
  }

  public updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    note: string | null,
    blockerReason: string | null,
    actorId: string
  ): TaskItem {
    const index = this.state.tasks.findIndex(t => t.id === taskId);
    if (index === -1) throw new Error('Task not found');

    const current = this.state.tasks[index];
    if (newStatus === 'Blocked' && (!blockerReason || blockerReason.trim().length === 0)) {
      throw new Error('Mandatory blocker reason required when marking a task as Blocked.');
    }

    const timestamp = new Date().toISOString();
    const updated: TaskItem = {
      ...current,
      status: newStatus,
      block_reason: newStatus === 'Blocked' ? blockerReason : current.block_reason,
      completion_note: newStatus === 'Done' ? note : current.completion_note,
      completed_at: newStatus === 'Done' ? timestamp : (newStatus === 'To Do' ? null : current.completed_at),
      updated_at: timestamp
    };
    this.state.tasks[index] = updated;

    this.recordAuditEvent(
      'TASK_STATUS_UPDATE',
      'task',
      taskId,
      `Changed task "${updated.title}" status to "${newStatus}"${newStatus === 'Blocked' ? `: ${blockerReason}` : ''}`,
      {
        previous_status: current.status,
        new_status: newStatus,
        blocker_reason: blockerReason,
        completion_note: note
      },
      actorId
    );

    saveState(this.state);
    return this.listTasks().find(t => t.id === taskId)!;
  }

  // --- Handovers ---
  public listHandovers(filters?: {
    workAreaId?: string;
    shiftId?: string;
    status?: HandoverStatus;
  }): HandoverLog[] {
    let result = [...this.state.handovers];

    if (filters?.workAreaId) {
      result = result.filter(h => h.work_area_id === filters.workAreaId);
    }
    if (filters?.shiftId) {
      result = result.filter(h => h.shift_id === filters.shiftId || h.next_shift_id === filters.shiftId);
    }
    if (filters?.status) {
      result = result.filter(h => h.status === filters.status);
    }

    return result.map(h => ({
      ...h,
      creator: this.state.profiles.find(p => p.id === h.created_by),
      acknowledger: this.state.profiles.find(p => p.id === h.acknowledged_by),
      resolver: this.state.profiles.find(p => p.id === h.resolved_by),
      work_area: this.state.workAreas.find(a => a.id === h.work_area_id),
      shift: this.state.shifts.find(s => s.id === h.shift_id),
      next_shift: this.state.shifts.find(s => s.id === h.next_shift_id)
    }));
  }

  public createHandover(
    payload: Omit<HandoverLog, 'id' | 'created_at' | 'updated_at'>,
    actorId: string
  ): HandoverLog {
    const handoverId = `handover-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newHandover: HandoverLog = {
      id: handoverId,
      organization_id: payload.organization_id || this.state.organization.id,
      shift_id: payload.shift_id,
      next_shift_id: payload.next_shift_id || null,
      work_area_id: payload.work_area_id,
      title: payload.title,
      description: payload.description,
      priority: payload.priority || 'Medium',
      status: 'Open',
      ai_summary: payload.ai_summary || null,
      created_by: actorId,
      acknowledged_by: null,
      acknowledged_at: null,
      resolved_by: null,
      resolved_at: null,
      resolution_note: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.state.handovers.unshift(newHandover);

    this.recordAuditEvent(
      'HANDOVER_CREATED',
      'handover',
      handoverId,
      `Logged shift handover: "${newHandover.title}" [Priority: ${newHandover.priority}]`,
      { title: newHandover.title, priority: newHandover.priority },
      actorId
    );

    saveState(this.state);
    return this.listHandovers().find(h => h.id === handoverId)!;
  }

  public acknowledgeHandover(id: string, actorId: string): HandoverLog {
    const index = this.state.handovers.findIndex(h => h.id === id);
    if (index === -1) throw new Error('Handover not found');

    const timestamp = new Date().toISOString();
    const updated: HandoverLog = {
      ...this.state.handovers[index],
      status: 'Acknowledged',
      acknowledged_by: actorId,
      acknowledged_at: timestamp,
      updated_at: timestamp
    };
    this.state.handovers[index] = updated;

    this.recordAuditEvent(
      'HANDOVER_ACKNOWLEDGED',
      'handover',
      id,
      `Staff acknowledged handover "${updated.title}"`,
      {},
      actorId
    );

    saveState(this.state);
    return this.listHandovers().find(h => h.id === id)!;
  }

  public resolveHandover(id: string, resolutionNote: string, actorId: string): HandoverLog {
    const index = this.state.handovers.findIndex(h => h.id === id);
    if (index === -1) throw new Error('Handover not found');

    const timestamp = new Date().toISOString();
    const updated: HandoverLog = {
      ...this.state.handovers[index],
      status: 'Resolved',
      resolved_by: actorId,
      resolved_at: timestamp,
      resolution_note: resolutionNote,
      updated_at: timestamp
    };
    this.state.handovers[index] = updated;

    this.recordAuditEvent(
      'HANDOVER_RESOLVED',
      'handover',
      id,
      `Resolved handover issue: "${updated.title}". Note: ${resolutionNote}`,
      { resolution_note: resolutionNote },
      actorId
    );

    saveState(this.state);
    return this.listHandovers().find(h => h.id === id)!;
  }

  // --- Audit Events ---
  public listAuditEvents(limit: number = 100): AuditEvent[] {
    return [...this.state.auditEvents]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map(ev => ({
        ...ev,
        actor: this.state.profiles.find(p => p.id === ev.actor_profile_id)
      }));
  }

  public recordAuditEvent(
    action: string,
    entityType: string,
    entityId: string,
    reason?: string | null,
    metadata?: Record<string, unknown>,
    actorId?: string
  ): AuditEvent {
    const newEvent: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organization_id: this.state.organization.id,
      actor_profile_id: actorId || 'user-admin-01',
      action,
      entity_type: entityType,
      entity_id: entityId,
      reason: reason || null,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };
    this.state.auditEvents.unshift(newEvent);
    saveState(this.state);
    return newEvent;
  }
}

export const storageEngine = new StorageEngine();

export function useStorageSubscription() {
  const [rev, setRev] = useState(0);
  useEffect(() => {
    const handler = () => setRev(r => r + 1);
    window.addEventListener('shiftbridge:state_changed', handler);
    return () => window.removeEventListener('shiftbridge:state_changed', handler);
  }, []);
  return rev;
}
