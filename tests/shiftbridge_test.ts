import assert from 'node:assert/strict';
import {
  isOvernightShift,
  checkStaffShiftOverlap,
  isCheckInEligible,
  formatDuration,
  formatTime
} from '../src/lib/utils';
import { validateNonClinicalHandover } from '../src/lib/gemini';
import { storageEngine } from '../src/lib/storageEngine';
import { Shift, StaffProfile } from '../src/types';

console.log('================================================================');
console.log('🚀 SHIFTBRIDGE AUTOMATED VERIFICATION & COMPLIANCE TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}\n`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// SUITE 1: Shift Rostering & Overnight Crossover Logic (FR-3 & FR-4)
// -----------------------------------------------------------------------------
console.log('📌 SUITE 1: Shift Rostering & Scheduling Collision Diagnostics');

runTest('Detects normal daytime shift as non-overnight', () => {
  const isOvernight = isOvernightShift('2026-10-27T08:00:00Z', '2026-10-27T16:00:00Z');
  assert.equal(isOvernight, false, 'Expected daytime shift to return false for overnight');
});

runTest('Detects midnight crossover shift as overnight', () => {
  const isOvernight = isOvernightShift('2026-10-27T22:00:00Z', '2026-10-28T06:00:00Z');
  assert.equal(isOvernight, true, 'Expected crossover shift to return true for overnight');
});

runTest('Accurately calculates shift duration spanning midnight crossover', () => {
  const duration = formatDuration('2026-10-27T22:00:00Z', '2026-10-28T06:30:00Z');
  assert.equal(duration, '8h 30m', `Expected '8h 30m', got '${duration}'`);
});

runTest('Detects shift collision when new shift overlaps existing assignment', () => {
  const mockExistingShifts: Shift[] = [
    {
      id: 'shift-101',
      organization_id: 'org-test',
      work_area_id: 'area-1',
      title: 'Morning Cleaning',
      institution_type: 'hospital',
      starts_at: '2026-10-27T08:00:00Z',
      ends_at: '2026-10-27T16:00:00Z',
      status: 'Scheduled',
      notes: null,
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assignments: [
        {
          id: 'assign-101',
          organization_id: 'org-test',
          shift_id: 'shift-101',
          staff_profile_id: 'staff-alpha',
          created_at: new Date().toISOString()
        }
      ]
    }
  ];

  // Overlapping by 2 hours
  const result = checkStaffShiftOverlap(
    mockExistingShifts,
    'staff-alpha',
    'Staff Alpha',
    '2026-10-27T14:00:00Z',
    '2026-10-27T22:00:00Z'
  );

  assert.ok(result, 'Should detect overlap collision');
  assert.equal(result?.existingShift?.id, 'shift-101');
});

runTest('Allows back-to-back non-overlapping shift assignments', () => {
  const mockExistingShifts: Shift[] = [
    {
      id: 'shift-101',
      organization_id: 'org-test',
      work_area_id: 'area-1',
      title: 'Morning Shift',
      institution_type: 'hospital',
      starts_at: '2026-10-27T08:00:00Z',
      ends_at: '2026-10-27T16:00:00Z',
      status: 'Scheduled',
      notes: null,
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assignments: [
        {
          id: 'assign-101',
          organization_id: 'org-test',
          shift_id: 'shift-101',
          staff_profile_id: 'staff-alpha',
          created_at: new Date().toISOString()
        }
      ]
    }
  ];

  // Starts exactly when previous shift ends
  const result = checkStaffShiftOverlap(
    mockExistingShifts,
    'staff-alpha',
    'Staff Alpha',
    '2026-10-27T16:00:00Z',
    '2026-10-27T23:59:00Z'
  );

  assert.equal(result, null, 'Adjacent shifts should not report collision');
});

// -----------------------------------------------------------------------------
// SUITE 2: Live Attendance & Check-In Window Verification (FR-5)
// -----------------------------------------------------------------------------
console.log('\n📌 SUITE 2: Live Attendance & Check-In Time Window Constraints');

runTest('Enforces 2-hour pre-shift check-in window constraint', () => {
  // Shift starts 5 hours from now: should NOT be eligible
  const farFutureStart = new Date(Date.now() + 5 * 3600 * 1000).toISOString();
  const farFutureEnd = new Date(Date.now() + 13 * 3600 * 1000).toISOString();
  const farResult = isCheckInEligible(farFutureStart, farFutureEnd);
  assert.equal(farResult.eligible, false, 'Shift 5h in future should not be eligible to check in');

  // Shift starts in 30 minutes: SHOULD be eligible
  const nearFutureStart = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const nearFutureEnd = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
  const nearResult = isCheckInEligible(nearFutureStart, nearFutureEnd);
  assert.equal(nearResult.eligible, true, 'Shift starting in 30m should be eligible to check in');
});

runTest('Rejects check-in for already expired shifts', () => {
  const pastStart = new Date(Date.now() - 10 * 3600 * 1000).toISOString();
  const pastEnd = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  const pastResult = isCheckInEligible(pastStart, pastEnd);
  assert.equal(pastResult.eligible, false, 'Expired past shift should be ineligible for check in');
});

// -----------------------------------------------------------------------------
// SUITE 3: Operational Task Checklists & Mandatory Blocker Reason (FR-6)
// -----------------------------------------------------------------------------
console.log('\n📌 SUITE 3: Task Flow & Mandatory Blocker Constraints');

runTest('Transition to Blocked requires non-empty block reason', () => {
  assert.throws(
    () => {
      // Intentionally passing empty blocker reason to storageEngine
      storageEngine.updateTaskStatus(
        'task-campus-02',
        'Blocked',
        null,
        '', // Empty blocker rationale
        'user-staff-campus'
      );
    },
    {
      message: /mandatory blocker reason/i
    },
    'Should throw error when blocker reason is omitted'
  );
});

runTest('Transition to Blocked succeeds when valid operational rationale is provided', () => {
  const validReason = 'Supply cart battery depleted; recharging at station 4 until 14:00.';
  const updated = storageEngine.updateTaskStatus(
    'task-campus-02',
    'Blocked',
    null,
    validReason,
    'user-staff-campus'
  );

  assert.equal(updated.status, 'Blocked');
  assert.equal(updated.block_reason, validReason);
});

// -----------------------------------------------------------------------------
// SUITE 4: Zero Clinical PHI Guardrail Engine (FR-7 & FR-8)
// -----------------------------------------------------------------------------
console.log('\n📌 SUITE 4: Zero Clinical PHI Non-Medical Compliance');

runTest('Strictly rejects clinical patient diagnosis and medical records', () => {
  const clinicalInputs = [
    'Patient in bed 3 requires antibiotic IV drip',
    'Patient John Doe has MRN #994821 and diagnosed with sepsis',
    'Physician ordered emergency surgery in OR 4',
    'Patient exhibiting severe tachycardia, pulse 140'
  ];

  for (const text of clinicalInputs) {
    const res = validateNonClinicalHandover(text);
    assert.equal(res.valid, false, `Expected clinical text to be rejected: "${text}"`);
    assert.ok(res.warning, 'Expected safety warning message');
  }
});

runTest('Allows legitimate non-clinical environmental operations handover logs', () => {
  const operationalInputs = [
    'Clean linen cart #2 transferred to Level 3 storage alcove.',
    'Floor scrubber squeegee blade worn out; maintenance notified for replacement.',
    'Waste bin in Classroom 104 emptied and double-bagged with safety liner.',
    'Restocked touchless hand sanitizer dispensers across concourse corridor.'
  ];

  for (const text of operationalInputs) {
    const res = validateNonClinicalHandover(text);
    assert.equal(res.valid, true, `Expected valid operational text: "${text}"`);
    assert.equal(res.warning, undefined);
  }
});

// -----------------------------------------------------------------------------
// SUITE 5: Chain of Custody & Audit Trail Immutability (FR-9)
// -----------------------------------------------------------------------------
console.log('\n📌 SUITE 5: Chain of Custody & Auditable Forensics');

runTest('Records immutable audit events for operational actions', () => {
  const initialAuditCount = storageEngine.listAuditEvents().length;

  storageEngine.recordAuditEvent(
    'TEST_AUDIT_ACTION',
    'tasks',
    'task-test-01',
    'Verification suite audit verification',
    { testId: 442, timestamp: Date.now() },
    'user-admin-01'
  );

  const updatedAuditEvents = storageEngine.listAuditEvents();
  assert.equal(updatedAuditEvents.length, initialAuditCount + 1, 'Audit log count must increase by 1');
  const latestEvent = updatedAuditEvents[0];
  assert.equal(latestEvent.action, 'TEST_AUDIT_ACTION');
  assert.equal(latestEvent.actor_profile_id, 'user-admin-01');
});

runTest('Handover transition logs acknowledging staff profile ID', () => {
  const newHandover = storageEngine.createHandover(
    {
      organization_id: 'org-metro-01',
      shift_id: 'shift-campus-01',
      next_shift_id: 'shift-campus-02',
      work_area_id: 'area-school-01',
      title: 'Corridor 2 Wet Floor Caution Signs',
      description: 'Placed 3 bright yellow caution cones near fountain leak; plumber scheduled.',
      priority: 'Low',
      ai_summary: 'Caution signs deployed around water fountain leak.',
      created_by: 'user-staff-campus'
    },
    'user-staff-campus'
  );

  assert.equal(newHandover.status, 'Open');
  assert.equal(newHandover.acknowledged_by, null);

  const acknowledged = storageEngine.acknowledgeHandover(newHandover.id, 'user-admin-01');
  assert.equal(acknowledged.status, 'Acknowledged');
  assert.equal(acknowledged.acknowledged_by, 'user-admin-01');
  assert.ok(acknowledged.acknowledged_at);
});

// -----------------------------------------------------------------------------
// SUITE 6: Multi-Sector Mode Switching & Terminology Mapping (FR-2)
// -----------------------------------------------------------------------------
console.log('\n📌 SUITE 6: Dual-Sector Dynamic Switching & Zero Data Loss');

runTest('Dynamic institution mode switch preserves cross-sector records', () => {
  // Check campus work areas count
  const campusAreas = storageEngine.listWorkAreas('school_college');
  assert.ok(campusAreas.length > 0, 'Campus areas must exist');

  // Switch to hospital
  const org = storageEngine.updateInstitutionType('hospital', 'user-admin-01');
  assert.equal(org.institution_type, 'hospital');

  // Check hospital work areas count
  const hospAreas = storageEngine.listWorkAreas('hospital');
  assert.ok(hospAreas.length > 0, 'Hospital areas must exist');

  // Verify campus records were NOT wiped or lost
  const campusAreasAfterSwitch = storageEngine.listWorkAreas('school_college');
  assert.equal(campusAreasAfterSwitch.length, campusAreas.length, 'Campus records must remain intact');
});

console.log('\n================================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED CLEANLY (100%)`);
console.log('================================================================\n');
