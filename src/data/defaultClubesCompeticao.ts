export interface AlunoCompeticao {
  id: string;
  matricula: string;
  nome: string;
  genero: 'M' | 'F';
  tamanhoCamisa: string;
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

export const DEFAULT_CLUBES_COMPETICAO: ClubeCompeticao[] = [];

const STORAGE_KEY = 'educacode_clubes_competicao_v2';
const LEGACY_STORAGE_KEY = 'painel_clubes_competicao_v3';

export function getStoredClubesCompeticao(): ClubeCompeticao[] {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((clube) => ({
      ...clube,
      alunosList: (clube.alunosList || []).map((aluno: AlunoCompeticao) => ({
        ...aluno,
        tamanhoCamisa: aluno.tamanhoCamisa || 'M',
        genero: aluno.genero || 'M',
      })),
    }));
  } catch (err) {
    console.error('Erro ao carregar clubes de competição:', err);
    return [];
  }
}

export function saveClubeCompeticao(clube: ClubeCompeticao): ClubeCompeticao[] {
  const current = getStoredClubesCompeticao();
  const existsIndex = current.findIndex((item) => item.id === clube.id);
  const updated = existsIndex >= 0
    ? current.map((item, index) => (index === existsIndex ? clube : item))
    : [clube, ...current];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Erro ao salvar clube de competição:', err);
  }
  return updated;
}

export function deleteClubeCompeticao(id: string): ClubeCompeticao[] {
  const updated = getStoredClubesCompeticao().filter((clube) => clube.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Erro ao excluir clube de competição:', err);
  }
  return updated;
}

export function clearStoredClubesCompeticao(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Erro ao limpar clubes de competição:', err);
  }
}
