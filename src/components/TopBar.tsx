interface TopBarProps {
  view: 'home' | 'session' | 'editor' | 'summary';
  onBack?: () => void;
  onNewSession?: () => void;
  onSave?: () => void;
  onGenerateSummary?: () => void;
  saveLabel?: string;
}

export default function TopBar({ view, onBack, onNewSession, onSave, onGenerateSummary, saveLabel }: TopBarProps) {
  return (
    <header className="fixed top-0 w-full h-14 z-50 bg-white/80 backdrop-blur-[20px] border-b-[3px] border-primary-container flex justify-between items-center px-4 md:px-6">
      <div className="flex items-center gap-4 md:gap-6 min-w-0">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col">
            <span className="text-primary-container font-black text-lg md:text-xl tracking-tighter leading-none">
              DNI Status Builder
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-secondary -mt-0.5">
              Dire\u00e7\u00e3o Digital e Inova\u00e7\u00e3o
            </span>
          </div>
        </div>

        {/* Separator + Breadcrumb */}
        {view !== 'home' && (
          <>
            <div className="hidden md:block h-6 w-px bg-surface-high shrink-0" />
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-secondary hover:text-on-surface transition-colors group min-w-0"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="text-[11px] font-bold uppercase tracking-wider truncate">
                {view === 'session' && 'Sess\u00f5es'}
                {view === 'editor' && 'Guardar e voltar'}
                {view === 'summary' && 'Voltar'}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {view === 'home' && onNewSession && (
          <button
            onClick={onNewSession}
            className="bg-linear-to-r from-primary-container to-primary text-on-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span className="hidden sm:inline">Nova Sess\u00e3o</span>
          </button>
        )}

        {view === 'session' && onGenerateSummary && (
          <button
            onClick={onGenerateSummary}
            className="bg-linear-to-r from-primary-container to-primary text-on-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            <span className="hidden sm:inline">Gerar Resumo IA</span>
          </button>
        )}

        {view === 'editor' && onSave && (
          <button
            onClick={onSave}
            className="bg-linear-to-r from-primary-container to-primary text-on-primary px-5 py-2 text-[11px] font-bold uppercase tracking-widest rounded-sm hover:opacity-90 active:scale-95 transition-all"
          >
            {saveLabel || 'Guardar'}
          </button>
        )}
      </div>
    </header>
  );
}
