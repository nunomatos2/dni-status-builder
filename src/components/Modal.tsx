import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white w-full max-w-lg mx-4 rounded-sm shadow-[0_4px_20px_-2px_rgba(181,0,11,0.08)]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-secondary hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
