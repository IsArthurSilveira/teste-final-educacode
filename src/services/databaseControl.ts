import { supabase, testSupabaseConnection } from './supabase';
import { clearStoredClubesCompeticao } from '../data/defaultClubesCompeticao';
import type { ClubeCompeticao } from '../data/defaultClubesCompeticao';
import { getStoredProjetosFicFecom, clearStoredProjetosFicFecom } from '../data/defaultProjetosFicFecom';
import type { ProjetoFicFecom } from '../data/defaultProjetosFicFecom';

function normalizeCompetitionStatus(value: unknown): ClubeCompeticao['status'] {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (normalized.includes('conclu') || normalized === 'feito') return 'concluido';
  if (normalized.includes('andamento')) return 'em_andamento';
  return 'pendente';
}

function normalizeCompetitionMeetingStatus(value: unknown): 'pendente' | 'concluido' {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  return normalized.includes('conclu') || normalized === 'feito' ? 'concluido' : 'pendente';
}

export interface DatabaseSummaryStats {
  totalClubes: number;
  totalAlunos: number;
  totalEncontros: number;
  totalClubesCompeticao: number;
  totalCompetidores: number;
  totalProjetosFicFecom: number;
  totalIntegrantesProjetos: number;
  totalRoteiros: number;
  totalUsuarios: number;
  totalRegistrosGeral: number;
  loading: boolean;
  error?: string;
}

export interface FullDatabaseDump {
  clubes: any[];
  alunos: any[];
  encontros: any[];
  clubesCompeticao: ClubeCompeticao[];
  projetosFicFecom: ProjetoFicFecom[];
  roteiros: any[];
  usuarios: any[];
  timestamp: string;
}

/**
 * Busca todos os dados reais persistidos nas tabelas do Supabase e nas coleções do sistema
 */
export async function fetchFullDatabaseDump(): Promise<FullDatabaseDump> {
  // 1. Clubes
  let clubes: any[] = [];
  try {
    const { data } = await supabase.from('clubes').select('*').order('nome', { ascending: true });
    if (data) clubes = data;
  } catch (err) {
    console.warn('Erro ao carregar clubes no dump:', err);
  }

  // 2. Alunos
  let alunos: any[] = [];
  try {
    const { data } = await supabase.from('alunos').select('*').order('nome', { ascending: true });
    if (data) alunos = data;
  } catch (err) {
    console.warn('Erro ao carregar alunos no dump:', err);
  }

  // 3. Encontros
  let encontros: any[] = [];
  try {
    const { data } = await supabase.from('encontros').select('*').order('data', { ascending: true });
    if (data) encontros = data;
  } catch (err) {
    console.warn('Erro ao carregar encontros no dump:', err);
  }

  // 4. Usuários (sem expor senhas)
  let usuarios: any[] = [];
  try {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome, email, acesso, tipo_usuario, utec, ver_todas_utecs, created_at')
      .order('nome', { ascending: true });
    if (data) usuarios = data;
  } catch (err) {
    console.warn('Erro ao carregar usuarios no dump:', err);
  }

  // 5. Roteiros Didáticos
  let roteiros: any[] = [];
  try {
    const { data } = await supabase.from('roteiros_didaticos').select('*');
    if (data) {
      roteiros = data;
    }
  } catch (err) {
    console.warn('Erro ao carregar roteiros no dump:', err);
  }

  // 6. Clubes de Competição
  let clubesCompeticao: ClubeCompeticao[] = [];
  try {
    const { data: clubesComp } = await supabase
      .from('clubes_competicao')
      .select('*, utec:utecs(nome)')
      .order('nome', { ascending: true });

    if (clubesComp) {
      clubesCompeticao = await Promise.all(clubesComp.map(async (clube: any) => {
        const { data: competidores } = await supabase
          .from('competidores')
          .select('*')
          .eq('id_clube_competicao', clube.id);
        const { data: encontros } = await supabase
          .from('encontros_competicao')
          .select('*')
          .eq('id_clube_competicao', clube.id);

        return {
          id: String(clube.id),
          nome: String(clube.nome || ''),
          escola: String(clube.escola || ''),
          utec: String(clube.utec?.nome || clube.utec || ''),
          competicao: String(clube.competicao || 'Geral'),
          nivel: String(clube.nivel || 'Nível 1 (Anos Iniciais)'),
          prof: String(clube.prof || 'Não informado'),
          tecnico: String(clube.tecnico || 'Não informado'),
          dias: String(clube.dias || 'A definir'),
          horario: String(clube.horario || 'A definir'),
          status: normalizeCompetitionStatus(clube.status),
          alunosList: (competidores || []).map((aluno: any) => ({
            id: String(aluno.id),
            matricula: String(aluno.matricula || 'S/ MATRÍCULA'),
            nome: String(aluno.nome || ''),
            genero: aluno.genero === 'F' ? 'F' : 'M',
            tamanhoCamisa: String(aluno.tamanho_camisa || 'M'),
            dataRegistro: String(aluno.data_registro || ''),
          })),
          encontrosList: (encontros || []).map((encontro: any) => ({
            id: String(encontro.id),
            data: String(encontro.data || ''),
            assunto: String(encontro.assunto || ''),
            detalhamento: String(encontro.detalhamento || ''),
            quantidadeAlunos: String(encontro.quantidade_alunos || '0'),
            status: normalizeCompetitionMeetingStatus(encontro.status),
          })),
        } as ClubeCompeticao;
      }));
    }
  } catch (err) {
    console.warn('Erro ao carregar clubes de competição no dump:', err);
  }

  // 7. Projetos FIC & FECOM (armazenados)
  const projetosFicFecom = getStoredProjetosFicFecom();

  return {
    clubes,
    alunos,
    encontros,
    clubesCompeticao,
    projetosFicFecom,
    roteiros,
    usuarios,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calcula os totais e estatísticas de contagem do banco de dados
 */
export async function getDatabaseSummaryStats(): Promise<DatabaseSummaryStats> {
  try {
    const dump = await fetchFullDatabaseDump();

    const totalCompetidores = dump.clubesCompeticao.reduce(
      (acc, c) => acc + (c.alunosList?.length || 0),
      0
    );
    const totalIntegrantesProjetos = dump.projetosFicFecom.reduce(
      (acc, p) => acc + (p.integrantesList?.length || 0),
      0
    );

    const totalRegistrosGeral =
      dump.clubes.length +
      dump.alunos.length +
      dump.encontros.length +
      dump.clubesCompeticao.length +
      totalCompetidores +
      dump.projetosFicFecom.length +
      totalIntegrantesProjetos +
      dump.roteiros.length +
      dump.usuarios.length;

    return {
      totalClubes: dump.clubes.length,
      totalAlunos: dump.alunos.length,
      totalEncontros: dump.encontros.length,
      totalClubesCompeticao: dump.clubesCompeticao.length,
      totalCompetidores,
      totalProjetosFicFecom: dump.projetosFicFecom.length,
      totalIntegrantesProjetos,
      totalRoteiros: dump.roteiros.length,
      totalUsuarios: dump.usuarios.length,
      totalRegistrosGeral,
      loading: false,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao obter estatísticas';
    return {
      totalClubes: 0,
      totalAlunos: 0,
      totalEncontros: 0,
      totalClubesCompeticao: 0,
      totalCompetidores: 0,
      totalProjetosFicFecom: 0,
      totalIntegrantesProjetos: 0,
      totalRoteiros: 0,
      totalUsuarios: 0,
      totalRegistrosGeral: 0,
      loading: false,
      error: errorMsg,
    };
  }
}

/**
 * Exporta uma cópia integral de todos os dados do banco para um arquivo Excel (.xlsx) com múltiplas abas
 * Não inclui imagens ou arquivos pesados, somente dados limpos e tabulares.
 */
export async function exportDatabaseToExcel(customFilename?: string): Promise<{ success: boolean; filename: string }> {
  const { utils, writeFile } = await import('xlsx');
  const dump = await fetchFullDatabaseDump();

  const wb = utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `CETEC_Backup_Consolidado_${dateStr}.xlsx`;

  // Mapear clube por ID para associar nomes nas abas de alunos e encontros
  const clubeMap = new Map<string, any>();
  dump.clubes.forEach((c) => {
    clubeMap.set(String(c.id), c);
  });

  // 1. Aba: Clubes Regulares
  const clubesRows = dump.clubes.map((c) => ({
    'ID': c.id,
    'UTEC': c.nome_utec || c.utec || '',
    'ESCOLA': c.escola || '',
    'NOME DO CLUBE': c.nome || '',
    'CATEGORIA': c.categoria || '',
    'STATUS': c.status || '',
    'PROFESSOR': c.prof || '',
    'ESTAGIÁRIO / TÉCNICO': c.estag || '',
    'DIAS DE AULA': c.dias || '',
    'HORÁRIO': c.horario || '',
    'CRIADO EM': c.created_at || '',
  }));
  const wsClubes = utils.json_to_sheet(clubesRows);
  utils.book_append_sheet(wb, wsClubes, 'Clubes_Regulares');

  // 2. Aba: Alunos dos Clubes
  const alunosRows = dump.alunos.map((a) => {
    const c = clubeMap.get(String(a.id_clube)) || {};
    return {
      'ID ALUNO': a.id,
      'UTEC': c.nome_utec || c.utec || '',
      'ESCOLA': c.escola || '',
      'CLUBE': c.nome || 'Não associado',
      'NOME DO ALUNO': a.nome || '',
      'MATRÍCULA': a.matricula || '',
      'GÊNERO': a.sexo || a.genero || 'M',
      'TAMANHO DE CAMISA': a.tamanho_camisa || a.tamanhoCamisa || 'M',
      'DATA DE REGISTRO': a.data_registro || a.created_at || '',
    };
  });
  const wsAlunos = utils.json_to_sheet(alunosRows);
  utils.book_append_sheet(wb, wsAlunos, 'Alunos_Clubes');

  // 3. Aba: Encontros dos Clubes
  const encontrosRows = dump.encontros.map((e) => {
    const c = clubeMap.get(String(e.id_clube)) || {};
    return {
      'ID ENCONTRO': e.id,
      'UTEC': c.nome_utec || c.utec || '',
      'ESCOLA': c.escola || '',
      'CLUBE': c.nome || '',
      'DATA': e.data || '',
      'MÓDULO': e.modulo || '',
      'ASSUNTO': e.assunto || '',
      'STATUS': e.status || '',
      'QTD ALUNOS PRESENTES': Number(e.quantidade_alunos || 0),
      'DETALHAMENTO': e.detalhamento || '',
    };
  });
  const wsEncontros = utils.json_to_sheet(encontrosRows);
  utils.book_append_sheet(wb, wsEncontros, 'Encontros_Presencas');

  // 4. Aba: Clubes de Competição
  const compClubesRows = dump.clubesCompeticao.map((c) => ({
    'ID': c.id,
    'UTEC': c.utec || '',
    'ESCOLA': c.escola || '',
    'NOME DA EQUIPE': c.nome || '',
    'TORNEIO': c.competicao || '',
    'NÍVEL': c.nivel || 'Nível 1 (Anos Iniciais)',
    'STATUS': c.status || '',
    'PROFESSOR': c.prof || '',
    'TÉCNICO / ESTAGIÁRIO': c.estag || '',
    'DIAS': c.dias || '',
    'HORÁRIO': c.horario || '',
    'TOTAL COMPETIDORES': c.alunosList?.length || 0,
    'TOTAL TREINOS': c.encontrosList?.length || 0,
  }));
  const wsCompClubes = utils.json_to_sheet(compClubesRows);
  utils.book_append_sheet(wb, wsCompClubes, 'Clubes_Competicao');

  // 5. Aba: Competidores das Equipes
  const competidoresRows: any[] = [];
  dump.clubesCompeticao.forEach((c) => {
    (c.alunosList || []).forEach((a) => {
      competidoresRows.push({
        'ID ALUNO': a.id,
        'EQUIPE': c.nome,
        'TORNEIO': c.competicao,
        'NÍVEL': c.nivel || 'Nível 1 (Anos Iniciais)',
        'ESCOLA': c.escola,
        'UTEC': c.utec,
        'NOME DO ALUNO': a.nome,
        'MATRÍCULA': a.matricula || '',
        'GÊNERO': a.genero === 'F' ? 'Feminino' : 'Masculino',
        'TAMANHO DE CAMISA': a.tamanhoCamisa || 'M',
        'TURMA': a.turma || '',
        'DATA REGISTRO': a.dataRegistro || '',
      });
    });
  });
  const wsCompetidores = utils.json_to_sheet(competidoresRows);
  utils.book_append_sheet(wb, wsCompetidores, 'Competidores_Equipes');

  // 6. Aba: Projetos FIC & FECOM
  const projetosRows = dump.projetosFicFecom.map((p) => ({
    'ID': p.id,
    'TÍTULO DO PROJETO': p.titulo,
    'MODALIDADE': p.modalidade,
    'ESCOLA': p.escola,
    'UTEC': p.utec,
    'STATUS': p.status,
    'DISPOSITIVOS / RECURSOS': (p.recursosRobotica || []).join(', '),
    'JUSTIFICATIVA / TEMÁTICA': p.justificativaTematica || p.justificativa || '',
    'PROCESSO DE CONSTRUÇÃO': p.processoConstrucao || '',
    'PENSAR BRINCANDO': p.pensarBrincando || '',
    'P DE PROPÓSITO': p.propositoColetivo || p.pDeProposito || '',
    'CONTEÚDOS ESCOLARES': p.conteudosEscolares || '',
    'COMPETÊNCIAS BNCC': p.competenciasBncc || '',
    'HABILIDADES BNCC': p.habilidadesBncc || '',
    'TOTAL REPRESENTANTES': p.integrantesList?.length || 0,
    'DATA CRIAÇÃO': p.dataCadastro || p.dataCriacao || '',
  }));
  const wsProjetos = utils.json_to_sheet(projetosRows);
  utils.book_append_sheet(wb, wsProjetos, 'Projetos_FIC_FECOM');

  // 7. Aba: Integrantes dos Projetos
  const integrantesRows: any[] = [];
  dump.projetosFicFecom.forEach((p) => {
    (p.integrantesList || []).forEach((m) => {
      integrantesRows.push({
        'PROJETO': p.titulo,
        'MODALIDADE': p.modalidade,
        'ESCOLA': p.escola,
        'UTEC': p.utec,
        'NOME DO INTEGRANTE': m.nome,
        'MATRÍCULA': m.matricula || '',
        'ANO / SÉRIE ESCOLAR': m.anoEscolar,
        'GÊNERO': m.genero === 'F' ? 'Feminino' : 'Masculino',
        'TAMANHO DE CAMISA': m.tamanhoCamisa || 'M',
      });
    });
  });
  const wsIntegrantes = utils.json_to_sheet(integrantesRows);
  utils.book_append_sheet(wb, wsIntegrantes, 'Integrantes_Projetos');

  // 8. Aba: Roteiros Didáticos
  const roteirosRows = dump.roteiros.map((r) => ({
    'ID': r.id,
    'TÍTULO': r.titulo || '',
    'ETAPA': r.etapa || '',
    'MÓDULO': r.modulo || '',
    'ENCONTRO': r.numero_encontro || r.encontro || '',
    'OBJETIVO': r.objetivo || '',
    'FERRAMENTAS': Array.isArray(r.ferramentas) ? r.ferramentas.join(', ') : r.ferramentas || '',
  }));
  const wsRoteiros = utils.json_to_sheet(roteirosRows);
  utils.book_append_sheet(wb, wsRoteiros, 'Roteiros_Didaticos');

  // 9. Aba: Usuários do Sistema
  const usuariosRows = dump.usuarios.map((u) => ({
    'ID': u.id,
    'NOME': u.nome,
    'EMAIL': u.email,
    'PERFIL DE ACESSO': u.acesso,
    'TIPO': u.tipo_usuario,
    'UTEC': u.utec || '',
    'VER TODAS UTECS': u.ver_todas_utecs ? 'SIM' : 'NÃO',
    'CRIADO EM': u.created_at || '',
  }));
  const wsUsuarios = utils.json_to_sheet(usuariosRows);
  utils.book_append_sheet(wb, wsUsuarios, 'Usuarios_Sistema');

  writeFile(wb, filename);
  return { success: true, filename };
}

/**
 * Converte um array de objetos em CSV com delimitador ';' e BOM UTF-8 (compatível com Excel)
 */
export function convertToCsv(data: Record<string, any>[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(';');
  const dataLines = data.map((row) => headers.map((h) => escapeCell(row[h])).join(';'));

  // \uFEFF força o Excel a reconhecer UTF-8
  return '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
}

/**
 * Faz download de um arquivo CSV diretamente no navegador
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gera download de todas as tabelas em CSVs individuais
 */
export async function downloadAllTablesAsCsv(): Promise<void> {
  const dump = await fetchFullDatabaseDump();
  const dateStr = new Date().toISOString().split('T')[0];

  // 1. Clubes
  const clubesData = dump.clubes.map((c) => ({
    ID: c.id,
    UTEC: c.nome_utec || c.utec,
    ESCOLA: c.escola,
    NOME: c.nome,
    CATEGORIA: c.categoria,
    STATUS: c.status,
    PROF: c.prof,
    ESTAGIARIO: c.estag,
    DIAS: c.dias,
    HORARIO: c.horario,
  }));
  downloadCsvFile(convertToCsv(clubesData), `CETEC_Clubes_${dateStr}.csv`);

  // 2. Alunos
  const alunosData = dump.alunos.map((a) => ({
    ID: a.id,
    ID_CLUBE: a.id_clube,
    NOME: a.nome,
    MATRICULA: a.matricula,
    GENERO: a.sexo || a.genero || 'M',
    TAMANHO_CAMISA: a.tamanho_camisa || a.tamanhoCamisa || 'M',
    DATA_REGISTRO: a.data_registro,
  }));
  downloadCsvFile(convertToCsv(alunosData), `CETEC_Alunos_${dateStr}.csv`);

  // 3. Competição
  const compData = dump.clubesCompeticao.map((c) => ({
    ID: c.id,
    UTEC: c.utec,
    ESCOLA: c.escola,
    EQUIPE: c.nome,
    TORNEIO: c.competicao,
    NIVEL: c.nivel,
    STATUS: c.status,
    PROF: c.prof,
    TECNICO_ESTAGIARIO: c.estag,
  }));
  downloadCsvFile(convertToCsv(compData), `CETEC_Clubes_Competicao_${dateStr}.csv`);

  // 4. Competidores das Equipes
  const compAlunosData: any[] = [];
  dump.clubesCompeticao.forEach((c) => {
    (c.alunosList || []).forEach((a) => {
      compAlunosData.push({
        EQUIPE: c.nome,
        TORNEIO: c.competicao,
        ESCOLA: c.escola,
        UTEC: c.utec,
        NOME_ALUNO: a.nome,
        MATRICULA: a.matricula || '',
        GENERO: a.genero === 'F' ? 'F' : 'M',
        TAMANHO_CAMISA: a.tamanhoCamisa || 'M',
        TURMA: a.turma || '',
      });
    });
  });
  downloadCsvFile(convertToCsv(compAlunosData), `CETEC_Competidores_Equipes_${dateStr}.csv`);

  // 5. Projetos FIC / FECOM
  const ficData = dump.projetosFicFecom.map((p) => ({
    ID: p.id,
    TITULO: p.titulo,
    MODALIDADE: p.modalidade,
    ESCOLA: p.escola,
    UTEC: p.utec,
    STATUS: p.status,
    JUSTIFICATIVA: p.justificativaTematica || p.justificativa || '',
    PROCESSO: p.processoConstrucao || '',
    PENSAR_BRINCANDO: p.pensarBrincando || '',
    PROPOSITO: p.propositoColetivo || p.pDeProposito || '',
    CONTEUDOS_ESCOLARES: p.conteudosEscolares || '',
    COMPETENCIAS_BNCC: p.competenciasBncc || '',
    HABILIDADES_BNCC: p.habilidadesBncc || '',
  }));
  downloadCsvFile(convertToCsv(ficData), `CETEC_Projetos_FIC_FECOM_${dateStr}.csv`);

  // 6. Integrantes dos Projetos
  const ficAlunosData: any[] = [];
  dump.projetosFicFecom.forEach((p) => {
    (p.integrantesList || []).forEach((m) => {
      ficAlunosData.push({
        PROJETO: p.titulo,
        MODALIDADE: p.modalidade,
        ESCOLA: p.escola,
        UTEC: p.utec,
        NOME_INTEGRANTE: m.nome,
        MATRICULA: m.matricula || '',
        ANO_ESCOLAR: m.anoEscolar,
        GENERO: m.genero === 'F' ? 'F' : 'M',
        TAMANHO_CAMISA: m.tamanhoCamisa || 'M',
      });
    });
  });
  downloadCsvFile(convertToCsv(ficAlunosData), `CETEC_Integrantes_Projetos_${dateStr}.csv`);
}

/**
 * Executa o reset anual controlado:
 * - Garante a criação de um backup de emergência em localStorage
 * - Limpa as coleções anuais (Clubes de competição, Projetos FIC/FECOM, dados locais)
 */
export async function executeAnnualReset(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Snapshot de emergência antes de limpar
    const dump = await fetchFullDatabaseDump();
    localStorage.setItem('CETEC_EMERGENCY_RESTORE_BACKUP', JSON.stringify(dump));

    // 2. Limpar dados anuais que recomeçam do zero
    clearStoredClubesCompeticao();
    clearStoredProjetosFicFecom();

    return {
      success: true,
      message: 'Ciclo anual resetado com sucesso! Backup de segurança salvo.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Falha ao executar reset';
    return {
      success: false,
      message: `Erro ao resetar: ${errorMsg}`,
    };
  }
}
