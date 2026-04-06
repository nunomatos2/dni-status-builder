export type PillarId = 'INOVAR' | 'TRANSFORMAR' | 'VENDER' | 'NUTRIR' | 'EQUIPA';

export interface Pillar {
  id: PillarId;
  emoji: string;
  label: string;
}

export interface Contributor {
  id: string;
  session_id: string;
  name: string;
  pillar: PillarId;
  content: string;
  concerns: string;
  approvals: string;
  updated_at: string;
}

export interface Session {
  id: string;
  name: string;
  date: string;
  created_at: string;
  summary?: string;
}

export const PILLARS: Pillar[] = [
  { id: 'INOVAR',      emoji: '🔬', label: 'Inovar' },
  { id: 'TRANSFORMAR',  emoji: '⚙️', label: 'Transformar' },
  { id: 'VENDER',       emoji: '💰', label: 'Vender' },
  { id: 'NUTRIR',       emoji: '🌐', label: 'Nutrir' },
  { id: 'EQUIPA',       emoji: '👥', label: 'Equipa e Analítica' },
];

export interface Feedback {
  id: string;
  message: string;
  context_view: string;
  context_session_id?: string;
  context_session_name?: string;
  context_pillar?: string;
  context_contributor?: string;
  status: 'open' | 'implemented';
  created_at: string;
}

export function isSessionActive(session: Session): boolean {
  const sessionDate = new Date(session.date + 'T23:59:59');
  return sessionDate >= new Date();
}

export const COLLABORATORS = [
  { name: 'Nuno',        defaultPillar: 'INOVAR'      as PillarId },
  { name: 'Carlos',      defaultPillar: 'INOVAR'      as PillarId },
  { name: 'João Filipe', defaultPillar: 'TRANSFORMAR' as PillarId },
  { name: 'Volodymyr',   defaultPillar: 'TRANSFORMAR' as PillarId },
  { name: 'Miguel',      defaultPillar: 'VENDER'      as PillarId },
  { name: 'Graça',       defaultPillar: 'VENDER'      as PillarId },
  { name: 'Laura',       defaultPillar: 'NUTRIR'      as PillarId },
  { name: 'João Pedro',  defaultPillar: 'EQUIPA'      as PillarId },
];
