import React from 'react';
import { UserRole } from '../../types';

interface AvatarProps {
  name?: string | null;
  role?: UserRole | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-9 w-9 text-sm',
  xl: 'h-24 w-24 text-3xl'
};

export const Avatar: React.FC<AvatarProps> = ({ name, role, size = 'md', className = '' }) => {
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '?';
  const colors = role === 'admin'
    ? 'bg-amber-100 text-amber-900 ring-amber-200'
    : 'bg-teal-100 text-teal-900 ring-teal-200';

  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-1 ${sizeClasses[size]} ${colors} ${className}`.trim()}>
      {initials}
    </span>
  );
};
