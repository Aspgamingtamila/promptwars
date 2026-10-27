import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isAfter, isBefore, isValid, subHours } from 'date-fns';
import { Shift, OverlapConflict } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(isoString: string): string {
  if (!isoString) return '--:--';
  try {
    return format(parseISO(isoString), 'HH:mm');
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string): string {
  if (!isoString) return '--';
  try {
    return format(parseISO(isoString), 'MMM d, yyyy');
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '--';
  try {
    return format(parseISO(isoString), 'MMM d, yyyy • HH:mm');
  } catch {
    return isoString;
  }
}

export function isOvernightShift(startsAt: string, endsAt: string): boolean {
  if (!startsAt || !endsAt) return false;
  try {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const startDateStr = `${start.getUTCFullYear()}-${start.getUTCMonth()}-${start.getUTCDate()}`;
    const endDateStr = `${end.getUTCFullYear()}-${end.getUTCMonth()}-${end.getUTCDate()}`;
    return startDateStr !== endDateStr || end < start;
  } catch {
    return false;
  }
}

export function formatDuration(startsAt: string, endsAt: string): string {
  if (!startsAt || !endsAt) return '';
  try {
    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return '';
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}m`;
  } catch {
    return '';
  }
}

/**
 * Check if the current time is within the eligible check-in window.
 * PRD 6.3: "simple default window of two hours before shift start through shift end"
 */
export function isCheckInEligible(startsAt: string, endsAt: string, now: Date = new Date()): { eligible: boolean; message: string } {
  try {
    const start = parseISO(startsAt);
    const end = parseISO(endsAt);
    if (!isValid(start) || !isValid(end) || !isValid(now) || !isAfter(end, start)) {
      return { eligible: false, message: 'Shift schedule is invalid. Contact your administrator.' };
    }
    const windowStart = subHours(start, 2);

    if (isBefore(now, windowStart)) {
      return {
        eligible: false,
        message: `Check-in opens at ${format(windowStart, 'HH:mm')} (2 hours prior to shift).`
      };
    }

    if (isAfter(now, end)) {
      return {
        eligible: false,
        message: `Shift ended at ${format(end, 'HH:mm')}. Window closed.`
      };
    }

    return {
      eligible: true,
      message: 'Eligible for Check-In'
    };
  } catch {
    return { eligible: false, message: 'Shift schedule is invalid. Contact your administrator.' };
  }
}

/**
 * Detect shift overlap for assigned staff member:
 * (ExistingStart < NewEnd) AND (ExistingEnd > NewStart)
 */
export function checkStaffShiftOverlap(
  allShifts: Shift[],
  staffId: string,
  staffName: string,
  newStartISO: string,
  newEndISO: string,
  excludeShiftId?: string
): OverlapConflict | null {
  try {
    const newStart = new Date(newStartISO).getTime();
    const newEnd = new Date(newEndISO).getTime();

    for (const shift of allShifts) {
      if (excludeShiftId && shift.id === excludeShiftId) continue;
      if (shift.status === 'Cancelled') continue;

      const isAssigned = shift.assignments?.some(a => a.staff_profile_id === staffId);
      if (!isAssigned) continue;

      const existingStart = new Date(shift.starts_at).getTime();
      const existingEnd = new Date(shift.ends_at).getTime();

      // Overlap condition
      if (existingStart < newEnd && existingEnd > newStart) {
        return {
          staffId,
          staffName,
          existingShift: shift
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Export data array to CSV file download in browser
 */
export function serializeToCSV<T extends object>(rows: T[]): string {
  if (!rows || !rows.length) return '';
  const keys = Object.keys(rows[0]) as Array<keyof T>;
  const escapeCell = (value: unknown) => {
    const raw = value == null ? '' : value instanceof Date ? value.toLocaleString() : String(value);
    // Prevent spreadsheet formula execution when exported data is opened in Excel/Sheets.
    const safe = /^[\u0000-\u0020\uFEFF]*[=+@-]/u.test(raw) ? `'${raw}` : raw;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [
    keys.map(key => escapeCell(String(key))).join(','),
    ...rows.map(row => keys.map(key => escapeCell(row[key])).join(','))
  ].join('\r\n');
}

export function exportToCSV<T extends object>(filename: string, rows: T[]) {
  if (!rows || !rows.length) return;
  const csvContent = serializeToCSV(rows);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}
