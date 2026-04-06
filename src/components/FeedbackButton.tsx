import { useState } from 'react';
import { submitFeedback } from '../lib/supabase';
import type { Session, Contributor } from '../types/dni';
import Modal from './Modal';

interface FeedbackContext {
  view: string;
  session?: Session | null;
  contributor?: Contributor | null;
}

interface FeedbackButtonProps {
  context: FeedbackContext;
}

export default function FeedbackButton({ context }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const contextLabel = () => {
    const parts: string[] = [];
    if (context.view === 'home') parts.push('Dashboard');
    if (context.view === 'session' && context.session) parts.push(`Sessão: ${context.session.name}`);
    if (context.view === 'editor' && context.contributor) {
      parts.push(`Editor: ${context.contributor.name} / ${context.contributor.pillar}`);
    }
    if (context.view === 'summary' && context.session) parts.push(`Resumo: ${context.session.name}`);
    if (context.view === 'feedback') parts.push('Painel de Feedback');
    return parts.join(' — ') || context.view;
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await submitFeedback({
        message: message.trim(),
        context_view: context.view,
        context_session_id: context.session?.id,
        context_session_name: context.session?.name,
        context_pillar: context.contributor?.pillar,
        context_contributor: context.contributor?.name,
      });
      setSent(true);
      setMessage('');
      setTimeout(() => { setSent(false); setOpen(false); }, 1500);
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-linear-to-r from-primary-container to-primary text-on-primary shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
        title="Enviar feedback"
      >
        <span className="material-symbols-outlined text-xl">feedback</span>
      </button>

      <Modal open={open} onClose={() => { setOpen(false); setSent(false); }} title="Enviar Feedback">
        <div className="space-y-5">
          <div className="bg-surface-low px-3 py-2 rounded-sm">
            <span className="text-[9px] font-bold uppercase tracking-widest text-secondary block mb-0.5">Contexto</span>
            <span className="text-xs text-on-surface">{contextLabel()}</span>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-4xl text-emerald mb-2 block">check_circle</span>
              <p className="text-sm font-bold text-emerald">Feedback enviado. Obrigado!</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                  A sua sugestão ou comentário
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  placeholder="O que gostaria de melhorar neste ecrã ou na aplicação em geral?"
                  autoFocus
                  className="w-full bg-transparent border-b-2 border-outline-variant/30 focus:border-primary px-1 py-2 text-sm outline-none transition-colors placeholder:text-zinc-300 resize-none"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="w-full bg-linear-to-r from-primary-container to-primary text-on-primary py-3 text-[12px] font-bold uppercase tracking-widest rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {sending ? 'A enviar...' : 'Enviar Feedback'}
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
