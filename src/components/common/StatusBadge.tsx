import React from 'react';
import { cn } from '../../lib/utils';

export type StatusVariant =
  | 'Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Not Checked In'
  | 'Checked In'
  | 'Checked Out'
  | 'Absent'
  | 'To Do'
  | 'Blocked'
  | 'Done'
  | 'Open'
  | 'Acknowledged'
  | 'Resolved'
  | 'Overnight'
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className }) => {
  let bgClass = 'bg-surface-container-high border-slate-300 text-on-surface-variant';
  let dotClass = 'bg-slate-400';

  const normalized = status.trim().toLowerCase();

  switch (normalized) {
    case 'scheduled':
    case 'to do':
    case 'not checked in':
      bgClass = 'bg-[#F1F5F9] border-[#CBD5E1] text-[#475569]';
      dotClass = 'bg-[#64748B]';
      break;

    case 'checked in':
    case 'in progress':
      bgClass = 'bg-[#E6F4F2] border-[#99D5CF] text-[#095750]';
      dotClass = 'bg-[#0D7A70] animate-pulse';
      break;

    case 'completed':
    case 'done':
    case 'resolved':
    case 'checked out':
      bgClass = 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]';
      dotClass = 'bg-[#059669]';
      break;

    case 'blocked':
    case 'acknowledged':
    case 'medium':
      bgClass = 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]';
      dotClass = 'bg-[#D97706]';
      break;

    case 'absent':
    case 'cancelled':
    case 'critical':
    case 'urgent':
    case 'high':
      bgClass = 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]';
      dotClass = 'bg-[#DC2626]';
      break;

    case 'overnight':
      bgClass = 'bg-[#F5F3FF] border-[#DDD6FE] text-[#5B21B6]';
      dotClass = 'bg-[#7C3AED]';
      break;

    case 'open':
    case 'low':
      bgClass = 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]';
      dotClass = 'bg-[#3B82F6]';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold tabular-nums tracking-wide shrink-0',
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px] leading-4' : 'px-3 py-1 text-[12px] leading-4',
        bgClass,
        className
      )}
    >
      <span className={cn('rounded-full shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', dotClass)} />
      <span>{status}</span>
    </span>
  );
};
