import { useState, useEffect } from 'react';
import { getSessions, createSession, deleteSession, getContributors } from '../lib/supabase';
import { PILLARS, isSessionActive } from '../types/dni';
import type { Session } from '../types/dni';
import Modal from './Modal';

interface HomeViewProps {
  onSelectSession: (session: Session) => void;
  showModal: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
}

export default function HomeView({ onSelectSession, showModal, onCloseModal, onOpenModal }: HomeViewProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [contributorCounts, setContributorCounts] = useState<Record<string, { count: number; pillars: string[] }>>({});
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
      const counts: Record<string, { count: number; pillars: string[] }> = {};
      const contribResults = await Promise.all(
        data.map(s => getContributors(s.id))
      );
      data.forEach((s, i) => {
        const contribs = contribResults[i];
        const uniquePillars = [...new Set(contribs.map(c => c.pillar))];
        counts[s.id] = { count: contribs.length, pillars: uniquePillars };
      });
      setContributorCounts(counts);
    } catch (err) {
      console.error('Erro ao carregar sessões:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newDate) return;
    setCreating(true);
    setError(null);
    try {
      const session = await createSession(newName.trim(), newDate);
      onCloseModal();
      setNewName('');
      setNewDate('');
      setError(null);
      onSelectSession(session);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Não foi possível criar a sessão: ${message}`);
      console.error('Erro ao criar sessão:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem a certeza que deseja eliminar esta sessão? Todos os contributos serão perdidos.')) return;
    try {
      await deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Erro ao eliminar sessão:', err);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="dot-pulse flex gap-2">
          <span className="w-3 h-3 rounded-full bg-primary-container" />
          <span className="w-3 h-3 rounded-full bg-primary-container" />
          <span className="w-3 h-3 rounded-full bg-primary-container" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-10 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-10 text-[11px] font-bold uppercase tracking-widest text-secondary/60">
        <span>DNI Status</span>
        <span className="material-symbols-outlined text-sm opacity-40">chevron_right</span>
        <span className="text-on-surface">Dashboard de Sessões</span>
      </div>

      {/* Header */}
      <header className="max-w-4xl mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Sessões Recentes</h1>
        <p className="text-secondary text-sm leading-relaxed max-w-xl">
          Gerencie as atualizações de status quinzenais da Direção Digital. Compile contributos, valide pilares e publique relatórios executivos.
        </p>
      </header>

      {sessions.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-surface-low rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-3xl text-secondary">folder_open</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Nenhuma sessão iniciada</h2>
          <p className="text-secondary text-sm mb-8 max-w-sm">
            Comece a construir o status da DNI criando a sua primeira sessão quinzenal.
          </p>
          <button
            onClick={onOpenModal}
            className="bg-linear-to-r from-primary-container to-primary text-on-primary px-8 py-3 text-[12px] font-bold uppercase tracking-widest flex items-center gap-2 rounded-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Criar Primeira Sessão
          </button>
        </div>
      ) : (
        /* Cards grid */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {sessions.map(session => {
            const info = contributorCounts[session.id];
            const active = isSessionActive(session);
            return (
              <article
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="group relative bg-surface-lowest p-6 cursor-pointer transition-all hover:translate-x-0.5"
                style={{ borderLeft: `4px solid ${active ? '#b5000b' : '#d4d4d8'}` }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-[0.1em] block">
                        Sessão
                      </span>
                      {active ? (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-emerald/10 text-emerald">
                          Sessão ativa
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-400">
                          Sessão fechada
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">{session.name}</h3>
                    <p className="text-secondary text-sm">{formatDate(session.date)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                      Contribuintes
                    </span>
                    <span className="text-lg font-bold">
                      {info?.count ?? 0}
                      <span className="text-zinc-300 font-normal">/8</span>
                    </span>
                  </div>
                </div>

                {/* Pillar tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {(info?.pillars ?? []).map(pId => {
                    const pillar = PILLARS.find(p => p.id === pId);
                    return (
                      <span key={pId} className="text-[9px] font-black tracking-widest px-2 py-1 bg-surface-low text-secondary">
                        {pillar?.id ?? pId}
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    {active ? 'Continuar Builder' : 'Ver Sessão'}
                  </span>
                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-error hover:bg-error/5 px-2 py-1"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* New session modal */}
      <Modal open={showModal} onClose={() => { setError(null); onCloseModal(); }} title="Nova Sessão">
        <div className="space-y-5">
          {error && (
            <div className="bg-error/10 border-l-4 border-error px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
              Nome da Sessão
            </label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ex: Ponto de Situação Q2 — Maio"
              className="w-full bg-transparent border-b-2 border-outline-variant/30 focus:border-primary px-1 py-2 text-sm outline-none transition-colors placeholder:text-zinc-300"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
              Data
            </label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full bg-transparent border-b-2 border-outline-variant/30 focus:border-primary px-1 py-2 text-sm outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || !newDate || creating}
            className="w-full bg-linear-to-r from-primary-container to-primary text-on-primary py-3 text-[12px] font-bold uppercase tracking-widest rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {creating ? 'A criar...' : 'Criar Sessão'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
