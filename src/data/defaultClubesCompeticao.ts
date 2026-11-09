export interface AlunoCompeticao {
  id: string;
  matricula: string;
  nome: string;
  genero: 'M' | 'F';
  dataRegistro: string;
}

export interface EncontroCompeticao {
  id: string;
  data: string;
  assunto: string;
  detalhamento: string;
  quantidadeAlunos: string;
  status: 'pendente' | 'concluido';
}

export interface ClubeCompeticao {
  id: string;
  nome: string;
  escola: string;
  utec: string;
  competicao: 'FLL' | 'OBR' | 'RECLINE' | 'Geral';
  nivel: 'Nível 1 (Anos Iniciais)' | 'Nível 2 (Anos Finais)';
  prof: string;
  tecnico: string;
  dias: string;
  horario: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  alunosList: AlunoCompeticao[];
  encontrosList: EncontroCompeticao[];
}

export const DEFAULT_CLUBES_COMPETICAO: ClubeCompeticao[] = [
  {
    id: 'comp-1',
    nome: 'CyberDragons - Equipe FLL',
    escola: 'Escola Municipal Santos Dumont',
    utec: 'UTEC Santo Amaro',
    competicao: 'FLL',
    nivel: 'Nível 2 (Anos Finais)',
    prof: 'Carlos Eduardo Santos',
    tecnico: 'Lucas Gabriel (Estagiário)',
    dias: 'Terças e Quintas',
    horario: '14:00 às 17:00',
    status: 'em_andamento',
    alunosList: [
      { id: 'al-1', matricula: '2026011', nome: 'Arthur Silveira de Souza', genero: 'M', dataRegistro: '10/02/2026' },
      { id: 'al-2', matricula: '2026012', nome: 'Beatriz Vasconcelos', genero: 'F', dataRegistro: '10/02/2026' },
      { id: 'al-3', matricula: '2026013', nome: 'Caio Felipe Mendes', genero: 'M', dataRegistro: '11/02/2026' },
      { id: 'al-4', matricula: '2026014', nome: 'Daniela Lima Ferreira', genero: 'F', dataRegistro: '11/02/2026' },
      { id: 'al-5', matricula: '2026015', nome: 'Eduardo Albuquerque Neto', genero: 'M', dataRegistro: '12/02/2026' },
      { id: 'al-6', matricula: '2026016', nome: 'Fernanda Caroline Silva', genero: 'F', dataRegistro: '12/02/2026' },
    ],
    encontrosList: [
      { id: 'enc-1', data: '2026-03-03', assunto: 'Análise do Tapete de Missões FLL', detalhamento: 'Estudo do regulamento da temporada e pontuação de cada missão.', quantidadeAlunos: '6', status: 'concluido' },
      { id: 'enc-2', data: '2026-03-05', assunto: 'Construção da Base Motriz do Robô', detalhamento: 'Montagem mecânica com servomotores angulares e tração traseira.', quantidadeAlunos: '6', status: 'concluido' },
      { id: 'enc-3', data: '2026-03-10', assunto: 'Programação de Alinhamento e Sensores', detalhamento: 'Calibração dos sensores de cor e giroscópio para percurso reto.', quantidadeAlunos: '5', status: 'concluido' },
      { id: 'enc-4', data: '2026-03-12', assunto: 'Projeto de Inovação: Brainstorming', detalhamento: 'Definição da problemática ambiental e proposta de protótipo.', quantidadeAlunos: '6', status: 'em_andamento' },
      { id: 'enc-5', data: '2026-03-17', assunto: 'Simulação Oficial de Mesa e Cronômetro', detalhamento: 'Execução de rounds de 2m30s com contagem de faltas e bônus.', quantidadeAlunos: '6', status: 'pendente' },
    ],
  },
  {
    id: 'comp-2',
    nome: 'RobôTigres Resgate - OBR',
    escola: 'Escola Dom Bosco',
    utec: 'UTEC Boa Viagem',
    competicao: 'OBR',
    nivel: 'Nível 2 (Anos Finais)',
    prof: 'Mariana Lima de Albuquerque',
    tecnico: 'Beatriz Martins (Estagiária)',
    dias: 'Segundas e Quartas',
    horario: '13:30 às 16:30',
    status: 'em_andamento',
    alunosList: [
      { id: 'al-7', matricula: '2026021', nome: 'Gabriel Henrique Santos', genero: 'M', dataRegistro: '15/02/2026' },
      { id: 'al-8', matricula: '2026022', nome: 'Helena Ribeiro Costa', genero: 'F', dataRegistro: '15/02/2026' },
      { id: 'al-9', matricula: '2026023', nome: 'Igor Matheus Pinheiro', genero: 'M', dataRegistro: '16/02/2026' },
      { id: 'al-10', matricula: '2026024', nome: 'Júlia Nogueira Brandão', genero: 'F', dataRegistro: '16/02/2026' },
    ],
    encontrosList: [
      { id: 'enc-6', data: '2026-03-02', assunto: 'Regras da OBR Nível 1 e 2', detalhamento: 'Estudo do manual de resgate, áreas de perigo e regras da rampa.', quantidadeAlunos: '4', status: 'concluido' },
      { id: 'enc-7', data: '2026-03-04', assunto: 'Montagem do Sensor de Linha e Cruzamentos', detalhamento: 'Ajuste de matriz óptica para identificação de verde nas intersecções.', quantidadeAlunos: '4', status: 'concluido' },
      { id: 'enc-8', data: '2026-03-09', assunto: 'Transposição de Obstáculos e Gap', detalhamento: 'Lógica PID para contorno autônomo sem tocar em fitas pretas.', quantidadeAlunos: '4', status: 'concluido' },
      { id: 'enc-9', data: '2026-03-11', assunto: 'Área de Resgate e Resgate de Vítimas', detalhamento: 'Garra com servomotor para captura de esferas prateadas e pretas.', quantidadeAlunos: '4', status: 'pendente' },
    ],
  },
  {
    id: 'comp-3',
    nome: 'RecLine Speed - Seguidor de Linha',
    escola: 'Escola Paulo Freire',
    utec: 'UTEC Casa Amarela',
    competicao: 'RECLINE',
    nivel: 'Nível 2 (Anos Finais)',
    prof: 'Roberto Guimarães da Silva',
    tecnico: 'Danilo Silva (Estagiário)',
    dias: 'Sextas-feiras',
    horario: '13:00 às 17:00',
    status: 'em_andamento',
    alunosList: [
      { id: 'al-11', matricula: '2026031', nome: 'Larissa Manoela Pontes', genero: 'F', dataRegistro: '01/03/2026' },
      { id: 'al-12', matricula: '2026032', nome: 'Marcos Vinícius Dantas', genero: 'M', dataRegistro: '01/03/2026' },
      { id: 'al-13', matricula: '2026033', nome: 'Natália Cristina Farias', genero: 'F', dataRegistro: '02/03/2026' },
      { id: 'al-14', matricula: '2026034', nome: 'Otávio Augusto Rocha', genero: 'M', dataRegistro: '02/03/2026' },
      { id: 'al-15', matricula: '2026035', nome: 'Poliana Regina Barbosa', genero: 'F', dataRegistro: '03/03/2026' },
    ],
    encontrosList: [
      { id: 'enc-10', data: '2026-03-06', assunto: 'Regulamento RECLINE e Circuito Oficial', detalhamento: 'Largura da pista, curvas fechadas de 90 graus e zona de largada.', quantidadeAlunos: '5', status: 'concluido' },
      { id: 'enc-11', data: '2026-03-13', assunto: 'Controle Proporcional e Integral (PI)', detalhamento: 'Ajuste fino de KP e KI para estabilização em alta velocidade.', quantidadeAlunos: '5', status: 'concluido' },
      { id: 'enc-12', data: '2026-03-20', assunto: 'Bateria LiPo e Relação de Peso', detalhamento: 'Distribuição de massa e redução de centro de gravidade do chassi.', quantidadeAlunos: '5', status: 'pendente' },
    ],
  },
  {
    id: 'comp-4',
    nome: 'TurboLine Recife - RECLINE Pro',
    escola: 'Escola Tiradentes',
    utec: 'UTEC Cordeiro',
    competicao: 'RECLINE',
    nivel: 'Nível 2 (Anos Finais)',
    prof: 'Juliana Mendes de Castro',
    tecnico: 'Felipe Costa (Estagiário)',
    dias: 'Quartas e Sextas',
    horario: '14:00 às 17:00',
    status: 'em_andamento',
    alunosList: [
      { id: 'al-16', matricula: '2026041', nome: 'Rafael Barreto Gomes', genero: 'M', dataRegistro: '05/03/2026' },
      { id: 'al-17', matricula: '2026042', nome: 'Sofia Vasconcelos Ramos', genero: 'F', dataRegistro: '05/03/2026' },
      { id: 'al-18', matricula: '2026043', nome: 'Tiago Emanuel Pereira', genero: 'M', dataRegistro: '06/03/2026' },
      { id: 'al-19', matricula: '2026044', nome: 'Vitória Emanuele Santos', genero: 'F', dataRegistro: '06/03/2026' },
    ],
    encontrosList: [
      { id: 'enc-13', data: '2026-03-04', assunto: 'Projeto Eletrônico e Placa do Sensor', detalhamento: 'Soldagem e verificação da barra de 8 sensores infravermelhos.', quantidadeAlunos: '4', status: 'concluido' },
      { id: 'enc-14', data: '2026-03-11', assunto: 'Testes de Tomada de Tempo em Pista', detalhamento: 'Cronometragem de voltas completas e curvas de velocidade.', quantidadeAlunos: '4', status: 'concluido' },
      { id: 'enc-15', data: '2026-03-18', assunto: 'Otimização de Grip e Pneus de Silicone', detalhamento: 'Melhoria na aderência para não derrapar nas curvas de raio curto.', quantidadeAlunos: '4', status: 'pendente' },
    ],
  },
  {
    id: 'comp-5',
    nome: 'Pequenos Cientistas OBR Kids',
    escola: 'Escola Cecília Meireles',
    utec: 'UTEC Santo Amaro',
    competicao: 'OBR',
    nivel: 'Nível 1 (Anos Iniciais)',
    prof: 'Patrícia Nogueira Lopes',
    tecnico: 'Camila Ferreira (Estagiária)',
    dias: 'Terças-feiras',
    horario: '08:30 às 11:30',
    status: 'pendente',
    alunosList: [
      { id: 'al-20', matricula: '2026051', nome: 'Alice Maria Carvalho', genero: 'F', dataRegistro: '10/03/2026' },
      { id: 'al-21', matricula: '2026052', nome: 'Bernardo Souza Matos', genero: 'M', dataRegistro: '10/03/2026' },
      { id: 'al-22', matricula: '2026053', nome: 'Clara Beatriz Medeiros', genero: 'F', dataRegistro: '10/03/2026' },
      { id: 'al-23', matricula: '2026054', nome: 'Davi Lucca Brandão', genero: 'M', dataRegistro: '10/03/2026' },
    ],
    encontrosList: [
      { id: 'enc-16', data: '2026-03-10', assunto: 'Fundamentos de Robótica e Motores', detalhamento: 'Exploração de engrenagens e redução de velocidade com LEGO WeDo.', quantidadeAlunos: '4', status: 'concluido' },
      { id: 'enc-17', data: '2026-03-17', assunto: 'Sensor de Distância e Parada no Obstáculo', detalhamento: 'Programação de detecção de barreira e desvio simples.', quantidadeAlunos: '4', status: 'pendente' },
    ],
  },
  {
    id: 'comp-6',
    nome: 'AlphaBot FLL Challenge',
    escola: 'Escola Gilberto Freyre',
    utec: 'UTEC Boa Viagem',
    competicao: 'FLL',
    nivel: 'Nível 2 (Anos Finais)',
    prof: 'Rodrigo Antunes de Melo',
    tecnico: 'Ana Paula Rocha (Estagiária)',
    dias: 'Quintas-feiras',
    horario: '13:30 às 17:30',
    status: 'concluido',
    alunosList: [
      { id: 'al-24', matricula: '2026061', nome: 'Elias Gabriel Monteiro', genero: 'M', dataRegistro: '01/02/2026' },
      { id: 'al-25', matricula: '2026062', nome: 'Flávia Alessandra Silva', genero: 'F', dataRegistro: '01/02/2026' },
      { id: 'al-26', matricula: '2026063', nome: 'Guilherme Augusto Lima', genero: 'M', dataRegistro: '01/02/2026' },
      { id: 'al-27', matricula: '2026064', nome: 'Isabela Maria Fernandes', genero: 'F', dataRegistro: '01/02/2026' },
    ],
    encontrosList: [
      { id: 'enc-18', data: '2026-02-12', assunto: 'Lançamento e Organização da Equipe', detalhamento: 'Definição de papéis: construtores, programadores e comunicadores.', quantidadeAlunos: '4', status: 'concluido' },
      { id: 'enc-19', data: '2026-02-19', assunto: 'Construção do Acessório de Garra Ativa', detalhamento: 'Acessório motorizado rápido para encaixe em peças modulares.', quantidadeAlunos: '4', status: 'concluido' },
      { id: 'enc-20', data: '2026-02-26', assunto: 'Validação Final dos Core Values e Mesa', detalhamento: 'Apresentação interna do projeto de inovação e treino de pitch.', quantidadeAlunos: '4', status: 'concluido' },
    ],
  },
];

const STORAGE_KEY = 'painel_clubes_competicao_v3';

export function getStoredClubesCompeticao(): ClubeCompeticao[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLUBES_COMPETICAO));
      return DEFAULT_CLUBES_COMPETICAO;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLUBES_COMPETICAO));
      return DEFAULT_CLUBES_COMPETICAO;
    }
    return parsed;
  } catch {
    return DEFAULT_CLUBES_COMPETICAO;
  }
}

export function saveClubeCompeticao(clube: ClubeCompeticao): ClubeCompeticao[] {
  const current = getStoredClubesCompeticao();
  const existsIndex = current.findIndex((c) => c.id === clube.id);
  let updated: ClubeCompeticao[];
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = clube;
  } else {
    updated = [clube, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
  return updated;
}

export function deleteClubeCompeticao(id: string): ClubeCompeticao[] {
  const current = getStoredClubesCompeticao();
  const updated = current.filter((c) => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
  return updated;
}

export function clearStoredClubesCompeticao(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error(e);
  }
}

