export type InstitutionType = 'school_college' | 'hospital';
export type UserRole = 'admin' | 'staff';

export type ShiftStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
export type AttendanceStatus = 'Not Checked In' | 'Checked In' | 'Checked Out' | 'Absent';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'To Do' | 'In Progress' | 'Blocked' | 'Done';
export type HandoverPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type HandoverStatus = 'Open' | 'Acknowledged' | 'Resolved';

export interface Organization {
  id: string;
  name: string;
  institution_type: InstitutionType;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  job_title: string;
  active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkArea {
  id: string;
  organization_id: string;
  name: string;
  institution_type: InstitutionType;
  description?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  organization_id: string;
  work_area_id: string;
  title: string;
  institution_type: InstitutionType;
  starts_at: string;
  ends_at: string;
  status: ShiftStatus;
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Join / augmented properties:
  work_area?: WorkArea;
  assignments?: ShiftAssignment[];
}

export interface ShiftAssignment {
  id: string;
  organization_id: string;
  shift_id: string;
  staff_profile_id: string;
  created_at: string;
  // Join:
  staff?: StaffProfile;
  attendance?: AttendanceRecord;
}

export interface AttendanceRecord {
  id: string;
  organization_id: string;
  shift_assignment_id: string;
  status: AttendanceStatus;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  corrected_by?: string | null;
  correction_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskItem {
  id: string;
  organization_id: string;
  shift_id: string;
  work_area_id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_at?: string | null;
  completed_at?: string | null;
  block_reason?: string | null;
  completion_note?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Join:
  work_area?: WorkArea;
  shift?: Shift;
  assignments?: TaskAssignment[];
}

export interface TaskAssignment {
  id: string;
  organization_id: string;
  task_id: string;
  staff_profile_id: string;
  created_at: string;
  // Join:
  staff?: StaffProfile;
}

export interface HandoverLog {
  id: string;
  organization_id: string;
  shift_id: string;
  next_shift_id?: string | null;
  work_area_id: string;
  title: string;
  description: string;
  priority: HandoverPriority;
  status: HandoverStatus;
  ai_summary?: string | null;
  created_by: string;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_note?: string | null;
  created_at: string;
  updated_at: string;
  // Join:
  creator?: StaffProfile;
  acknowledger?: StaffProfile;
  resolver?: StaffProfile;
  work_area?: WorkArea;
  shift?: Shift;
  next_shift?: Shift;
}

export interface AuditEvent {
  id: string;
  organization_id: string;
  actor_profile_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  reason?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  // Join:
  actor?: StaffProfile;
}

export interface OverlapConflict {
  staffId: string;
  staffName: string;
  existingShift: Shift;
}
