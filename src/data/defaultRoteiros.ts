export interface RoteiroDidatico {
  id: string;
  segmento: 'ANOS INICIAIS' | 'ANOS FINAIS';
  modulo: string;
  titulo: string;
  subtitulo: string;
  anoSugerido: string;
  categoria?: string;
  duracao: string;
  nivel: 'Iniciante' | 'Intermediário' | 'Avançado';
  bncc: string[];
  objetivos: string[];
  materiais: string[];
  etapas: {
    aquecimento: string;
    desenvolvimento: string;
    maoNaMassa: string;
    desafio: string;
    avaliacao: string;
  };
  linkMaterial?: string;
  autor?: string;
  createdAt?: string;
}

export const MODULOS_ANOS_INICIAIS = [
  'Scratch Jr',
  'WeDo',
  'Spike Essential',
] as const;

export const MODULOS_ANOS_FINAIS = [
  'Scratch',
  'EV3',
  'Spike Prime',
  'Python',
  'Arduino / Maker',
] as const;

export const TODOS_MODULOS = [
  ...MODULOS_ANOS_INICIAIS,
  ...MODULOS_ANOS_FINAIS,
] as const;

export const DEFAULT_ROTEIROS: RoteiroDidatico[] = [];
