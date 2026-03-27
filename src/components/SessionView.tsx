import { useState, useEffect } from 'react';
import { getContributors, upsertContributor, deleteContributor } from '../lib/supabase';
import { PILLARS, COLLABORATORS } from '../types/dni';
import type { Session, Contributor, PillarId } from '../types/dni';
import Modal from './Modal';

interface SessionViewProps {
  session: Session;
  onSelectContributor: (contributor: Contributor) => void;
  onGenerateSummary: () => void;
  contributors: Contributor[];
  setContributors: (c: Contributor[]) => void;
}

export default function SessionView({ session, onSelectContributor, onGenerateSummary, contributors, setContributors }: SessionViewProps) {
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<PillarId | ''>('');
  const [adding, setAdding] = useState(false);

  const loadContributors = async () => {
    setLoading(true);
    try {
      const data = await getContributors(session.id);
      setContributors(data);
    } catch (err) {
      console.error('Erro ao carregar contribuintes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContributors(); }, [session.id]);

  const addedNames = new Set(contributors.map(c => c.name));
  const availableCollabs = COLLABORATORS.filter(c => !addedNames.has(c.name));

  const handleSelectCollab = (name: string) => {
    setSelectedCollab(name);
    const collab = COLLABORATORS.find(c => c.name === name);
    if (collab) setSelectedPillar(collab.defaultPillar);
  };

  const handleAdd = async () => {
    if (!selectedCollab || !selectedPillar) return;
    setAdding(true);
    try {
      const newContrib = await upsertContributor({
        session_id: session.id,
        name: selectedCollab,
        pillar: selectedPillar,
        content: '',
        concerns: '',
        approvals: '',
      });
      setContributors([...contributors, newContrib]);
      setShowAddModal(false);
      setSelectedCollab(null);
      setSelectedPillar('');
    } catch (err) {
      console.error('Erro ao adicionar contribuinte:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remover este contribuinte?')) return;
    try {
      await deleteContributor(id);
      setContributors(contributors.filter(c => c.id !== id));
    } catch (err) {
      console.error('Erro ao remover contribuinte:', err);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

  const getStatusPills = (c: Contributor) => {
    const pills: { label: string; color: string; filled: boolean }[] = [
      {
        label: c.content ? '✓ Progresso' : '○ Progresso',
        color: c.content ? 'bg-emerald/10 text-emerald' : 'bg-zinc-100 text-zinc-400',
        filled: !!c.content,
      },
      {
        label: c.concerns ? '⚠ Preocupações' : '',
        color: 'bg-amber/10 text-amber',
        filled: !!c.concerns,
      },
      {
        label: c.approvals ? '✓ Pedidos' : '',
        color: 'bg-blue/10 text-blue',
        filled: !!c.approvals,
      },
    ];
    return pills.filter(p => p.label);
  };

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
    <div className="px-6 md:px-12 py-10 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-10 text-[11px] font-bold uppercase tracking-widest text-secondary/60">
        <span>Sessões</span>
        <span className="material-symbols-outlined text-sm opacity-40">chevron_right</span>
        <span className="text-on-surface">{session.name}</span>
      </div>

      {/* Header */}
      <header className="max-w-4xl mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{session.name}</h1>
        <p className="text-secondary text-sm">{formatDate(session.date)}</p>
      </header>

      {/* Pillars grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
        {PILLARS.map(pillar => {
          const pillarContribs = contributors.filter(c => c.pillar === pillar.id);
          return (
            <div key={pillar.id}>
              {/* Pillar header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-primary-container rounded-sm" />
                  <span className="text-[12px] font-black uppercase tracking-wider text-on-surface">
                    {pillar.id}
                  </span>
                </div>
                <button
                  onClick={() => { setShowAddModal(true); }}
                  className="text-[11px] font-bold uppercase tracking-widest text-primary hover:underline underline-offset-4"
                >
                  + Adicionar
                </button>
              </div>

              {/* Contributors */}
              <div className="space-y-3">
                {pillarContribs.length === 0 ? (
                  <div className="bg-surface-lowest p-6 text-center" style={{ borderLeft: '4px solid #b5000b' }}>
                    <p className="text-[11px] text-zinc-400 uppercase tracking-widest">Sem contribuições</p>
                  </div>
                ) : (
                  pillarContribs.map(contrib => (
                    <div
                      key={contrib.id}
                      onClick={() => onSelectContributor(contrib)}
                      className="group bg-surface-lowest p-5 cursor-pointer transition-all hover:translate-x-0.5"
                      style={{ borderLeft: '4px solid #b5000b' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block">Responsável</span>
                          <p className="text-base font-bold tracking-tight">{contrib.name}</p>
                        </div>
                        <div className="flex gap-1.5 flex-wrap justify-end">
                          {getStatusPills(contrib).map((pill, i) => (
                            <span key={i} className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${pill.color}`}>
                              {pill.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      {contrib.content && (
                        <p className="text-sm text-secondary leading-relaxed line-clamp-2 mt-2">
                          {contrib.content.substring(0, 120)}{contrib.content.length > 120 ? '...' : ''}
                        </p>
                      )}
                      <button
                        onClick={(e) => handleRemove(contrib.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-error hover:bg-error/5 px-1 py-0.5"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Remover
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      {contributors.length > 0 && (
        <div className="mt-14 pt-6 border-t border-zinc-200 flex items-center justify-between">
          <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
            {contributors.length} contribuinte{contributors.length !== 1 ? 's' : ''} registados
          </div>
          <button
            onClick={onGenerateSummary}
            className="bg-linear-to-r from-primary-container to-primary text-on-primary px-6 py-3 text-[12px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            Gerar Resumo IA
          </button>
        </div>
      )}

      {/* Add contributor modal */}
      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setSelectedCollab(null); setSelectedPillar(''); }} title="Adicionar Contribuinte">
        <div className="space-y-5">
          {availableCollabs.length === 0 ? (
            <p className="text-secondary text-sm text-center py-4">Todos os colaboradores já foram adicionados.</p>
          ) : (
            <>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-3">
                  Selecionar Colaborador
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableCollabs.map(collab => (
                    <button
                      key={collab.name}
                      onClick={() => handleSelectCollab(collab.name)}
                      className={`p-3 text-left text-sm font-medium transition-all rounded-sm ${
                        selectedCollab === collab.name
                          ? 'bg-primary-container/10 border-l-4 border-primary text-on-surface'
                          : 'bg-surface-low hover:bg-surface-container text-secondary'
                      }`}
                    >
                      <span className="block font-bold">{collab.name}</span>
                      <span className="text-[9px] uppercase tracking-widest text-secondary">
                        {PILLARS.find(p => p.id === collab.defaultPillar)?.emoji} {collab.defaultPillar}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedCollab && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                    Pilar
                  </label>
                  <select
                    value={selectedPillar}
                    onChange={e => setSelectedPillar(e.target.value as PillarId)}
                    className="w-full bg-transparent border-b-2 border-outline-variant/30 focus:border-primary px-1 py-2 text-sm outline-none transition-colors"
                  >
                    {PILLARS.map(p => (
                      <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={!selectedCollab || !selectedPillar || adding}
                className="w-full bg-linear-to-r from-primary-container to-primary text-on-primary py-3 text-[12px] font-bold uppercase tracking-widest rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {adding ? 'A adicionar...' : 'Adicionar'}
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
