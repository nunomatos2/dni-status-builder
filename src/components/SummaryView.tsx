import { useState, useEffect, useCallback } from 'react';
import { getContributors, updateSessionSummary } from '../lib/supabase';
import { generateSummary } from '../lib/ai';
import type { Session } from '../types/dni';

interface SummaryViewProps {
  session: Session;
  onSessionUpdated: (s: Session) => void;
}

export default function SummaryView({ session, onSessionUpdated }: SummaryViewProps) {
  const [summary, setSummary] = useState(session.summary ?? '');
  const [loading, setLoading] = useState(!session.summary);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(session.summary ?? '');
  const [saving, setSaving] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError('');
    setSummary('');
    setEditing(false);
    try {
      const freshContributors = await getContributors(session.id);
      const { text, updatedSession } = await generateSummary(session, freshContributors);
      setSummary(text);
      setEditValue(text);
      onSessionUpdated(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar resumo');
    } finally {
      setLoading(false);
    }
  }, [session, onSessionUpdated]);

  useEffect(() => {
    if (!session.summary) generate();
  }, []);

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const updatedSession = await updateSessionSummary(session.id, editValue);
      setSummary(editValue);
      onSessionUpdated(updatedSession);
      setEditing(false);
    } catch (err) {
      console.error('Erro ao guardar resumo:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditValue(summary);
    setEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = summary;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-10 text-[11px] font-bold uppercase tracking-widest text-secondary/60">
        <span>Sessões</span>
        <span className="material-symbols-outlined text-sm opacity-40">chevron_right</span>
        <span>{session.name}</span>
        <span className="material-symbols-outlined text-sm opacity-40">chevron_right</span>
        <span className="text-on-surface">Resumo</span>
      </div>

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Resumo Executivo</h1>
        <p className="text-secondary text-sm">{session.name} — {formatDate(session.date)}</p>
      </header>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-3 py-8">
          <div className="dot-pulse flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
          </div>
          <span className="text-sm text-secondary italic">A gerar síntese executiva...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-surface-lowest p-8 border-t-[3px] border-error">
          <p className="text-error text-sm font-medium mb-4">{error}</p>
          <button
            onClick={generate}
            className="text-[11px] font-bold uppercase tracking-widest text-primary hover:underline underline-offset-4"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Summary */}
      {summary && !loading && (
        <>
          <div className="bg-surface-lowest border-t-[3px] border-primary-container">
            {editing ? (
              <textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-full bg-transparent border-none p-8 md:p-10 text-sm font-sans leading-relaxed resize-none focus:ring-0 focus:outline-none text-on-surface"
                rows={Math.max(20, editValue.split('\n').length + 2)}
                autoFocus
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-on-surface p-8 md:p-10">
                {summary}
              </pre>
            )}
          </div>

          {/* Actions */}
          {editing ? (
            <div className="flex items-center gap-4 mt-8 flex-wrap">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-6 py-3 text-[12px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 transition-all active:scale-95 bg-linear-to-r from-primary-container to-primary text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">save</span>
                {saving ? 'A guardar...' : 'Guardar alterações'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-secondary hover:text-on-surface border border-zinc-200 rounded-sm flex items-center gap-2 transition-all hover:bg-surface-low"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-8 flex-wrap">
              <button
                onClick={handleCopy}
                className={`px-6 py-3 text-[12px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 transition-all active:scale-95 ${
                  copied
                    ? 'bg-emerald text-white'
                    : 'bg-linear-to-r from-primary-container to-primary text-on-primary hover:opacity-90'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'Copiado!' : 'Copiar para Outlook'}
              </button>

              <button
                onClick={() => { setEditing(true); setEditValue(summary); }}
                className="px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-secondary hover:text-on-surface border border-zinc-200 rounded-sm flex items-center gap-2 transition-all hover:bg-surface-low"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Editar
              </button>

              <button
                onClick={generate}
                className="px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-secondary hover:text-on-surface border border-zinc-200 rounded-sm flex items-center gap-2 transition-all hover:bg-surface-low"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Regenerar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
