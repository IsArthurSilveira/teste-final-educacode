export interface IntegranteProjeto {
  id: string;
  nome: string;
  matricula?: string;
  anoEscolar: string;
  genero?: 'M' | 'F';
  tamanhoCamisa?: string;
}

export type ModalidadeProjeto = 'FIC' | 'FECOM';
export type RecursoRobotica = 'Humanóide NAO' | 'EV3' | 'WeDo' | 'Arduino/maker' | 'outro';

export interface ProjetoFicFecom {
  id: string;
  titulo: string;
  modalidade: ModalidadeProjeto;
  escola: string;
  utec: string;
  idUtec?: string;
  professor?: string;
  estagiario?: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  dataCadastro: string;
  integrantesList: IntegranteProjeto[];
  justificativaTematica: string;
  processoConstrucao: string;
  pensarBrincando: string;
  linguagensUsadas: string[];
  propositoColetivo: string;
  recursosRobotica: string[];
  recursosOutroDescricao?: string;
  conteudosEscolares: string;
  competenciasBncc: string;
  habilidadesBncc: string;
}

export const DEFAULT_PROJETOS_FIC_FECOM: ProjetoFicFecom[] = [];
const STORAGE_KEY = 'educacode_projetos_fic_fecom_v2';
const LEGACY_STORAGE_KEY = 'educacode_projetos_fic_fecom_v1';

export function getStoredProjetosFicFecom(): ProjetoFicFecom[] {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao carregar projetos FIC/FECOM:', err);
    return [];
  }
}

export function saveProjetoFicFecom(projeto: ProjetoFicFecom): ProjetoFicFecom[] {
  try {
    const current = getStoredProjetosFicFecom();
    const index = current.findIndex((item) => item.id === projeto.id);
    const updated = index >= 0
      ? current.map((item, itemIndex) => (itemIndex === index ? projeto : item))
      : [projeto, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao salvar projeto FIC/FECOM:', err);
    return getStoredProjetosFicFecom();
  }
}

export function deleteProjetoFicFecom(id: string): ProjetoFicFecom[] {
  try {
    const updated = getStoredProjetosFicFecom().filter((projeto) => projeto.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao remover projeto FIC/FECOM:', err);
    return getStoredProjetosFicFecom();
  }
}

export function clearStoredProjetosFicFecom(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Erro ao limpar projetos FIC/FECOM:', err);
  }
}
