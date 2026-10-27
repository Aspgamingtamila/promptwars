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
  AuditEvent
} from '../types';

export const initialOrganization: Organization = {
  id: 'org-metro-01',
  name: 'ShiftBridge Metro Services Group',
  institution_type: 'school_college',
  timezone: 'America/New_York',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString()
};

export const initialProfiles: StaffProfile[] = [
  {
    id: 'user-admin-01',
    organization_id: 'org-metro-01',
    full_name: 'Elena Vance',
    email: 'admin@shiftbridge.org',
    phone: '+1 (555) 019-2831',
    role: 'admin',
    job_title: 'Operations Director',
    active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-staff-campus',
    organization_id: 'org-metro-01',
    full_name: 'Jordan Lee',
    email: 'staff.campus@shiftbridge.org',
    phone: '+1 (555) 014-9923',
    role: 'staff',
    job_title: 'Campus Facilities Lead',
    active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-staff-hospital',
    organization_id: 'org-metro-01',
    full_name: 'Morgan Chen',
    email: 'staff.hospital@shiftbridge.org',
    phone: '+1 (555) 017-8842',
    role: 'staff',
    job_title: 'Environmental Services Specialist',
    active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-staff-03',
    organization_id: 'org-metro-01',
    full_name: 'Marcus Wright',
    email: 'marcus.wright@shiftbridge.org',
    phone: '+1 (555) 012-3344',
    role: 'staff',
    job_title: 'Sanitation & Safety Lead',
    active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-staff-04',
    organization_id: 'org-metro-01',
    full_name: 'Priya Patel',
    email: 'priya.patel@shiftbridge.org',
    phone: '+1 (555) 018-7711',
    role: 'staff',
    job_title: 'Support Services Coordinator',
    active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-staff-05',
    organization_id: 'org-metro-01',
    full_name: 'Carlos Mendez',
    email: 'carlos.mendez@shiftbridge.org',
    phone: '+1 (555) 016-5522',
    role: 'staff',
    job_title: 'Facilities Technician',
    active: false, // Inactive example to test deactivation filter
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const initialWorkAreas: WorkArea[] = [
  // Colleges & Schools
  {
    id: 'area-school-01',
    organization_id: 'org-metro-01',
    name: 'Classroom Block A & Lecture Halls',
    institution_type: 'school_college',
    description: 'Academic instructional halls 101-108, tiered auditoriums, and media hubs.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'area-school-02',
    organization_id: 'org-metro-01',
    name: 'Science & Engineering Laboratories',
    institution_type: 'school_college',
    description: 'Instructional physics, biochemistry wet labs, and preparation storage bays.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'area-school-03',
    organization_id: 'org-metro-01',
    name: 'Central Campus Library & Study Commons',
    institution_type: 'school_college',
    description: 'Main 3-story study commons, reference archives, and computer workstations.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'area-school-04',
    organization_id: 'org-metro-01',
    name: 'Student Union, Dining & Main Atrium',
    institution_type: 'school_college',
    description: 'High-traffic food service concourse, atrium lounge, and student club offices.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'area-school-05',
    organization_id: 'org-metro-01',
    name: 'Athletics Pavilion & Outdoor Grounds',
    institution_type: 'school_college',
    description: 'Indoor gymnasium courts, fitness suites, locker rooms, and perimeter fields.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'area-school-06',
    organization_id: 'org-metro-01',
    name: 'West Campus Washroom Suites',
    institution_type: 'school_college',
    description: 'Multi-stall sanitation blocks and ADA-accessible facilities across West Wing.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Hospitals (Non-clinical support)
  {
    id: 'area-hosp-01',
    organization_id: 'org-metro-01',
    name: 'North Wing Hallways & Logistics Hub',
    institution_type: 'hospital',
    description: 'Non-clinical ward corridors, clean linen storage, and environmental supply depot.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'area-hosp-02',
    organization_id: 'org-metro-01',
    name: 'Emergency Receiving Logistics & Concourse',
    institution_type: 'hospital',
    description: 'Public triage concourse, ambulance bay vestibule, and sanitation supply bay.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'area-hosp-03',
    organization_id: 'org-metro-01',
    name: 'Central Supply Distribution Corridor',
    institution_type: 'hospital',
    description: 'Materials receiving dock, supply transfer hallways, and clean cart depot.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'area-hosp-04',
    organization_id: 'org-metro-01',
    name: 'Outpatient Waiting & Public Restrooms',
    institution_type: 'hospital',
    description: 'Ground floor public reception, multi-stall sanitation suites, and elevator lobby.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'area-hosp-05',
    organization_id: 'org-metro-01',
    name: 'Surgical Perimeter & Terminal Utility Bay',
    institution_type: 'hospital',
    description: 'Perimeter support corridors, non-clinical waste disposal, and utility staging.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Helper to construct today's timestamps dynamically so demo is always live today
const today = new Date();
const todayYear = today.getFullYear();
const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
const todayDay = String(today.getDate()).padStart(2, '0');
const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

const tomorrow = new Date(Date.now() + 86400000);
const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

export const initialShifts: Shift[] = [
  // Campus Shifts
  {
    id: 'shift-campus-01',
    organization_id: 'org-metro-01',
    work_area_id: 'area-school-01',
    title: 'Morning Campus Facility Operations',
    institution_type: 'school_college',
    starts_at: `${todayStr}T07:00:00Z`,
    ends_at: `${todayStr}T15:30:00Z`,
    status: 'In Progress',
    notes: 'Verify Lecture Hall 101 emergency exits; restock sanitation hubs before 09:00 classes.',
    created_by: 'user-admin-01',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'shift-campus-02',
    organization_id: 'org-metro-01',
    work_area_id: 'area-school-03',
    title: 'Library & Study Commons Afternoon Coverage',
    institution_type: 'school_college',
    starts_at: `${todayStr}T14:00:00Z`,
    ends_at: `${todayStr}T22:00:00Z`,
    status: 'Scheduled',
    notes: 'Early lockup protocol preparation; inspect study cubicle lighting.',
    created_by: 'user-admin-01',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'shift-campus-03',
    organization_id: 'org-metro-01',
    work_area_id: 'area-school-02',
    title: 'Science Labs Evening Sanitation & Lockup',
    institution_type: 'school_college',
    starts_at: `${todayStr}T16:00:00Z`,
    ends_at: `${todayStr}T23:30:00Z`,
    status: 'Scheduled',
    notes: 'Confirm eyewash station compliance; secure chemical prep room doors.',
    created_by: 'user-admin-01',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'shift-campus-overnight',
    organization_id: 'org-metro-01',
    work_area_id: 'area-school-04',
    title: 'Overnight Student Union Floor Restoration',
    institution_type: 'school_college',
    starts_at: `${todayStr}T22:00:00Z`,
    ends_at: `${tomorrowStr}T06:00:00Z`,
    status: 'Scheduled',
    notes: 'Deep scrub and wax atrium flooring; overnight noise permit approved.',
    created_by: 'user-admin-01',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },

  // Hospital Shifts (Non-clinical support)
  {
    id: 'shift-hosp-01',
    organization_id: 'org-metro-01',
    work_area_id: 'area-hosp-01',
    title: 'North Wing Non-Clinical Logistics & Supply',
    institution_type: 'hospital',
    starts_at: `${todayStr}T06:30:00Z`,
    ends_at: `${todayStr}T15:00:00Z`,
    status: 'In Progress',
    notes: 'Corridor sanitation and clean linen replenishment; zero patient contact.',
    created_by: 'user-admin-01',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'shift-hosp-02',
    organization_id: 'org-metro-01',
    work_area_id: 'area-hosp-02',
    title: 'Emergency Concourse Sanitation & Restock',
    institution_type: 'hospital',
    starts_at: `${todayStr}T15:00:00Z`,
    ends_at: `${todayStr}T23:00:00Z`,
    status: 'Scheduled',
    notes: 'Continuous disinfection of high-touch waiting room surfaces and transit corridors.',
    created_by: 'user-admin-01',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'shift-hosp-overnight',
    organization_id: 'org-metro-01',
    work_area_id: 'area-hosp-05',
    title: 'Night Terminal Corridor Disinfection',
    institution_type: 'hospital',
    starts_at: `${todayStr}T23:00:00Z`,
    ends_at: `${tomorrowStr}T07:00:00Z`,
    status: 'Scheduled',
    notes: 'High-level disinfectant buffing across perimeter utility wings.',
    created_by: 'user-admin-01',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const initialShiftAssignments: ShiftAssignment[] = [
  // Jordan Lee on Campus Morning Shift
  {
    id: 'assign-campus-01',
    organization_id: 'org-metro-01',
    shift_id: 'shift-campus-01',
    staff_profile_id: 'user-staff-campus',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  // Marcus Wright on Campus Morning Shift
  {
    id: 'assign-campus-02',
    organization_id: 'org-metro-01',
    shift_id: 'shift-campus-01',
    staff_profile_id: 'user-staff-03',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  // Priya Patel on Campus Afternoon Shift
  {
    id: 'assign-campus-03',
    organization_id: 'org-metro-01',
    shift_id: 'shift-campus-02',
    staff_profile_id: 'user-staff-04',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  // Morgan Chen on Hospital Day Shift
  {
    id: 'assign-hosp-01',
    organization_id: 'org-metro-01',
    shift_id: 'shift-hosp-01',
    staff_profile_id: 'user-staff-hospital',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  // Priya Patel on Hospital Concourse Shift
  {
    id: 'assign-hosp-02',
    organization_id: 'org-metro-01',
    shift_id: 'shift-hosp-02',
    staff_profile_id: 'user-staff-04',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

export const initialAttendance: AttendanceRecord[] = [
  {
    id: 'att-campus-01',
    organization_id: 'org-metro-01',
    shift_assignment_id: 'assign-campus-01',
    status: 'Checked In',
    checked_in_at: `${todayStr}T06:54:12Z`,
    checked_out_at: null,
    created_at: `${todayStr}T06:54:12Z`,
    updated_at: `${todayStr}T06:54:12Z`
  },
  {
    id: 'att-campus-02',
    organization_id: 'org-metro-01',
    shift_assignment_id: 'assign-campus-02',
    status: 'Checked In',
    checked_in_at: `${todayStr}T07:05:00Z`,
    checked_out_at: null,
    created_at: `${todayStr}T07:05:00Z`,
    updated_at: `${todayStr}T07:05:00Z`
  },
  {
    id: 'att-campus-03',
    organization_id: 'org-metro-01',
    shift_assignment_id: 'assign-campus-03',
    status: 'Not Checked In',
    checked_in_at: null,
    checked_out_at: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'att-hosp-01',
    organization_id: 'org-metro-01',
    shift_assignment_id: 'assign-hosp-01',
    status: 'Checked In',
    checked_in_at: `${todayStr}T06:28:44Z`,
    checked_out_at: null,
    created_at: `${todayStr}T06:28:44Z`,
    updated_at: `${todayStr}T06:28:44Z`
  },
  {
    id: 'att-hosp-02',
    organization_id: 'org-metro-01',
    shift_assignment_id: 'assign-hosp-02',
    status: 'Not Checked In',
    checked_in_at: null,
    checked_out_at: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

export const initialTasks: TaskItem[] = [
  // Campus Tasks
  {
    id: 'task-campus-01',
    organization_id: 'org-metro-01',
    shift_id: 'shift-campus-01',
    work_area_id: 'area-school-01',
    title: 'Auditorium Safety & Egress Inspection',
    description: 'Walk main aisles, verify exit signage lamps, and ensure double-door push bars operate smoothly.',
    priority: 'High',
    status: 'Done',
    due_at: `${todayStr}T10:00:00Z`,
    completed_at: `${todayStr}T09:15:00Z`,
    block_reason: null,
    completion_note: 'All 4 double-door egress points tested; exit signage lamps green.',
    created_by: 'user-admin-01',
    created_at: `${todayStr}T06:30:00Z`,
    updated_at: `${todayStr}T09:15:00Z`
  },
  {
    id: 'task-campus-02',
    organization_id: 'org-metro-01',
    shift_id: 'shift-campus-01',
    work_area_id: 'area-school-01',
    title: 'Restock Sanitation Stations in Concourse A',
    description: 'Top up touchless sanitizer dispensers and wipe down handrails at main entrance.',
    priority: 'Medium',
    status: 'In Progress',
    due_at: `${todayStr}T12:00:00Z`,
    completed_at: null,
    block_reason: null,
    completion_note: null,
    created_by: 'user-admin-01',
    created_at: `${todayStr}T06:30:00Z`,
    updated_at: `${todayStr}T07:15:00Z`
  },
  {
    id: 'task-campus-03',
    organization_id: 'org-metro-01',
    shift_id: 'shift-campus-01',
    work_area_id: 'area-school-01',
    title: 'Replace Air Intake Filter in Lecture Hall 101',
    description: 'Install HEPA unit #412 into ceiling access panel above main podium.',
    priority: 'High',
    status: 'Blocked',
    due_at: `${todayStr}T11:00:00Z`,
    completed_at: null,
    block_reason: '12-foot step ladder locked inside Facilities Vault B; awaiting physical master key from supervisor.',
    completion_note: null,
    created_by: 'user-admin-01',
    created_at: `${todayStr}T06:30:00Z`,
    updated_at: `${todayStr}T08:20:00Z`
  },
  {
    id: 'task-campus-04',
    organization_id: 'org-metro-01',
    shift_id: 'shift-campus-02',
    work_area_id: 'area-school-03',
    title: 'Library Study Commons Evening Reset',
    description: 'Clear desk waste, sanitize computer mice & keyboards, and arrange chairs for evening study hours.',
    priority: 'Medium',
    status: 'To Do',
    due_at: `${todayStr}T18:00:00Z`,
    completed_at: null,
    block_reason: null,
    completion_note: null,
    created_by: 'user-admin-01',
    created_at: `${todayStr}T07:00:00Z`,
    updated_at: `${todayStr}T07:00:00Z`
  },

  // Hospital Tasks (Non-Clinical)
  {
    id: 'task-hosp-01',
    organization_id: 'org-metro-01',
    shift_id: 'shift-hosp-01',
    work_area_id: 'area-hosp-01',
    title: 'Terminal Disinfection of Hallway Utility Closet 3B',
    description: 'Scrub utility sinks, empty gray water sumps, and sanitize mop heads per facility protocol.',
    priority: 'High',
    status: 'Done',
    due_at: `${todayStr}T09:00:00Z`,
    completed_at: `${todayStr}T08:40:00Z`,
    block_reason: null,
    completion_note: 'Closet sanitized, drain cleared, chemical log updated.',
    created_by: 'user-admin-01',
    created_at: `${todayStr}T06:00:00Z`,
    updated_at: `${todayStr}T08:40:00Z`
  },
  {
    id: 'task-hosp-02',
    organization_id: 'org-metro-01',
    shift_id: 'shift-hosp-01',
    work_area_id: 'area-hosp-01',
    title: 'Replenish Clean Linen Carts on Level 3 Corridors',
    description: 'Transfer folded sheets and blankets from freight lift to linen closets 301 and 308.',
    priority: 'Medium',
    status: 'In Progress',
    due_at: `${todayStr}T13:00:00Z`,
    completed_at: null,
    block_reason: null,
    completion_note: null,
    created_by: 'user-admin-01',
    created_at: `${todayStr}T06:00:00Z`,
    updated_at: `${todayStr}T07:00:00Z`
  },
  {
    id: 'task-hosp-03',
    organization_id: 'org-metro-01',
    shift_id: 'shift-hosp-01',
    work_area_id: 'area-hosp-01',
    title: 'Decontaminate Freight Lift Floor & Door Tracks',
    description: 'Use antimicrobial foam along sliding door sill tracks to ensure uninhibited transit.',
    priority: 'High',
    status: 'Blocked',
    due_at: `${todayStr}T11:30:00Z`,
    completed_at: null,
    block_reason: 'Freight elevator temporarily reserved for dietary carts until 11:45; cannot hold doors open.',
    completion_note: null,
    created_by: 'user-admin-01',
    created_at: `${todayStr}T06:00:00Z`,
    updated_at: `${todayStr}T09:30:00Z`
  }
];

export const initialTaskAssignments: TaskAssignment[] = [
  { id: 'ta-01', organization_id: 'org-metro-01', task_id: 'task-campus-01', staff_profile_id: 'user-staff-campus', created_at: todayStr },
  { id: 'ta-02', organization_id: 'org-metro-01', task_id: 'task-campus-02', staff_profile_id: 'user-staff-campus', created_at: todayStr },
  { id: 'ta-03', organization_id: 'org-metro-01', task_id: 'task-campus-03', staff_profile_id: 'user-staff-campus', created_at: todayStr },
  { id: 'ta-04', organization_id: 'org-metro-01', task_id: 'task-campus-04', staff_profile_id: 'user-staff-04', created_at: todayStr },
  { id: 'ta-05', organization_id: 'org-metro-01', task_id: 'task-hosp-01', staff_profile_id: 'user-staff-hospital', created_at: todayStr },
  { id: 'ta-06', organization_id: 'org-metro-01', task_id: 'task-hosp-02', staff_profile_id: 'user-staff-hospital', created_at: todayStr },
  { id: 'ta-07', organization_id: 'org-metro-01', task_id: 'task-hosp-03', staff_profile_id: 'user-staff-hospital', created_at: todayStr }
];

export const initialHandovers: HandoverLog[] = [
  // Campus Handover
  {
    id: 'handover-campus-01',
    organization_id: 'org-metro-01',
    shift_id: 'shift-campus-01',
    next_shift_id: 'shift-campus-02',
    work_area_id: 'area-school-01',
    title: 'Lecture Hall 101 Access Ladder Locked in Vault B',
    description: 'HEPA air filter replacement could not be finished because the 12ft ladder was locked in Facilities Vault B. Supervisor Elena has the physical key. Please finish filter replacement during evening shift.',
    priority: 'High',
    status: 'Open',
    ai_summary: 'Air filter replacement in LH101 pending due to locked 12ft ladder in Vault B. Key with Elena. Evening crew needs to complete.',
    created_by: 'user-staff-campus',
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    created_at: `${todayStr}T08:30:00Z`,
    updated_at: `${todayStr}T08:30:00Z`
  },
  {
    id: 'handover-campus-02',
    organization_id: 'org-metro-01',
    shift_id: 'shift-campus-01',
    next_shift_id: 'shift-campus-03',
    work_area_id: 'area-school-02',
    title: 'Chemistry Prep Room Eye-Wash Station Drain Slow',
    description: 'During safety check, the basin drain in Prep Room 204 was draining sluggishly. Trap may need snake clearing.',
    priority: 'Medium',
    status: 'Acknowledged',
    ai_summary: 'Eye-wash basin in Prep Room 204 drains slowly. Snake clearing recommended for next crew.',
    created_by: 'user-staff-03',
    acknowledged_by: 'user-admin-01',
    acknowledged_at: `${todayStr}T09:00:00Z`,
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    created_at: `${todayStr}T08:15:00Z`,
    updated_at: `${todayStr}T09:00:00Z`
  },

  // Hospital Handover (Non-Clinical Facility)
  {
    id: 'handover-hosp-01',
    organization_id: 'org-metro-01',
    shift_id: 'shift-hosp-01',
    next_shift_id: 'shift-hosp-02',
    work_area_id: 'area-hosp-01',
    title: 'North Wing Corridor 3 Floor Buffer Motor Overheating',
    description: 'Industrial rotary floor buffer #03 began emitting motor heat smell at 08:30. Power cord unplugged and machine tagged out in Utility Room 3A. Do not use until maintenance inspection.',
    priority: 'Critical',
    status: 'Open',
    ai_summary: 'Buffer #03 tagged out in Utility 3A due to motor overheating. Do not operate. Maintenance ticket pending.',
    created_by: 'user-staff-hospital',
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    created_at: `${todayStr}T08:45:00Z`,
    updated_at: `${todayStr}T08:45:00Z`
  },
  {
    id: 'handover-hosp-02',
    organization_id: 'org-metro-01',
    shift_id: 'shift-hosp-01',
    next_shift_id: 'shift-hosp-02',
    work_area_id: 'area-hosp-04',
    title: 'Outpatient Restroom Hand Dryer 02 Sensor Replaced',
    description: 'Sensor failure reported yesterday has been replaced with OEM part #8812. Tested and functioning normally.',
    priority: 'Low',
    status: 'Resolved',
    ai_summary: 'Outpatient hand dryer sensor replaced and verified operational.',
    created_by: 'user-staff-hospital',
    acknowledged_by: 'user-admin-01',
    acknowledged_at: `${todayStr}T07:30:00Z`,
    resolved_by: 'user-admin-01',
    resolved_at: `${todayStr}T08:00:00Z`,
    resolution_note: 'Verified voltage and motion trigger. Closed ticket.',
    created_at: `${todayStr}T07:15:00Z`,
    updated_at: `${todayStr}T08:00:00Z`
  }
];

export const initialAuditEvents: AuditEvent[] = [
  {
    id: 'audit-01',
    organization_id: 'org-metro-01',
    actor_profile_id: 'user-admin-01',
    action: 'ORGANIZATION_INITIALIZED',
    entity_type: 'organization',
    entity_id: 'org-metro-01',
    reason: 'System provisioning for Dual-Sector workforce coordination.',
    metadata: { initial_mode: 'school_college' },
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'audit-02',
    organization_id: 'org-metro-01',
    actor_profile_id: 'user-admin-01',
    action: 'SHIFT_SCHEDULED',
    entity_type: 'shift',
    entity_id: 'shift-campus-01',
    reason: 'Scheduled standard morning facility cycle.',
    metadata: { work_area: 'Classroom Block A & Lecture Halls' },
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'audit-03',
    organization_id: 'org-metro-01',
    actor_profile_id: 'user-staff-campus',
    action: 'ATTENDANCE_CHECKIN',
    entity_type: 'attendance',
    entity_id: 'att-campus-01',
    reason: 'Staff self-checkin via authenticated mobile portal.',
    metadata: { timestamp: `${todayStr}T06:54:12Z` },
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  },
  {
    id: 'audit-04',
    organization_id: 'org-metro-01',
    actor_profile_id: 'user-staff-campus',
    action: 'TASK_BLOCKED',
    entity_type: 'task',
    entity_id: 'task-campus-03',
    reason: '12-foot step ladder locked inside Facilities Vault B; awaiting physical master key from supervisor.',
    metadata: { task_title: 'Replace Air Intake Filter in Lecture Hall 101' },
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  }
];
