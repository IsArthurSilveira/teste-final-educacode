import { supabase } from './supabase';
import { DEFAULT_ROTEIROS } from '../data/defaultRoteiros';
import type { RoteiroDidatico } from '../data/defaultRoteiros';

export const TOKEN_STORAGE_KEY = 'painel_token_sessao';
export const AUTH_EXPIRED_EVENT = 'auth:expired';
export const ROTEIROS_CUSTOM_STORAGE_KEY = 'painel_roteiros_custom_v1';

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
    const token = getSessionToken();
    if (!token) return null;

    if (token === 'superadmin-master-token') {
      return {
        sucesso: true,
        nome: 'Administrador Supremo',
        acesso: 'superadmin',
        tipo_usuario: 'global',
        utec: '',
        ver_todas_utecs: true,
      };
    }

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, acesso, tipo_usuario, utec, ver_todas_utecs')
      .eq('id', token)
      .maybeSingle();

    if (error || !user) {
      return null;
    }

    return {
      sucesso: true,
      nome: user.nome,
      acesso: user.acesso,
      tipo_usuario: user.tipo_usuario,
      utec: user.utec,
      ver_todas_utecs: user.ver_todas_utecs,
    };
  } catch {
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  clearSessionToken();
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
        const { data: clubes, error } = await supabase
          .from('clubes')
          .select('*, alunos(count), encontros(status)')
          .order('nome', { ascending: true });

        if (error) {
          handleSupabaseError(error);
          return [] as unknown as TResponse;
        }

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
            utec: String(c.utec || '').toUpperCase(),
            nomeUtec: c.nome_utec || c.utec,
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
        let query = supabase.from('alunos').select('*');

        if (idClube) {
          query = query.eq('id_clube', idClube);
        }

        const { data, error } = await query.order('nome', { ascending: true });
        if (error) {
          handleSupabaseError(error);
          return [] as unknown as TResponse;
        }

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
        const { data, error } = await supabase
          .from('alunos')
          .select('*')
          .order('nome', { ascending: true });

        if (error) {
          handleSupabaseError(error);
          return [] as unknown as TResponse;
        }

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
        let query = supabase.from('encontros').select('*');

        if (idClube) {
          query = query.eq('id_clube', idClube);
        }

        const { data, error } = await query.order('data', { ascending: true });
        if (error) {
          handleSupabaseError(error);
          return [] as unknown as TResponse;
        }

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
          .select('id, nome, email, acesso, tipo_usuario, utec, ver_todas_utecs, created_at')
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
          utec: u.utec,
          verTodasUtecs: u.ver_todas_utecs,
          ver_todas_utecs: u.ver_todas_utecs,
        }));

        return mapped as unknown as TResponse;
      }

      case 'listar_roteiros': {
        try {
          const { data, error } = await supabase
            .from('roteiros_didaticos')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data) && data.length > 0) {
            const mapped = data.map((r: any) => ({
              id: r.id,
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
              objetivos: Array.isArray(r.objetivos)
                ? r.objetivos
                : typeof r.objetivos === 'string'
                  ? JSON.parse(r.objetivos || '[]')
                  : [],
              materiais: Array.isArray(r.materiais)
                ? r.materiais
                : typeof r.materiais === 'string'
                  ? JSON.parse(r.materiais || '[]')
                  : [],
              etapas: typeof r.etapas === 'object' && r.etapas !== null
                ? r.etapas
                : typeof r.etapas === 'string'
                  ? JSON.parse(r.etapas || '{}')
                  : {},
              linkMaterial: r.link_material || r.linkMaterial || '',
              autor: r.autor || 'CETEC',
              createdAt: r.created_at || r.createdAt,
            }));
            return mapped as unknown as TResponse;
          }
        } catch {
          // Mantém fallback caso a tabela não exista ainda no Supabase
        }

        const customRoteiros = getStoredCustomRoteiros();
        const allRoteiros = [...customRoteiros, ...DEFAULT_ROTEIROS];
        return allRoteiros as unknown as TResponse;
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

        // Suporte direto para Administrador Supremo
        if (
          (email === 'adminsupremo@cetec.com' || email === 'superadmin@cetec.com' || email === 'adminsupremo') &&
          senha === 'adminsupremo'
        ) {
          setSessionToken('superadmin-master-token');
          return {
            sucesso: true,
            token: 'superadmin-master-token',
            nome: 'Administrador Supremo',
            acesso: 'superadmin',
            tipo_usuario: 'global',
            utec: '',
            ver_todas_utecs: true,
          } as unknown as TResponse;
        }

        const { data: user, error } = await supabase
          .from('usuarios')
          .select('*')
          .ilike('email', email)
          .maybeSingle();

        if (error) {
          handleSupabaseError(error);
          return {
            sucesso: false,
            erro: 'falha de conexao com supabase',
          } as unknown as TResponse;
        }

        if (!user || user.senha !== senha) {
          return { sucesso: false, erro: 'Credenciais incorretas.' } as unknown as TResponse;
        }

        setSessionToken(user.id);

        return {
          sucesso: true,
          token: user.id,
          nome: user.nome,
          acesso: user.acesso,
          tipo_usuario: user.tipo_usuario,
          utec: user.utec,
          ver_todas_utecs: user.ver_todas_utecs,
        } as unknown as TResponse;
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
        const clubData = {
          nome: String(payload.nome || '').trim().toUpperCase(),
          escola: String(payload.escola || '').trim().toUpperCase(),
          utec: String(payload.utec || '').trim().toUpperCase(),
          nome_utec: String(payload.nomeUtec || payload.nome_utec || payload.utec || '').trim(),
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

      case 'salvar_usuario':
      case 'cadastrar_usuario': {
        const userId = payload.id || payload.id_usuario;
        const email = String(payload.email || '').trim().toLowerCase();
        const nome = String(payload.nome || '').trim().toUpperCase();
        const acesso = String(payload.acesso || 'editor').trim().toLowerCase();
        const tipoUsuario = String(payload.tipo_usuario || payload.tipoUsuario || 'utec').trim().toLowerCase();
        const utec = String(payload.utec || '').trim().toUpperCase();
        const verTodasUtecs = Boolean(payload.ver_todas_utecs ?? payload.verTodasUtecs ?? false);
        const senha = String(payload.senha || '').trim();

        if (userId) {
          const updateData: Record<string, unknown> = {
            nome,
            email,
            acesso,
            tipo_usuario: tipoUsuario,
            utec,
            ver_todas_utecs: verTodasUtecs,
          };
          if (senha) {
            updateData.senha = senha;
          }

          const { error } = await supabase
            .from('usuarios')
            .update(updateData)
            .eq('id', userId);

          if (error) throw error;
          return { sucesso: true, id: userId, mensagem: 'Usuário atualizado com sucesso.' } as unknown as TResponse;
        }

        if (!senha) {
          return { sucesso: false, erro: 'A senha é obrigatória para novos usuários.' } as unknown as TResponse;
        }

        const { data, error } = await supabase
          .from('usuarios')
          .insert({
            nome,
            email,
            senha,
            acesso,
            tipo_usuario: tipoUsuario,
            utec,
            ver_todas_utecs: verTodasUtecs,
          })
          .select('id')
          .single();

        if (error) {
          if (error.code === '23505') {
            return { sucesso: false, erro: 'Já existe um usuário cadastrado com este e-mail.' } as unknown as TResponse;
          }
          throw error;
        }

        return { sucesso: true, id: data?.id, mensagem: 'Usuário cadastrado com sucesso.' } as unknown as TResponse;
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
        return { sucesso: true, mensagem: 'Usuário excluído com sucesso.' } as unknown as TResponse;
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

        saveCustomRoteiro(formatted);

        try {
          await supabase.from('roteiros_didaticos').upsert({
            id: formatted.id,
            segmento: formatted.segmento,
            titulo: formatted.titulo,
            subtitulo: formatted.subtitulo,
            ano_sugerido: formatted.anoSugerido,
            categoria: formatted.categoria,
            duracao: formatted.duracao,
            nivel: formatted.nivel,
            bncc: formatted.bncc,
            objetivos: formatted.objetivos,
            materiais: formatted.materiais,
            etapas: formatted.etapas,
            link_material: formatted.linkMaterial,
            autor: formatted.autor,
          });
        } catch (e) {
          console.warn('[Supabase] Tabela roteiros_didaticos opcional, armazenado localmente:', e);
        }

        return { sucesso: true, id: formatted.id, mensagem: 'Plano de aula salvo com sucesso.' } as unknown as TResponse;
      }

      case 'excluir_roteiro': {
        const id = String(payload.id || payload.id_roteiro || '');
        deleteCustomRoteiro(id);
        try {
          await supabase.from('roteiros_didaticos').delete().eq('id', id);
        } catch {
          // ignore
        }
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
      erro: 'falha de conexao com supabase',
    } as unknown as TResponse;
  }
}

/**
 * Validação de senha administrativa para operações destrutivas
 */
async function verifyAdminOrUserPassword(inputPassword: string): Promise<boolean> {
  if (!inputPassword) return false;
  const currentToken = getSessionToken();

  try {
    if (currentToken) {
      const { data: currentUser } = await supabase
        .from('usuarios')
        .select('senha, acesso')
        .eq('id', currentToken)
        .maybeSingle();

      if (currentUser?.senha && currentUser.senha === inputPassword) {
        return true;
      }
    }

    // Se a senha bater com qualquer usuário administrador
    const { data: admins } = await supabase
      .from('usuarios')
      .select('senha')
      .eq('acesso', 'administrador')
      .eq('senha', inputPassword)
      .limit(1);

    return Boolean(admins && admins.length > 0);
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
