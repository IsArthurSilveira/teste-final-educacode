export interface FotoGaleria {
  id: string;
  url: string;
  titulo: string;
  legenda: string;
  descricao: string;
  autor: string;
  cargoAutor?: string;
  escola?: string;
  utec?: string;
  clubeNome?: string;
  modulo?: string;
  dataEnvio: string;
  curtidas?: number;
  consentimentoConfirmado: boolean;
}

export const DEFAULT_FOTOS_GALERIA: FotoGaleria[] = [
  {
    id: 'foto-1',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    titulo: 'Protótipo de Braço Robótico Articulado',
    legenda: 'Montagem mecânica com engrenagens e controle de servomotores',
    descricao: 'Atividade prática de robótica maker onde a equipe construiu um braço mecânico de 3 eixos para transporte de peças leves. Foram trabalhados conceitos de alavancas, torque e programação em blocos.',
    autor: 'Prof. Carlos Eduardo',
    cargoAutor: 'Educador Maker',
    escola: 'Escola Municipal Santos Dumont',
    utec: 'UTEC Santo Amaro',
    clubeNome: 'Clube de Robótica Santos Dumont',
    modulo: 'Spike Prime',
    dataEnvio: '2026-03-28T14:30:00.000Z',
    curtidas: 14,
    consentimentoConfirmado: true,
  },
  {
    id: 'foto-2',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    titulo: 'Circuito Teste de Sensor Ultrassônico',
    legenda: 'Calibração de medição de distância e parada automática',
    descricao: 'Desenvolvimento de circuito de segurança usando microcontrolador Arduino e sensor HC-SR04. A montagem em protoboard permitiu identificar limites de reflexão acústica.',
    autor: 'Ana Paula Rocha',
    cargoAutor: 'Instrutora de Robótica',
    escola: 'Escola Dom Bosco',
    utec: 'UTEC Boa Viagem',
    clubeNome: 'Clube Maker Dom Bosco',
    modulo: 'Arduino / Maker',
    dataEnvio: '2026-04-02T10:15:00.000Z',
    curtidas: 22,
    consentimentoConfirmado: true,
  },
  {
    id: 'foto-3',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    titulo: 'Animação Interativa de Histórias',
    legenda: 'Criação de jogo de perguntas sobre sustentabilidade',
    descricao: 'Alunos desenvolveram um quiz com pontuação e efeitos sonoros utilizando lógica computacional de variáveis e operadores condicionais no Scratch.',
    autor: 'Mariana Lima',
    cargoAutor: 'Estagiária CETEC',
    escola: 'Escola Paulo Freire',
    utec: 'UTEC Casa Amarela',
    clubeNome: 'Clube Futuro Maker',
    modulo: 'Scratch',
    dataEnvio: '2026-04-05T16:40:00.000Z',
    curtidas: 19,
    consentimentoConfirmado: true,
  },
  {
    id: 'foto-4',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    titulo: 'Montagem de Veículo Autônomo com EV3',
    legenda: 'Desafio de pista com desvio inteligente de obstáculos',
    descricao: 'Testes de calibração do sensor giroscópio e sensor de cor para cumprimento da rota demarcada no tapete de desafios da Olimpíada de Robótica.',
    autor: 'Prof. Roberto Silva',
    cargoAutor: 'Professor de Ciências',
    escola: 'Escola Tiradentes',
    utec: 'UTEC Cordeiro',
    clubeNome: 'Clube Tech Tiradentes',
    modulo: 'EV3',
    dataEnvio: '2026-04-08T11:20:00.000Z',
    curtidas: 31,
    consentimentoConfirmado: true,
  },
  {
    id: 'foto-5',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
    titulo: 'Mecanismo de Carrossel Motorizado WeDo',
    legenda: 'Construção com polias e correias de transmissão',
    descricao: 'Atividade introdutória para turmas de Anos Iniciais, explorando velocidade, transmissão de movimento por correias e sincronismo de motores com LEGO Education WeDo 2.0.',
    autor: 'Juliana Mendes',
    cargoAutor: 'Educadora Infantil Maker',
    escola: 'Escola Cecília Meireles',
    utec: 'UTEC Santo Amaro',
    clubeNome: 'Pequenos Inventores',
    modulo: 'Wedo',
    dataEnvio: '2026-04-10T09:00:00.000Z',
    curtidas: 27,
    consentimentoConfirmado: true,
  },
  {
    id: 'foto-6',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    titulo: 'Script em Python para Leitura de Sensores',
    legenda: 'Integração de código textual com telemetria em tempo real',
    descricao: 'Primeira experiência prática da turma de 9º ano com linguagem Python, gerando gráficos de temperatura e luminosidade coletados em sala de aula.',
    autor: 'Arthur Silveira',
    cargoAutor: 'Administrador CETEC',
    escola: 'Escola Gilberto Freyre',
    utec: 'UTEC Boa Viagem',
    clubeNome: 'Clube Python & Robótica',
    modulo: 'Python',
    dataEnvio: '2026-04-12T15:10:00.000Z',
    curtidas: 35,
    consentimentoConfirmado: true,
  },
];

const GALERIA_STORAGE_KEY = 'painel_galeria_fotos_v2';

export function getStoredGaleriaFotos(): FotoGaleria[] {
  try {
    const raw = localStorage.getItem(GALERIA_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GALERIA_STORAGE_KEY, JSON.stringify(DEFAULT_FOTOS_GALERIA));
      return DEFAULT_FOTOS_GALERIA;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FOTOS_GALERIA;
  } catch (err) {
    console.error('Erro ao carregar fotos da galeria:', err);
    return DEFAULT_FOTOS_GALERIA;
  }
}

export function saveFotoGaleria(novaFoto: FotoGaleria): FotoGaleria[] {
  try {
    const existing = getStoredGaleriaFotos();
    const index = existing.findIndex((f) => f.id === novaFoto.id);
    let updated: FotoGaleria[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = novaFoto;
    } else {
      updated = [novaFoto, ...existing];
    }
    localStorage.setItem(GALERIA_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao salvar foto na galeria:', err);
    return getStoredGaleriaFotos();
  }
}

export function deleteFotoGaleria(id: string): FotoGaleria[] {
  try {
    const existing = getStoredGaleriaFotos();
    const updated = existing.filter((f) => f.id !== id);
    localStorage.setItem(GALERIA_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao excluir foto da galeria:', err);
    return getStoredGaleriaFotos();
  }
}

export function toggleCurtidaFoto(id: string): FotoGaleria[] {
  try {
    const existing = getStoredGaleriaFotos();
    const updated = existing.map((f) => {
      if (f.id === id) {
        return { ...f, curtidas: (f.curtidas || 0) + 1 };
      }
      return f;
    });
    localStorage.setItem(GALERIA_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao curtir foto na galeria:', err);
    return getStoredGaleriaFotos();
  }
}
