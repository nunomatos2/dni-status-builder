import { useState, useEffect, useRef, useCallback } from 'react';
import { upsertContributor, deleteContributor, getPreviousContribution } from '../lib/supabase';
import { PILLARS } from '../types/dni';
import type { Contributor } from '../types/dni';
import RichEditor from './RichEditor';

interface EditorViewProps {
  contributor: Contributor;
  readOnly?: boolean;
  onRemoved: () => void;
  onUpdated: (c: Contributor) => void;
}

export default function EditorView({ contributor, readOnly, onRemoved, onUpdated }: EditorViewProps) {
  const [content, setContent] = useState(contributor.content || '');
  const [concerns, setConcerns] = useState(contributor.concerns || '');
  const [approvals, setApprovals] = useState(contributor.approvals || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'loading' | 'done' | 'empty'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pillar = PILLARS.find(p => p.id === contributor.pillar);

  const save = useCallback(async (c: string, co: string, ap: string) => {
    setSaveStatus('saving');
    try {
      const updated = await upsertContributor({
        id: contributor.id,
        session_id: contributor.session_id,
        name: contributor.name,
        pillar: contributor.pillar,
        content: c,
        concerns: co,
        approvals: ap,
      });
      onUpdated(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (err) {
      console.error('Erro ao guardar:', err);
      setSaveStatus('idle');
    }
  }, [contributor.id, contributor.session_id, contributor.name, contributor.pillar, onUpdated]);

  const scheduleAutoSave = useCallback((c: string, co: string, ap: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(c, co, ap), 1500);
  }, [save]);

  const contentRef = useRef(content);
  const concernsRef = useRef(concerns);
  const approvalsRef = useRef(approvals);
  contentRef.current = content;
  concernsRef.current = concerns;
  approvalsRef.current = approvals;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        save(contentRef.current, concernsRef.current, approvalsRef.current);
      }
    };
  }, [save]);

  const handleContentChange = (val: string) => { setContent(val); scheduleAutoSave(val, concerns, approvals); };
  const handleConcernsChange = (val: string) => { setConcerns(val); scheduleAutoSave(content, val, approvals); };
  const handleApprovalsChange = (val: string) => { setApprovals(val); scheduleAutoSave(content, concerns, val); };

  const handleCopyPrevious = async () => {
    setCopyStatus('loading');
    try {
      const prev = await getPreviousContribution(contributor.name, contributor.pillar, contributor.session_id);
      if (!prev || (!prev.content && !prev.concerns && !prev.approvals)) {
        setCopyStatus('empty');
        setTimeout(() => setCopyStatus('idle'), 2500);
        return;
      }
      setContent(prev.content);
      setConcerns(prev.concerns);
      setApprovals(prev.approvals);
      scheduleAutoSave(prev.content, prev.concerns, prev.approvals);
      setCopyStatus('done');
      setTimeout(() => setCopyStatus('idle'), 2500);
    } catch (err) {
      console.error('Erro ao copiar contributo anterior:', err);
      setCopyStatus('idle');
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remover o contributo de ${contributor.name}? Esta ação não pode ser revertida.`)) return;
    try {
      await deleteContributor(contributor.id);
      onRemoved();
    } catch (err) {
      console.error('Erro ao remover contribuinte:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-10">
      {/* Header */}
      <header className="mb-14">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-surface-container text-zinc-500 px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm">
            Status Report
          </span>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
            {pillar?.label}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
          {pillar?.emoji} {pillar?.id} — Contributo de {contributor.name}
        </h1>
        {readOnly ? (
          <p className="mt-4 text-zinc-400 text-sm italic">Sessão fechada — modo de leitura.</p>
        ) : (
          <button
            onClick={handleCopyPrevious}
            disabled={copyStatus === 'loading'}
            className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary hover:text-primary-container transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-base">content_copy</span>
            {copyStatus === 'idle' && 'Copiar último preenchimento'}
            {copyStatus === 'loading' && 'A procurar...'}
            {copyStatus === 'done' && 'Copiado ✓'}
            {copyStatus === 'empty' && 'Sem preenchimento anterior'}
          </button>
        )}
      </header>

      <div className="space-y-14">
        {/* Progress */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <label className="text-[12px] font-bold uppercase tracking-wider text-on-surface-variant">
              Progresso & Conquistas
            </label>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">campo principal</span>
          </div>
          <RichEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Descreva as principais vitórias do período..."
            readOnly={readOnly}
            borderColor="#b5000b"
          />
          <p className="mt-3 text-[11px] text-zinc-400 italic font-medium px-1">
            Dica: foque-se em resultados tangíveis e métricas de impacto.
          </p>
        </section>

        {/* Concerns */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <label className="text-[12px] font-bold uppercase tracking-wider text-on-surface-variant">
              ⚠️ Preocupações
            </label>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">bloqueios & riscos</span>
          </div>
          <RichEditor
            content={concerns}
            onChange={handleConcernsChange}
            placeholder="O que está a impedir o progresso?"
            readOnly={readOnly}
            borderColor="#f59e0b"
          />
          <p className="mt-3 text-[11px] text-zinc-400 italic font-medium px-1">opcional</p>
        </section>

        {/* Approvals */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <label className="text-[12px] font-bold uppercase tracking-wider text-on-surface-variant">
              ✓ Pedidos de Aprovação
            </label>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">next steps</span>
          </div>
          <RichEditor
            content={approvals}
            onChange={handleApprovalsChange}
            placeholder="Que decisões precisam de ser tomadas pela direção?"
            readOnly={readOnly}
            borderColor="#3b82f6"
          />
          <p className="mt-3 text-[11px] text-zinc-400 italic font-medium px-1">opcional</p>
        </section>

        {/* Footer */}
        {!readOnly && (
          <div className="pt-14 border-t border-zinc-100 flex justify-between items-center">
            <button onClick={handleRemove} className="group flex items-center gap-2 text-zinc-400 hover:text-error transition-colors">
              <span className="material-symbols-outlined text-sm">person_remove</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Remover Contribuinte</span>
            </button>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
                {saveStatus === 'saving' && 'A guardar...'}
                {saveStatus === 'saved' && 'Guardado ✓'}
                {saveStatus === 'idle' && 'Auto-save ativo'}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                saveStatus === 'saving' ? 'bg-amber' : saveStatus === 'saved' ? 'bg-emerald' : 'bg-emerald'
              }`} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
