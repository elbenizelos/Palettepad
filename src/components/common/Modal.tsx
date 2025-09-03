import React from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-lg'
}

export default function Modal({ open, onClose, title, children, actions, maxWidth = 'max-w-xl' }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-[92%] ${maxWidth} rounded-2xl bg-white dark:bg-neutral-900 shadow-xl p-5`}>
        {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
        <div className="space-y-3">{children}</div>
        {actions && <div className="mt-5 flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}
