-- Apply server-side write guards to the database schema draft. RLS decides
-- which rows a staff member may edit; these triggers limit which fields and
-- transitions they may change on those rows.

CREATE OR REPLACE FUNCTION public.guard_staff_attendance_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  shift_start timestamptz;
  shift_end timestamptz;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.shift_assignment_id IS DISTINCT FROM OLD.shift_assignment_id
     OR NEW.corrected_by IS DISTINCT FROM OLD.corrected_by
     OR NEW.correction_reason IS DISTINCT FROM OLD.correction_reason
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Staff may not change attendance ownership or correction audit fields.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'not_checked_in' AND NEW.status = 'checked_in' THEN
      SELECT s.starts_at, s.ends_at
      INTO shift_start, shift_end
      FROM public.shift_assignments AS sa
      JOIN public.shifts AS s ON s.id = sa.shift_id
      WHERE sa.id = OLD.shift_assignment_id
        AND sa.staff_profile_id = auth.uid();

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Attendance assignment does not belong to the current staff member.'
          USING ERRCODE = '42501';
      END IF;
      IF now() < shift_start - interval '2 hours' OR now() > shift_end THEN
        RAISE EXCEPTION 'Check-in is outside the allowed shift window.'
          USING ERRCODE = '42501';
      END IF;
      NEW.checked_in_at := now();
      NEW.checked_out_at := NULL;
    ELSIF OLD.status = 'checked_in' AND NEW.status = 'checked_out' THEN
      IF OLD.checked_in_at IS NULL THEN
        RAISE EXCEPTION 'A check-in is required before check-out.'
          USING ERRCODE = '42501';
      END IF;
      NEW.checked_in_at := OLD.checked_in_at;
      NEW.checked_out_at := now();
    ELSE
      RAISE EXCEPTION 'Staff may only check in or check out their assigned shift.'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.checked_in_at IS DISTINCT FROM OLD.checked_in_at
        OR NEW.checked_out_at IS DISTINCT FROM OLD.checked_out_at THEN
    RAISE EXCEPTION 'Attendance timestamps are set by the database.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attendance_guard_staff_updates ON public.attendance;
CREATE TRIGGER trg_attendance_guard_staff_updates
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_staff_attendance_updates();

CREATE OR REPLACE FUNCTION public.guard_staff_task_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.shift_id IS DISTINCT FROM OLD.shift_id
     OR NEW.work_area_id IS DISTINCT FROM OLD.work_area_id
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.priority IS DISTINCT FROM OLD.priority
     OR NEW.due_at IS DISTINCT FROM OLD.due_at
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Staff may only update progress on assigned tasks.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'done' THEN
      NEW.completed_at := now();
    ELSE
      NEW.completed_at := NULL;
    END IF;
  ELSIF NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
    RAISE EXCEPTION 'Task completion timestamps are set by the database.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_guard_staff_updates ON public.tasks;
CREATE TRIGGER trg_tasks_guard_staff_updates
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_staff_task_updates();

CREATE OR REPLACE FUNCTION public.guard_staff_handover_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.shift_id IS DISTINCT FROM OLD.shift_id
     OR NEW.next_shift_id IS DISTINCT FROM OLD.next_shift_id
     OR NEW.work_area_id IS DISTINCT FROM OLD.work_area_id
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.priority IS DISTINCT FROM OLD.priority
     OR NEW.ai_summary IS DISTINCT FROM OLD.ai_summary
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Staff may not change handover content or ownership.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status = OLD.status THEN
    IF NEW.acknowledged_by IS DISTINCT FROM OLD.acknowledged_by
       OR NEW.acknowledged_at IS DISTINCT FROM OLD.acknowledged_at
       OR NEW.resolved_by IS DISTINCT FROM OLD.resolved_by
       OR NEW.resolved_at IS DISTINCT FROM OLD.resolved_at
       OR NEW.resolution_note IS DISTINCT FROM OLD.resolution_note THEN
      RAISE EXCEPTION 'Acknowledgement and resolution fields require a status transition.'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status = 'acknowledged' AND OLD.status = 'open' THEN
    NEW.acknowledged_by := auth.uid();
    NEW.acknowledged_at := now();
  ELSIF NEW.status = 'resolved' AND OLD.status IN ('open', 'acknowledged') THEN
    NEW.resolved_by := auth.uid();
    NEW.resolved_at := now();
  ELSE
    RAISE EXCEPTION 'This handover status transition is not allowed.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handovers_guard_staff_updates ON public.handovers;
CREATE TRIGGER trg_handovers_guard_staff_updates
  BEFORE UPDATE ON public.handovers
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_staff_handover_updates();
