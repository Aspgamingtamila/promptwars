-- =============================================================================
-- SHIFTBRIDGE DATABASE ARCHITECTURE - MIGRATION 001
-- Multi-Tenant Workforce Coordination for Campus & Hospital Facilities
-- Standards: UUIDv4, TIMESTAMPTZ (UTC), RLS, Non-Clinical Compliance Guardrails
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. HELPER FUNCTIONS & TRIGGER UTILITIES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND active = true
  );
$$;

-- =============================================================================
-- 2. TABLE DEFINITIONS
-- =============================================================================

-- 2.1 organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  institution_type TEXT NOT NULL CHECK (institution_type IN ('school_college', 'hospital')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  job_title TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_org_email_unique UNIQUE (organization_id, email)
);

-- 2.3 work_areas
CREATE TABLE IF NOT EXISTS public.work_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  institution_type TEXT NOT NULL CHECK (institution_type IN ('school_college', 'hospital')),
  description TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT work_areas_org_name_unique UNIQUE (organization_id, name)
);

-- 2.4 shifts
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  work_area_id UUID NOT NULL REFERENCES public.work_areas(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  institution_type TEXT NOT NULL CHECK (institution_type IN ('school_college', 'hospital')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT shifts_chronology_check CHECK (ends_at > starts_at)
);

-- 2.5 shift_assignments
CREATE TABLE IF NOT EXISTS public.shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT,
  staff_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT shift_assignments_shift_staff_unique UNIQUE (shift_id, staff_profile_id)
);

-- 2.6 attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  shift_assignment_id UUID NOT NULL UNIQUE REFERENCES public.shift_assignments(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'not_checked_in' CHECK (status IN ('not_checked_in', 'checked_in', 'checked_out', 'absent')),
  checked_in_at TIMESTAMPTZ NULL,
  checked_out_at TIMESTAMPTZ NULL,
  corrected_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  correction_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT attendance_checkout_after_checkin CHECK (
    checked_out_at IS NULL OR checked_in_at IS NULL OR checked_out_at >= checked_in_at
  ),
  CONSTRAINT attendance_correction_audit_check CHECK (
    (corrected_by IS NULL AND correction_reason IS NULL) OR 
    (corrected_by IS NOT NULL AND correction_reason IS NOT NULL AND length(trim(correction_reason)) > 0)
  )
);

-- 2.7 tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT,
  work_area_id UUID NOT NULL REFERENCES public.work_areas(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'to_do' CHECK (status IN ('to_do', 'in_progress', 'blocked', 'done')),
  due_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  block_reason TEXT NULL,
  completion_note TEXT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT tasks_blocked_reason_required CHECK (
    status <> 'blocked' OR (block_reason IS NOT NULL AND length(trim(block_reason)) > 0)
  ),
  CONSTRAINT tasks_done_completion_timestamp CHECK (
    status <> 'done' OR completed_at IS NOT NULL
  )
);

-- 2.8 task_assignments
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  staff_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT task_assignments_task_staff_unique UNIQUE (task_id, staff_profile_id)
);

-- 2.9 handovers
CREATE TABLE IF NOT EXISTS public.handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT,
  next_shift_id UUID NULL REFERENCES public.shifts(id) ON DELETE SET NULL,
  work_area_id UUID NOT NULL REFERENCES public.work_areas(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  ai_summary TEXT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  acknowledged_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  acknowledged_at TIMESTAMPTZ NULL,
  resolved_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  resolved_at TIMESTAMPTZ NULL,
  resolution_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT handovers_acknowledgment_check CHECK (
    status <> 'acknowledged' OR (acknowledged_by IS NOT NULL AND acknowledged_at IS NOT NULL)
  ),
  CONSTRAINT handovers_resolution_check CHECK (
    status <> 'resolved' OR (resolved_by IS NOT NULL AND resolved_at IS NOT NULL AND resolution_note IS NOT NULL AND length(trim(resolution_note)) > 0)
  ),
  CONSTRAINT handovers_non_clinical_phi_guardrail CHECK (
    description !~* '(\\yMRN\\s*[:#]?\\s*\\d+|\\ySSN\\s*[:#]?\\s*\\d{3}-\\d{2}-\\d{4}|\\yDOB\\s*[:#]?\\s*\\d{1,2}/\\d{1,2}/\\d{2,4}|\\y(medical record|patient name|patient dob|clinical diagnosis)\\y)'
  )
);

-- 2.10 audit_events
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  actor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reason TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 3. UPDATED_AT TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_work_areas_updated_at ON public.work_areas;
CREATE TRIGGER trg_work_areas_updated_at BEFORE UPDATE ON public.work_areas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_shifts_updated_at ON public.shifts;
CREATE TRIGGER trg_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON public.attendance;
CREATE TRIGGER trg_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_handovers_updated_at ON public.handovers;
CREATE TRIGGER trg_handovers_updated_at BEFORE UPDATE ON public.handovers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- 4.1 organizations
DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
CREATE POLICY "organizations_select" ON public.organizations
  FOR SELECT USING (id = public.get_auth_org_id());

DROP POLICY IF EXISTS "organizations_admin_update" ON public.organizations;
CREATE POLICY "organizations_admin_update" ON public.organizations
  FOR UPDATE
  USING (id = public.get_auth_org_id() AND public.is_admin())
  WITH CHECK (id = public.get_auth_org_id() AND public.is_admin());

-- 4.2 profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() 
    OR (organization_id = public.get_auth_org_id() AND public.is_admin())
  );

DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    organization_id = public.get_auth_org_id() AND public.is_admin()
  );

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE
  USING (
    (organization_id = public.get_auth_org_id() AND public.is_admin())
    OR (id = auth.uid())
  )
  WITH CHECK (
    (organization_id = public.get_auth_org_id() AND public.is_admin())
    OR (id = auth.uid() AND organization_id = public.get_auth_org_id())
  );

-- 4.3 work_areas
DROP POLICY IF EXISTS "work_areas_select" ON public.work_areas;
CREATE POLICY "work_areas_select" ON public.work_areas
  FOR SELECT USING (
    organization_id = public.get_auth_org_id()
    AND (public.is_admin() OR active = true)
  );

DROP POLICY IF EXISTS "work_areas_admin_all" ON public.work_areas;
CREATE POLICY "work_areas_admin_all" ON public.work_areas
  FOR ALL
  USING (organization_id = public.get_auth_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.get_auth_org_id() AND public.is_admin());

-- 4.4 shifts
DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
CREATE POLICY "shifts_select" ON public.shifts
  FOR SELECT USING (
    organization_id = public.get_auth_org_id()
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.shift_assignments sa
        WHERE sa.shift_id = shifts.id
        AND sa.staff_profile_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "shifts_admin_all" ON public.shifts;
CREATE POLICY "shifts_admin_all" ON public.shifts
  FOR ALL
  USING (organization_id = public.get_auth_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.get_auth_org_id() AND public.is_admin());

-- 4.5 shift_assignments
DROP POLICY IF EXISTS "shift_assignments_select" ON public.shift_assignments;
CREATE POLICY "shift_assignments_select" ON public.shift_assignments
  FOR SELECT USING (
    organization_id = public.get_auth_org_id()
    AND (public.is_admin() OR staff_profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "shift_assignments_admin_all" ON public.shift_assignments;
CREATE POLICY "shift_assignments_admin_all" ON public.shift_assignments
  FOR ALL
  USING (organization_id = public.get_auth_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.get_auth_org_id() AND public.is_admin());

-- 4.6 attendance
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
CREATE POLICY "attendance_select" ON public.attendance
  FOR SELECT USING (
    organization_id = public.get_auth_org_id()
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.shift_assignments sa
        WHERE sa.id = attendance.shift_assignment_id
        AND sa.staff_profile_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
CREATE POLICY "attendance_insert" ON public.attendance
  FOR INSERT WITH CHECK (
    organization_id = public.get_auth_org_id()
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.shift_assignments sa
        WHERE sa.id = attendance.shift_assignment_id
        AND sa.staff_profile_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "attendance_update" ON public.attendance;
CREATE POLICY "attendance_update" ON public.attendance
  FOR UPDATE
  USING (
    organization_id = public.get_auth_org_id()
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.shift_assignments sa
        WHERE sa.id = attendance.shift_assignment_id
        AND sa.staff_profile_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    organization_id = public.get_auth_org_id()
  );

-- 4.7 tasks
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    organization_id = public.get_auth_org_id()
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.task_assignments ta
        WHERE ta.task_id = tasks.id
        AND ta.staff_profile_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "tasks_admin_insert" ON public.tasks;
CREATE POLICY "tasks_admin_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    organization_id = public.get_auth_org_id() AND public.is_admin()
  );

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE
  USING (
    organization_id = public.get_auth_org_id()
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.task_assignments ta
        WHERE ta.task_id = tasks.id
        AND ta.staff_profile_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    organization_id = public.get_auth_org_id()
  );

DROP POLICY IF EXISTS "tasks_admin_delete" ON public.tasks;
CREATE POLICY "tasks_admin_delete" ON public.tasks
  FOR DELETE USING (
    organization_id = public.get_auth_org_id() AND public.is_admin()
  );

-- 4.8 task_assignments
DROP POLICY IF EXISTS "task_assignments_select" ON public.task_assignments;
CREATE POLICY "task_assignments_select" ON public.task_assignments
  FOR SELECT USING (
    organization_id = public.get_auth_org_id()
    AND (public.is_admin() OR staff_profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "task_assignments_admin_all" ON public.task_assignments;
CREATE POLICY "task_assignments_admin_all" ON public.task_assignments
  FOR ALL
  USING (organization_id = public.get_auth_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.get_auth_org_id() AND public.is_admin());

-- 4.9 handovers
DROP POLICY IF EXISTS "handovers_select" ON public.handovers;
CREATE POLICY "handovers_select" ON public.handovers
  FOR SELECT USING (
    organization_id = public.get_auth_org_id()
    AND (
      public.is_admin()
      OR created_by = auth.uid()
      OR work_area_id IN (
        SELECT s.work_area_id
        FROM public.shift_assignments sa
        JOIN public.shifts s ON s.id = sa.shift_id
        WHERE sa.staff_profile_id = auth.uid()
      )
      OR shift_id IN (
        SELECT sa.shift_id
        FROM public.shift_assignments sa
        WHERE sa.staff_profile_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "handovers_insert" ON public.handovers;
CREATE POLICY "handovers_insert" ON public.handovers
  FOR INSERT WITH CHECK (
    organization_id = public.get_auth_org_id()
    AND (
      public.is_admin()
      OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "handovers_update" ON public.handovers;
CREATE POLICY "handovers_update" ON public.handovers
  FOR UPDATE
  USING (
    organization_id = public.get_auth_org_id()
    AND (
      public.is_admin()
      OR created_by = auth.uid()
      OR work_area_id IN (
        SELECT s.work_area_id
        FROM public.shift_assignments sa
        JOIN public.shifts s ON s.id = sa.shift_id
        WHERE sa.staff_profile_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    organization_id = public.get_auth_org_id()
  );

-- 4.10 audit_events
DROP POLICY IF EXISTS "audit_events_select_admin" ON public.audit_events;
CREATE POLICY "audit_events_select_admin" ON public.audit_events
  FOR SELECT USING (
    organization_id = public.get_auth_org_id() AND public.is_admin()
  );

DROP POLICY IF EXISTS "audit_events_insert_all" ON public.audit_events;
CREATE POLICY "audit_events_insert_all" ON public.audit_events
  FOR INSERT WITH CHECK (
    organization_id = public.get_auth_org_id()
    AND actor_profile_id = auth.uid()
  );

DROP POLICY IF EXISTS "audit_events_deny_update" ON public.audit_events;
CREATE POLICY "audit_events_deny_update" ON public.audit_events FOR UPDATE USING (false);

DROP POLICY IF EXISTS "audit_events_deny_delete" ON public.audit_events;
CREATE POLICY "audit_events_deny_delete" ON public.audit_events FOR DELETE USING (false);
