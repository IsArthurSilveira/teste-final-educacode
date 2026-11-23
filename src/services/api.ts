import { supabase } from './supabase';
import type { RoteiroDidatico } from '../data/defaultRoteiros';

export const TOKEN_STORAGE_KEY = 'painel_token_sessao';
export const AUTH_EXPIRED_EVENT = 'auth:expired';
export const ROTEIROS_CUSTOM_STORAGE_KEY = 'painel_roteiros_custom_v1';

function isAnyAdminAccess(value: unknown): boolean {
  const access = String(value || '').toLowerCase();
  return access === 'administrador' || access === 'superadmin' || access.includes('admin');
}

async function registrarAuditoria(acao: string, tabela: string, idRegistro: unknown, detalhes: Record<string, unknown> = {}): Promise<void> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const email = authData.user?.email?.toLowerCase() || '';
    const { data: usuario } = email
      ? await supabase.from('usuarios').select('id, nome').ilike('email', email).maybeSingle()
      : { data: null };
    await supabase.from('auditoria').insert({
      id_usuario: usuario?.id || null,
      usuario_nome: usuario?.nome || email || 'Usuário autenticado',
      acao,
      tabela,
      id_registro: idRegistro == null ? '' : String(idRegistro),
      detalhes,
    });
  } catch (error) {
    console.warn('Não foi possível registrar a auditoria:', error);
  }
}

export function getStoredCustomRoteiros(): RoteiroDidatico[] {
  try {
    const raw = localStorage.getItem(ROTEIROS_CUSTOM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomRoteiro(roteiro: RoteiroDidatico): void {
  try {
    const existing = getStoredCustomRoteiros();
    const index = existing.findIndex((r) => r.id === roteiro.id);
    if (index >= 0) {
      existing[index] = roteiro;
    } else {
      existing.unshift(roteiro);
    }
    localStorage.setItem(ROTEIROS_CUSTOM_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Erro ao salvar roteiro local:', err);
  }
}

export function deleteCustomRoteiro(id: string): void {
  try {
    const existing = getStoredCustomRoteiros();
    const filtered = existing.filter((r) => r.id !== id);
    localStorage.setItem(ROTEIROS_CUSTOM_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Erro ao excluir roteiro local:', err);
  }
}

type RecordValue = Record<string, unknown>;

function normalizeJsonList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const text = value.trim();
  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof parsed === 'string' && parsed.trim()) {
      return [parsed.trim()];
    }
  } catch {
    // Registros legados podem conter texto simples em colunas JSONB.
  }

  return text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function normalizeEtapas(value: unknown): RoteiroDidatico['etapas'] {
  const defaultEtapas: RoteiroDidatico['etapas'] = {
    aquecimento: '',
    desenvolvimento: '',
    maoNaMassa: '',
    desafio: '',
    avaliacao: '',
  };

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const etapas = value as Record<string, unknown>;
    return {
      aquecimento: String(etapas.aquecimento || ''),
      desenvolvimento: String(etapas.desenvolvimento || ''),
      maoNaMassa: String(etapas.maoNaMassa || etapas.mao_na_massa || ''),
      desafio: String(etapas.desafio || ''),
      avaliacao: String(etapas.avaliacao || ''),
    };
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      return normalizeEtapas(JSON.parse(value));
    } catch {
      return { ...defaultEtapas, desenvolvimento: value.trim() };
    }
  }

  return defaultEtapas;
}

export interface ApiRequestPayload extends RecordValue {
  acao?: string;
}

export interface ApiBaseResponse extends RecordValue {
  sucesso?: boolean;
  SUCESSO?: boolean;
  mensagem?: string;
  message?: string;
  erro?: string;
  codigo?: string;
}

export interface SessionValidationResponse extends ApiBaseResponse {
  sucesso: boolean;
  nome?: string;
  acesso?: string;
  tipo_usuario?: string;
  utec?: string;
  ver_todas_utecs?: boolean;
}

export class AuthError extends Error {
  constructor(message = 'Sessão expirada ou inválida.') {
    super(message);
    this.name = 'AuthError';
  }
}

export function getSessionToken(): string {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setSessionToken(token: string): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignora restrições locais de storage
  }
}

export function clearSessionToken(): void {
  setSessionToken('');
}

export async function validateSession(): Promise<SessionValidationResponse | null> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const email = authData.user?.email?.toLowerCase();
    if (!email) return null;

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, acesso, tipo_usuario, id_utec, ver_todas_utecs')
      .ilike('email', email)
      .maybeSingle();

    if (error || !user) {
      return null;
    }

    return {
      sucesso: true,
      nome: user.nome,
      acesso: user.acesso,
      tipo_usuario: user.tipo_usuario,
      utec: user.id_utec,
      ver_todas_utecs: user.ver_todas_utecs,
    };
  } catch {
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  await supabase.auth.signOut();
  clearSessionToken();
}

async function fetchAllRows(
  table: string,
  columns: string,
  orderColumn: string,
  filters?: Record<string, unknown>,
): Promise<any[]> {
  const pageSize = 1000;
  const rows: any[] = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from(table)
      .select(columns)
      .order(orderColumn, { ascending: true })
      .range(from, from + pageSize - 1);

    if (filters) {
      for (const [column, value] of Object.entries(filters)) {
        query = query.eq(column, value);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}

function normalizeCompetitionStatus(value: unknown): 'pendente' | 'em_andamento' | 'concluido' {
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

/**
 * Roteamento unificado das chamadas de leitura (GET) via Supabase
 */
export async function apiGet<TResponse = unknown>(params: ApiRequestPayload): Promise<TResponse> {
  const acao = String(params?.acao || '').toLowerCase();

  try {
    switch (acao) {
      case 'listar_clubes': {
        // Busca clubes e informações agregadas
        const clubes = await fetchAllRows(
          'clubes',
          '*, utec:utecs(nome), alunos(count), encontros(status)',
          'nome',
        );

        const mapped = (clubes || []).map((c: any) => {
          const alunosCount = Array.isArray(c.alunos) ? Number(c.alunos[0]?.count ?? 0) : 0;
          const encontrosFeitos = Array.isArray(c.encontros)
            ? c.encontros.filter((e: any) => {
                const st = String(e?.status || '').toUpperCase().trim();
                return st === 'CONCLUÍDO' || st === 'CONCLUIDO' || st === 'FEITO';
              }).length
            : 0;

          return {
            id: c.id,
            nome: String(c.nome || '').toUpperCase(),
            escola: String(c.escola || '').toUpperCase(),
            id_utec: c.id_utec,
            utec: String(c.id_utec || ''),
            nomeUtec: c.utec?.nome || '',
            prof: String(c.prof || '').toUpperCase(),
            estag: String(c.estag || '').toUpperCase(),
            dias: String(c.dias || '').toUpperCase(),
            horario: String(c.horario || '').toUpperCase(),
            categoria: String(c.categoria || 'CLUBES INICIAIS').toUpperCase(),
            status: String(c.status || 'PENDENTE').toUpperCase(),
            alunos: alunosCount,
            encontrosFeitos,
          };
        });

        return mapped as unknown as TResponse;
      }

      case 'listar_alunos': {
        const idClube = params?.id_clube || params?.idClube;
        const data = await fetchAllRows(
          'alunos',
          '*',
          'nome',
          idClube ? { id_clube: idClube } : undefined,
        );

        const mapped = (data || []).map((a: any) => ({
          id: a.id,
          id_clube: a.id_clube,
          idClube: a.id_clube,
          matricula: a.matricula,
          nome: String(a.nome || '').toUpperCase(),
          sexo: a.sexo || 'M',
          data_registro: a.data_registro,
          dataRegistro: a.data_registro,
        }));

        return mapped as unknown as TResponse;
      }

      case 'listar_alunos_detalhes': {
        const data = await fetchAllRows('alunos', '*', 'nome');

        const mapped = (data || []).map((a: any) => ({
          id: a.id,
          id_clube: a.id_clube,
          idClube: a.id_clube,
          matricula: a.matricula,
          nome: String(a.nome || '').toUpperCase(),
          sexo: a.sexo || 'M',
          data_registro: a.data_registro,
          dataRegistro: a.data_registro,
        }));

        return mapped as unknown as TResponse;
      }

      case 'listar_encontros': {
        const idClube = params?.id_clube || params?.idClube;
        const data = await fetchAllRows(
          'encontros',
          '*',
          'data',
          idClube ? { id_clube: idClube } : undefined,
        );

        const mapped = (data || []).map((e: any) => ({
          id: e.id,
          id_clube: e.id_clube,
          idClube: e.id_clube,
          modulo: String(e.modulo || '').toUpperCase(),
          assunto: String(e.assunto || '').toUpperCase(),
          detalhamento: e.detalhamento || '',
          data: e.data || '',
          status: String(e.status || 'A FAZER').toUpperCase(),
          frequencia: e.frequencia || '',
          quantidade_alunos: e.quantidade_alunos ?? 0,
          quantidadeAlunos: String(e.quantidade_alunos ?? 0),
        }));

        return mapped as unknown as TResponse;
      }

      case 'listar_usuarios': {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nome, email, acesso, tipo_usuario, id_utec, utec:utecs(nome), ver_todas_utecs, created_at')
          .order('nome', { ascending: true });

        if (error) {
          handleSupabaseError(error);
          return [] as unknown as TResponse;
        }

        const mapped = (data || []).map((u: any) => ({
          id: u.id,
          nome: u.nome,
          email: u.email,
          acesso: u.acesso,
          tipoUsuario: u.tipo_usuario,
          tipo_usuario: u.tipo_usuario,
          utec: u.utec?.nome || u.utec || u.id_utec || '',
          id_utec: u.id_utec,
          verTodasUtecs: u.ver_todas_utecs,
          ver_todas_utecs: u.ver_todas_utecs,
        }));

        return mapped as unknown as TResponse;
      }

      case 'listar_utecs': {
        const { data, error } = await supabase.from('utecs').select('id, nome').order('nome');
        if (error) throw error;
        return (data || []) as unknown as TResponse;
      }

      case 'listar_clubes_competicao': {
        let clubes: any[] = [];
        try {
          clubes = await fetchAllRows(
            'clubes_competicao',
            '*, utec:utecs(nome), competidores(*), encontros_competicao(*)',
            'nome',
          );
        } catch {
          clubes = await fetchAllRows('clubes_competicao', '*', 'nome');
        }

        return clubes.map((clube: any) => ({
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
          alunosList: (Array.isArray(clube.competidores) ? clube.competidores : []).map((aluno: any) => ({
            id: String(aluno.id),
            matricula: String(aluno.matricula || 'S/ MATRÍCULA'),
            nome: String(aluno.nome || ''),
            genero: aluno.genero === 'F' ? 'F' : 'M',
            tamanhoCamisa: String(aluno.tamanho_camisa || 'M'),
            dataRegistro: String(aluno.data_registro || ''),
          })),
          encontrosList: (Array.isArray(clube.encontros_competicao) ? clube.encontros_competicao : []).map((encontro: any) => ({
            id: String(encontro.id),
            data: String(encontro.data || ''),
            assunto: String(encontro.assunto || ''),
            detalhamento: String(encontro.detalhamento || ''),
            quantidadeAlunos: String(encontro.quantidade_alunos || '0'),
            status: normalizeCompetitionMeetingStatus(encontro.status),
          })),
        })) as unknown as TResponse;
      }

      case 'listar_auditoria': {
        const { data, error } = await supabase
          .from('auditoria')
          .select('id, id_usuario, usuario_nome, acao, tabela, id_registro, detalhes, created_at')
          .order('created_at', { ascending: false })
          .limit(500);
        if (error) throw error;
        return (data || []) as unknown as TResponse;
      }

      case 'listar_galeria': {
        const { data, error } = await supabase
          .from('galeria_fotos')
          .select('*, utec:utecs(nome)')
          .order('data_envio', { ascending: false });
        if (error) throw error;

        const mapped = (data || []).map((foto: any) => ({
          id: String(foto.id),
          url: foto.url,
          titulo: foto.titulo || '',
          legenda: foto.legenda || '',
          descricao: foto.descricao || '',
          autor: foto.autor || 'CETEC',
          cargoAutor: foto.cargo_autor || '',
          escola: foto.escola || '',
          id_utec: foto.id_utec ? String(foto.id_utec) : '',
          utec: foto.utec?.nome || foto.id_utec || '',
          clubeNome: foto.clube_nome || '',
          modulo: foto.modulo || '',
          dataEnvio: foto.data_envio || foto.created_at,
          curtidas: Number(foto.curtidas || 0),
          consentimentoConfirmado: Boolean(foto.consentimento_confirmado),
        }));
        return mapped as unknown as TResponse;
      }

      case 'listar_roteiros': {
        const { data, error } = await supabase
          .from('roteiros_didaticos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const mapped = (data || []).map((r: any) => ({
          id: String(r.id),
          segmento: String(r.segmento || 'ANOS INICIAIS').toUpperCase(),
          titulo: r.titulo,
          subtitulo: r.subtitulo,
          anoSugerido: r.ano_sugerido || r.anoSugerido || '',
          modulo: r.modulo || r.categoria || (String(r.segmento || '').toUpperCase() === 'ANOS INICIAIS' ? 'Scratch Jr' : 'Scratch'),
          categoria: r.categoria || r.modulo || 'Robótica Educacional',
          duracao: r.duracao || '',
          nivel: r.nivel || 'Iniciante',
          bncc: Array.isArray(r.bncc)
            ? r.bncc
            : typeof r.bncc === 'string'
              ? r.bncc.split(',').map((s: string) => s.trim()).filter(Boolean)
              : [],
          objetivos: normalizeJsonList(r.objetivos),
          materiais: normalizeJsonList(r.materiais),
          etapas: normalizeEtapas(r.etapas),
          linkMaterial: r.link_material || r.linkMaterial || '',
          autor: r.autor || 'CETEC',
          createdAt: r.created_at || r.createdAt,
        }));
        return mapped as unknown as TResponse;
      }

      default:
        console.warn(`[apiGet] Ação não mapeada: ${acao}`);
        return [] as unknown as TResponse;
    }
  } catch (err: any) {
    console.error(`Erro ao executar apiGet (${acao}):`, err);
    throw err;
  }
}

/**
 * Roteamento unificado das chamadas de mutação e escrita (POST) via Supabase
 */
export async function apiPost<TResponse = ApiBaseResponse>(payload: ApiRequestPayload): Promise<TResponse> {
  const acao = String(payload?.acao || '').toLowerCase();

  try {
    switch (acao) {
      case 'login': {
        const email = String(payload.email || '').trim().toLowerCase();
        const senha = String(payload.senha || '').trim();

        if (!email || !senha) {
          return { sucesso: false, erro: 'Preencha o e-mail e a senha.' } as unknown as TResponse;
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });

        if (authError || !authData.user) {
          return { sucesso: false, erro: 'Credenciais incorretas.' } as unknown as TResponse;
        }

        const { data: user, error } = await supabase
          .from('usuarios')
          .select('id, nome, email, acesso, tipo_usuario, id_utec, ver_todas_utecs')
          .ilike('email', email)
          .maybeSingle();

        if (error) {
          await supabase.auth.signOut();
          handleSupabaseError(error);
          return {
            sucesso: false,
            erro: 'falha de conexao com supabase',
          } as unknown as TResponse;
        }

        if (!user) {
          await supabase.auth.signOut();
          return { sucesso: false, erro: 'Credenciais incorretas.' } as unknown as TResponse;
        }

        setSessionToken('authenticated');

        return {
          sucesso: true,
          token: user.id,
          nome: user.nome,
          acesso: user.acesso,
          tipo_usuario: user.tipo_usuario,
          utec: user.id_utec,
          ver_todas_utecs: user.ver_todas_utecs,
        } as unknown as TResponse;
      }

      case 'validar_acesso_banco': {
        const senha = String(payload.senha || '').trim();
        if (!senha) {
          return { sucesso: false, erro: 'Informe a senha do Administrador Supremo.' } as unknown as TResponse;
        }

        const { data: authData } = await supabase.auth.getUser();
        const email = authData.user?.email?.toLowerCase();
        if (!email) {
          return { sucesso: false, erro: 'Sessão autenticada não encontrada.' } as unknown as TResponse;
        }

        const { data: admin, error } = await supabase
          .from('usuarios')
          .select('email, acesso')
          .ilike('email', email)
          .eq('acesso', 'superadmin')
          .maybeSingle();

        if (error) throw error;
        if (!admin) return { sucesso: false, erro: 'Acesso restrito ao Administrador Supremo.' } as unknown as TResponse;

        const { error: reauthenticationError } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        const valido = !reauthenticationError;
        return (valido
          ? { sucesso: true }
          : { sucesso: false, erro: 'Senha do Administrador Supremo incorreta.' }) as unknown as TResponse;
      }

      case 'validar_sessao': {
        const res = await validateSession();
        return (res || { sucesso: false }) as unknown as TResponse;
      }

      case 'logout': {
        await logoutSession();
        return { sucesso: true } as unknown as TResponse;
      }

      case 'salvar_clube':
      case 'cadastrar_clube':
      case 'atualizar_clube': {
        const clubId = payload.id_clube || payload.id;
        const idUtec = Number(payload.id_utec || payload.idUtec || payload.utec);
        const clubData = {
          nome: String(payload.nome || '').trim().toUpperCase(),
          escola: String(payload.escola || '').trim().toUpperCase(),
          id_utec: Number.isInteger(idUtec) && idUtec > 0 ? idUtec : null,
          prof: String(payload.prof || '').trim().toUpperCase(),
          estag: String(payload.estag || '').trim().toUpperCase(),
          dias: String(payload.dias || '').trim().toUpperCase(),
          horario: String(payload.horario || '').trim().toUpperCase(),
          categoria: String(payload.categoria || 'CLUBES INICIAIS').trim().toUpperCase(),
          status: String(payload.status || 'PENDENTE').trim().toUpperCase(),
        };

        if (clubId) {
          const { error } = await supabase
            .from('clubes')
            .update(clubData)
            .eq('id', clubId);

          if (error) throw error;
          return { sucesso: true, id: clubId, mensagem: 'Clube atualizado com sucesso.' } as unknown as TResponse;
        }

        const { data, error } = await supabase
          .from('clubes')
          .insert(clubData)
          .select('id')
          .single();

        if (error) throw error;
        return { sucesso: true, id: data?.id, mensagem: 'Clube criado com sucesso.' } as unknown as TResponse;
      }

      case 'salvar_galeria': {
        const foto = (payload.foto || payload) as any;
        const fotoData = {
          url: String(foto.url || ''),
          titulo: String(foto.titulo || '').trim(),
          legenda: String(foto.legenda || '').trim(),
          descricao: String(foto.descricao || '').trim(),
          autor: String(foto.autor || 'CETEC').trim(),
          escola: String(foto.escola || '').trim(),
          id_utec: Number.isInteger(Number(foto.id_utec)) && Number(foto.id_utec) > 0 ? Number(foto.id_utec) : null,
          clube_nome: String(foto.clubeNome || foto.clube_nome || '').trim(),
          data_envio: foto.dataEnvio || foto.data_envio || new Date().toISOString(),
          consentimento_confirmado: Boolean(foto.consentimentoConfirmado ?? foto.consentimento_confirmado),
        };

        if (!fotoData.url || !fotoData.titulo || !fotoData.legenda) {
          return { sucesso: false, erro: 'Imagem, título e legenda são obrigatórios.' } as unknown as TResponse;
        }

        const fotoId = foto.id && Number.isInteger(Number(foto.id)) ? Number(foto.id) : undefined;
        const query = fotoId
          ? supabase.from('galeria_fotos').update(fotoData).eq('id', fotoId)
          : supabase.from('galeria_fotos').insert(fotoData);
        const { data, error } = await query.select('id').single();
        if (error) throw error;
        return { sucesso: true, id: data.id, mensagem: 'Foto enviada com sucesso.' } as unknown as TResponse;
      }

      case 'excluir_galeria': {
        const fotoId = Number(payload.id);
        if (!Number.isInteger(fotoId)) {
          return { sucesso: false, erro: 'Identificador da foto inválido.' } as unknown as TResponse;
        }
        const { error } = await supabase.from('galeria_fotos').delete().eq('id', fotoId);
        if (error) throw error;
        return { sucesso: true, mensagem: 'Foto excluída com sucesso.' } as unknown as TResponse;
      }

      case 'curtir_galeria': {
        const fotoId = Number(payload.id);
        if (!Number.isInteger(fotoId)) {
          return { sucesso: false, erro: 'Identificador da foto inválido.' } as unknown as TResponse;
        }
        const { data, error } = await supabase
          .from('galeria_fotos')
          .select('curtidas')
          .eq('id', fotoId)
          .single();
        if (error) throw error;
        const { error: updateError } = await supabase
          .from('galeria_fotos')
          .update({ curtidas: Number(data?.curtidas || 0) + 1 })
          .eq('id', fotoId);
        if (updateError) throw updateError;
        return { sucesso: true, mensagem: 'Curtida registrada.' } as unknown as TResponse;
      }

      case 'atualizar_status_clube': {
        const clubId = payload.id_clube || payload.id;
        const status = String(payload.status || 'PENDENTE').trim().toUpperCase();

        const { error } = await supabase
          .from('clubes')
          .update({ status })
          .eq('id', clubId);

        if (error) throw error;
        return { sucesso: true, mensagem: 'Status atualizado com sucesso.' } as unknown as TResponse;
      }

      case 'salvar_clube_competicao':
      case 'cadastrar_clube_competicao':
      case 'atualizar_clube_competicao': {
        const clube = (payload.clube || payload) as any;
        const clubeId = payload.id_clube || payload.id;
        const utecName = String(clube.utec || payload.utec || '').trim();
        let idUtec: number | null = null;

        if (utecName) {
          const { data: utec } = await supabase
            .from('utecs')
            .select('id')
            .ilike('nome', utecName)
            .maybeSingle();
          if (utec?.id) idUtec = Number(utec.id);
        }

        const clubeDataRelation = {
          nome: String(clube.nome || '').trim(),
          escola: String(clube.escola || '').trim(),
          id_utec: idUtec,
          competicao: String(clube.competicao || 'Geral').trim(),
          nivel: String(clube.nivel || 'Nível 1 (Anos Iniciais)').trim(),
          prof: String(clube.prof || 'Não informado').trim(),
          tecnico: String(clube.tecnico || 'Não informado').trim(),
          dias: String(clube.dias || 'A definir').trim(),
          horario: String(clube.horario || 'A definir').trim(),
          status: normalizeCompetitionStatus(clube.status),
        };
        const clubeDataText = {
          nome: String(clube.nome || '').trim(),
          escola: String(clube.escola || '').trim(),
          utec: utecName,
          competicao: String(clube.competicao || 'Geral').trim(),
          nivel: String(clube.nivel || 'Nível 1 (Anos Iniciais)').trim(),
          prof: String(clube.prof || 'Não informado').trim(),
          tecnico: String(clube.tecnico || 'Não informado').trim(),
          dias: String(clube.dias || 'A definir').trim(),
          horario: String(clube.horario || 'A definir').trim(),
          status: String(clube.status || 'pendente').trim(),
        };

        let savedId: unknown;
        if (clubeId && String(clubeId).trim()) {
          let result = await supabase
            .from('clubes_competicao')
            .update(clubeDataRelation)
            .eq('id', clubeId)
            .select('id')
            .single();
          if (result.error && (result.error.message?.includes('id_utec') || result.error.message?.includes('utec'))) {
            result = await supabase
              .from('clubes_competicao')
              .update(clubeDataText)
              .eq('id', clubeId)
              .select('id')
              .single();
          }
          const { data, error } = result;
          if (error) throw error;
          savedId = data?.id;
        } else {
          let result = await supabase
            .from('clubes_competicao')
            .insert(clubeDataRelation)
            .select('id')
            .single();
          if (result.error && (result.error.message?.includes('id_utec') || result.error.message?.includes('utec'))) {
            result = await supabase
              .from('clubes_competicao')
              .insert(clubeDataText)
              .select('id')
              .single();
          }
          const { data, error } = result;
          if (error) throw error;
          savedId = data?.id;
        }

        if (!savedId) throw new Error('Não foi possível obter o identificador do clube de competição.');

        await supabase.from('competidores').delete().eq('id_clube_competicao', savedId);
        await supabase.from('encontros_competicao').delete().eq('id_clube_competicao', savedId);

        const alunos = Array.isArray(clube.alunosList) ? clube.alunosList : [];
        if (alunos.length > 0) {
          const { error } = await supabase.from('competidores').insert(
            alunos.map((aluno: any) => ({
              id_clube_competicao: savedId,
              matricula: String(aluno.matricula || 'S/ MATRÍCULA'),
              nome: String(aluno.nome || '').trim(),
              genero: String(aluno.genero || 'M').toUpperCase() === 'F' ? 'F' : 'M',
              tamanho_camisa: String(aluno.tamanhoCamisa || 'M'),
              data_registro: String(aluno.dataRegistro || ''),
            })),
          );
          if (error) throw error;
        }

        const encontros = Array.isArray(clube.encontrosList) ? clube.encontrosList : [];
        if (encontros.length > 0) {
          const { error } = await supabase.from('encontros_competicao').insert(
            encontros.map((encontro: any) => ({
              id_clube_competicao: savedId,
              data: String(encontro.data || ''),
              assunto: String(encontro.assunto || ''),
              detalhamento: String(encontro.detalhamento || ''),
              quantidade_alunos: String(encontro.quantidadeAlunos || '0'),
              status: normalizeCompetitionMeetingStatus(encontro.status),
            })),
          );
          if (error) throw error;
        }

        return { sucesso: true, id: savedId, mensagem: 'Clube de competição salvo com sucesso.' } as unknown as TResponse;
      }

      case 'excluir_clube_competicao':
      case 'remover_clube_competicao': {
        const clubeId = payload.id_clube || payload.id;
        if (!clubeId) {
          return { sucesso: false, erro: 'Identificador do clube de competição inválido.' } as unknown as TResponse;
        }
        const { error } = await supabase
          .from('clubes_competicao')
          .delete()
          .eq('id', clubeId);
        if (error) throw error;
        return { sucesso: true, mensagem: 'Clube de competição excluído com sucesso.' } as unknown as TResponse;
      }

      case 'excluir_clube':
      case 'remover_clube': {
        const clubId = payload.id_clube || payload.id;
        const senha = String(payload.senha || '').trim();

        if (senha) {
          const validPassword = await verifyAdminOrUserPassword(senha);
          if (!validPassword) {
            return { sucesso: false, erro: 'Senha incorreta para confirmação.' } as unknown as TResponse;
          }
        }

        const { error } = await supabase
          .from('clubes')
          .delete()
          .eq('id', clubId);

        if (error) throw error;
        return { sucesso: true, mensagem: 'Clube excluído com sucesso.' } as unknown as TResponse;
      }

      case 'salvar_aluno':
      case 'cadastrar_aluno': {
        const alunoId = payload.id_aluno || payload.id;
        const idClube = payload.id_clube || payload.idClube;
        const tamanhoCamisa = String(payload.tamanho_camisa || payload.tamanhoCamisa || 'M').trim().toUpperCase();
        const alunoDataFull: Record<string, any> = {
          id_clube: idClube,
          matricula: String(payload.matricula || 'S/ MATRÍCULA').trim().toUpperCase(),
          nome: String(payload.nome || '').trim().toUpperCase(),
          sexo: String(payload.sexo || 'M').toUpperCase().startsWith('F') ? 'F' : 'M',
          tamanho_camisa: tamanhoCamisa,
        };
        const alunoDataLegacy: Record<string, any> = {
          id_clube: idClube,
          matricula: String(payload.matricula || 'S/ MATRÍCULA').trim().toUpperCase(),
          nome: String(payload.nome || '').trim().toUpperCase(),
          sexo: String(payload.sexo || 'M').toUpperCase().startsWith('F') ? 'F' : 'M',
        };

        if (alunoId) {
          let { error } = await supabase
            .from('alunos')
            .update(alunoDataFull)
            .eq('id', alunoId);

          if (error && (error.message?.includes('tamanho_camisa') || error.code === '42703')) {
            const fallback = await supabase
              .from('alunos')
              .update(alunoDataLegacy)
              .eq('id', alunoId);
            error = fallback.error;
          }

          if (error) throw error;
          return { sucesso: true, id: alunoId, mensagem: 'Aluno atualizado com sucesso.' } as unknown as TResponse;
        }

        let { data, error } = await supabase
          .from('alunos')
          .insert(alunoDataFull)
          .select('id')
          .single();

        if (error && (error.message?.includes('tamanho_camisa') || error.code === '42703')) {
          const fallback = await supabase
            .from('alunos')
            .insert(alunoDataLegacy)
            .select('id')
            .single();
          data = fallback.data;
          error = fallback.error;
        }

        if (error) throw error;
        return { sucesso: true, id: data?.id, mensagem: 'Aluno cadastrado com sucesso.' } as unknown as TResponse;
      }

      case 'excluir_aluno':
      case 'remover_aluno': {
        const alunoId = payload.id_aluno || payload.id;
        const { error } = await supabase
          .from('alunos')
          .delete()
          .eq('id', alunoId);

        if (error) throw error;
        return { sucesso: true, mensagem: 'Aluno removido com sucesso.' } as unknown as TResponse;
      }

      case 'salvar_encontro':
      case 'cadastrar_encontro': {
        const encontroId = payload.id_encontro || payload.id;
        const idClube = payload.id_clube || payload.idClube;
        const quantidadeAlunos = Number(payload.quantidadeAlunos ?? payload.quantidade_alunos ?? 0);

        const encontroData = {
          id_clube: idClube,
          modulo: String(payload.modulo || '').trim().toUpperCase(),
          assunto: String(payload.assunto || '').trim().toUpperCase(),
          detalhamento: String(payload.detalhamento || '').trim(),
          data: String(payload.data || '').trim(),
          status: String(payload.status || 'A FAZER').trim().toUpperCase(),
          frequencia: String(payload.frequencia || '').trim(),
          quantidade_alunos: Number.isNaN(quantidadeAlunos) ? 0 : quantidadeAlunos,
        };

        if (encontroId) {
          const { error } = await supabase
            .from('encontros')
            .update(encontroData)
            .eq('id', encontroId);

          if (error) throw error;
          return { sucesso: true, id: encontroId, mensagem: 'Encontro atualizado com sucesso.' } as unknown as TResponse;
        }

        const { data, error } = await supabase
          .from('encontros')
          .insert(encontroData)
          .select('id')
          .single();

        if (error) throw error;
        return { sucesso: true, id: data?.id, mensagem: 'Encontro cadastrado com sucesso.' } as unknown as TResponse;
      }

      case 'excluir_encontro':
      case 'remover_encontro': {
        const encontroId = payload.id_encontro || payload.id;
        const { error } = await supabase
          .from('encontros')
          .delete()
          .eq('id', encontroId);

        if (error) throw error;
        return { sucesso: true, mensagem: 'Encontro removido com sucesso.' } as unknown as TResponse;
      }

      case 'atualizar_status_encontro': {
        const encontroId = payload.id_encontro || payload.id;
        const status = String(payload.status || 'A FAZER').trim().toUpperCase();

        if (!encontroId) {
          return { sucesso: false, erro: 'Identificador do encontro ausente.' } as unknown as TResponse;
        }

        const { error } = await supabase
          .from('encontros')
          .update({ status })
          .eq('id', encontroId);

        if (error) throw error;
        return { sucesso: true, mensagem: 'Status do encontro atualizado com sucesso.' } as unknown as TResponse;
      }

      case 'salvar_usuario':
      case 'cadastrar_usuario': {
        const userId = payload.id || payload.id_usuario;
        const email = String(payload.email || '').trim().toLowerCase();
        const nome = String(payload.nome || '').trim().toUpperCase();
        const acesso = String(payload.acesso || 'editor').trim().toLowerCase();
        const tipoUsuario = String(payload.tipo_usuario || payload.tipoUsuario || 'utec').trim().toLowerCase();
        const idUtec = payload.id_utec || payload.idUtec || null;
        const verTodasUtecs = Boolean(payload.ver_todas_utecs ?? payload.verTodasUtecs ?? false);
        if (userId) {
          const updateData: Record<string, unknown> = {
            nome,
            email,
            acesso,
            tipo_usuario: tipoUsuario,
            id_utec: isAnyAdminAccess(acesso) ? null : idUtec,
            ver_todas_utecs: verTodasUtecs,
          };
          const { error } = await supabase
            .from('usuarios')
            .update(updateData)
            .eq('id', userId);

          if (error) throw error;
          await registrarAuditoria('atualizar', 'usuarios', userId, { nome, email, acesso });
          return { sucesso: true, id: userId, mensagem: 'Usuário atualizado com sucesso.' } as unknown as TResponse;
        }

        if (!email || !nome) {
          return { sucesso: false, erro: 'Nome e e-mail são obrigatórios.' } as unknown as TResponse;
        }

        const { data, error } = await supabase
          .from('usuarios')
          .insert({
            nome,
            email,
            acesso,
            tipo_usuario: tipoUsuario,
            id_utec: isAnyAdminAccess(acesso) ? null : idUtec,
            ver_todas_utecs: verTodasUtecs,
          })
          .select('id')
          .single();

        if (error) {
          if (error.code === '23505') {
            return { sucesso: false, erro: 'Já existe um perfil cadastrado com este e-mail.' } as unknown as TResponse;
          }
          throw error;
        }

        await registrarAuditoria('cadastrar', 'usuarios', data?.id, { nome, email, acesso });
        return { sucesso: true, id: data?.id, mensagem: 'Perfil cadastrado com sucesso.' } as unknown as TResponse;
      }

      case 'excluir_usuario':
      case 'remover_usuario': {
        const userId = payload.id || payload.id_usuario;
        const email = payload.email ? String(payload.email).trim().toLowerCase() : '';
        const senha = String(payload.senha || '').trim();

        if (senha) {
          const validPassword = await verifyAdminOrUserPassword(senha);
          if (!validPassword) {
            return { sucesso: false, erro: 'Senha de administrador incorreta.' } as unknown as TResponse;
          }
        }

        let query = supabase.from('usuarios').delete();
        if (userId) {
          query = query.eq('id', userId);
        } else if (email) {
          query = query.ilike('email', email);
        } else {
          return { sucesso: false, erro: 'Identificador do usuário ausente.' } as unknown as TResponse;
        }

        const { error } = await query;
        if (error) throw error;
        await registrarAuditoria('excluir', 'usuarios', userId || email, {});
        return { sucesso: true, mensagem: 'Usuário excluído com sucesso.' } as unknown as TResponse;
      }

      case 'salvar_utec': {
        const id = payload.id || payload.id_utec;
        const nome = String(payload.nome || '').trim();
        if (!nome) return { sucesso: false, erro: 'Informe o nome da UTEC.' } as unknown as TResponse;
        if (id) {
          const { error } = await supabase.from('utecs').update({ nome }).eq('id', id);
          if (error) throw error;
          await registrarAuditoria('atualizar', 'utecs', id, { nome });
          return { sucesso: true, id, mensagem: 'UTEC atualizada com sucesso.' } as unknown as TResponse;
        }
        const { data, error } = await supabase.from('utecs').insert({ nome }).select('id').single();
        if (error) throw error;
        await registrarAuditoria('cadastrar', 'utecs', data?.id, { nome });
        return { sucesso: true, id: data?.id, mensagem: 'UTEC cadastrada com sucesso.' } as unknown as TResponse;
      }

      case 'excluir_utec': {
        const id = payload.id || payload.id_utec;
        if (!id) return { sucesso: false, erro: 'Identificador da UTEC ausente.' } as unknown as TResponse;
        const { error } = await supabase.from('utecs').delete().eq('id', id);
        if (error) throw error;
        await registrarAuditoria('excluir', 'utecs', id, {});
        return { sucesso: true, mensagem: 'UTEC excluída com sucesso.' } as unknown as TResponse;
      }

      case 'salvar_roteiro': {
        const roteiro = (payload.roteiro || payload) as any;
        const id = roteiro.id || `rot-custom-${Date.now()}`;
        const segmento = String(roteiro.segmento || 'ANOS INICIAIS').toUpperCase() as 'ANOS INICIAIS' | 'ANOS FINAIS';
        const formatted: RoteiroDidatico = {
          id,
          segmento,
          titulo: String(roteiro.titulo || '').trim(),
          subtitulo: String(roteiro.subtitulo || '').trim(),
          anoSugerido: String(roteiro.anoSugerido || roteiro.ano_sugerido || '').trim(),
          modulo: String(roteiro.modulo || roteiro.categoria || (segmento === 'ANOS INICIAIS' ? 'Scratch Jr' : 'Scratch')).trim(),
          categoria: String(roteiro.categoria || roteiro.modulo || 'Robótica Educacional').trim(),
          duracao: String(roteiro.duracao || '').trim(),
          nivel: (roteiro.nivel as 'Iniciante' | 'Intermediário' | 'Avançado') || 'Iniciante',
          bncc: Array.isArray(roteiro.bncc)
            ? roteiro.bncc
            : String(roteiro.bncc || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
          objetivos: Array.isArray(roteiro.objetivos)
            ? roteiro.objetivos
            : String(roteiro.objetivos || '')
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
          materiais: Array.isArray(roteiro.materiais)
            ? roteiro.materiais
            : String(roteiro.materiais || '')
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
          etapas: roteiro.etapas || {
            aquecimento: roteiro.aquecimento || '',
            desenvolvimento: roteiro.desenvolvimento || '',
            maoNaMassa: roteiro.maoNaMassa || roteiro.mao_na_massa || '',
            desafio: roteiro.desafio || '',
            avaliacao: roteiro.avaliacao || '',
          },
          linkMaterial: roteiro.linkMaterial || roteiro.link_material || '',
          autor: roteiro.autor || 'Administrador CETEC',
          createdAt: roteiro.createdAt || new Date().toISOString(),
        };

        const dbPayload = {
          segmento: formatted.segmento,
          titulo: formatted.titulo,
          subtitulo: formatted.subtitulo,
          ano_sugerido: formatted.anoSugerido,
          categoria: formatted.categoria,
          modulo: formatted.modulo,
          duracao: formatted.duracao,
          nivel: formatted.nivel,
          bncc: formatted.bncc,
          objetivos: formatted.objetivos,
          materiais: formatted.materiais,
          etapas: formatted.etapas,
          link_material: formatted.linkMaterial,
          autor: formatted.autor,
          ...(Number.isInteger(Number(formatted.id)) ? { id: Number(formatted.id) } : {}),
        };
        const { data, error } = await supabase
          .from('roteiros_didaticos')
          .upsert(dbPayload)
          .select('id')
          .single();

        if (error) {
          throw error;
        }

        const persistedId = String(data.id);
        saveCustomRoteiro({ ...formatted, id: persistedId });
        return { sucesso: true, id: persistedId, mensagem: 'Plano de aula salvo com sucesso.' } as unknown as TResponse;
      }

      case 'excluir_roteiro': {
        const id = String(payload.id || payload.id_roteiro || '');
        if (!id || !Number.isInteger(Number(id))) {
          return { sucesso: false, erro: 'Identificador do roteiro inválido.' } as unknown as TResponse;
        }
        const { error } = await supabase.from('roteiros_didaticos').delete().eq('id', Number(id));
        if (error) throw error;
        deleteCustomRoteiro(id);
        return { sucesso: true, mensagem: 'Plano de aula removido com sucesso.' } as unknown as TResponse;
      }

      default:
        console.warn(`[apiPost] Ação não mapeada: ${acao}`);
        return { sucesso: false, erro: `Ação desconhecida: ${acao}` } as unknown as TResponse;
    }
  } catch (err: any) {
    console.error(`Erro ao executar apiPost (${acao}):`, err);
    return {
      sucesso: false,
      erro: err instanceof Error ? err.message : 'Falha ao executar a operação no Supabase.',
    } as unknown as TResponse;
  }
}

/**
 * Validação de senha administrativa para operações destrutivas
 */
async function verifyAdminOrUserPassword(inputPassword: string): Promise<boolean> {
  if (!inputPassword) return false;

  try {
    const { data: authData } = await supabase.auth.getUser();
    const email = authData.user?.email;
    if (!email) return false;

    const { data: currentUser } = await supabase
      .from('usuarios')
      .select('acesso')
      .ilike('email', email)
      .maybeSingle();

    if (!currentUser || !isAnyAdminAccess(currentUser.acesso)) return false;
    const { error } = await supabase.auth.signInWithPassword({ email, password: inputPassword });
    return !error;
  } catch {
    return false;
  }
}

function handleSupabaseError(error: any): void {
  if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
    console.error(
      '[Supabase] Tabelas não encontradas no banco de dados. Execute o script supabase-setup.sql no SQL Editor do Supabase.',
      error
    );
  } else {
    console.error('[Supabase Error]:', error);
  }
}
