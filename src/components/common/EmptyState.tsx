import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="w-full p-12 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary-container mb-3 shadow-inner">
        <span className="material-symbols-outlined text-[26px]">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-1">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-md text-label-md transition-all shadow-sm flex items-center gap-1.5"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
