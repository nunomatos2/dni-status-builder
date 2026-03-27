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
}

export const PILLARS: Pillar[] = [
  { id: 'INOVAR',      emoji: '\u{1F52C}', label: 'Inovar' },
  { id: 'TRANSFORMAR',  emoji: '\u2699\uFE0F', label: 'Transformar' },
  { id: 'VENDER',       emoji: '\u{1F4B0}', label: 'Vender' },
  { id: 'NUTRIR',       emoji: '\u{1F310}', label: 'Nutrir' },
  { id: 'EQUIPA',       emoji: '\u{1F465}', label: 'Equipa' },
];

export const COLLABORATORS = [
  { name: 'Nuno',        defaultPillar: 'INOVAR'      as PillarId },
  { name: 'Carlos',      defaultPillar: 'INOVAR'      as PillarId },
  { name: 'Jo\u00e3o Filipe', defaultPillar: 'TRANSFORMAR' as PillarId },
  { name: 'Volodymyr',   defaultPillar: 'TRANSFORMAR' as PillarId },
  { name: 'Miguel',      defaultPillar: 'VENDER'      as PillarId },
  { name: 'Gra\u00e7a',       defaultPillar: 'VENDER'      as PillarId },
  { name: 'Laura',       defaultPillar: 'NUTRIR'      as PillarId },
  { name: 'Jo\u00e3o Pedro',  defaultPillar: 'EQUIPA'      as PillarId },
];
