import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import {
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  getStoredSupabaseConfig,
} from '../config';
import {
  saveSupabaseConfig,
  resetSupabaseConfig,
  testSupabaseConnection,
} from '../services/supabase';
import { apiPost } from '../services/api';
import {
  getDatabaseSummaryStats,
  exportDatabaseToExcel,
  downloadAllTablesAsCsv,
  executeAnnualReset,
} from '../services/databaseControl';
import type { DatabaseSummaryStats } from '../services/databaseControl';
import { canAccessDatabase, isSuperAdmin } from '../utils/permissions';
import supabaseSetupSql from '../../supabase-setup.sql?raw';

interface DatabaseControlPageProps {
  userName: string;
  userRole?: string;
  allowAdminTools?: boolean;
  allowUsersTools?: boolean;
  onLogout: () => void;
  onOpenDashboard: () => void;
  onOpenClubs: () => void;
  onOpenRoteiros: () => void;
  onOpenGaleria?: () => void;
  onOpenClubesCompeticao?: () => void;
  onOpenProjetosFicFecom?: () => void;
  onOpenDatabaseControl?: () => void;
  onOpenNewClub?: () => void;
  onOpenAdminDeleteClubs?: () => void;
  onOpenAdminUsers?: () => void;
}

const AUTH_SESSION_KEY = 'CETEC_DB_CONTROL_AUTH';

export function DatabaseControlPage({
  userName,
  userRole,
  allowUsersTools = false,
  onLogout,
  onOpenDashboard,
  onOpenClubs,
  onOpenRoteiros,
  onOpenGaleria,
  onOpenClubesCompeticao,
  onOpenProjetosFicFecom,
  onOpenDatabaseControl,
  onOpenAdminUsers,
}: DatabaseControlPageProps) {
  if (!canAccessDatabase(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Administradores supremos já autenticados entram diretamente; após bloquear,
  // o desbloqueio exige a senha cadastrada para o administrador no Supabase.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return isSuperAdmin(userRole) || sessionStorage.getItem(AUTH_SESSION_KEY) === 'authenticated';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Abas da página
  const [activeTab, setActiveTab] = useState<'conexao' | 'backup' | 'reset'>('conexao');

  // Parâmetros de Conexão Supabase
  const [supabaseUrl, setSupabaseUrl] = useState(() => getStoredSupabaseConfig().url);
  const [supabaseKey, setSupabaseKey] = useState(() => getStoredSupabaseConfig().key);
  const [isCustomConfig, setIsCustomConfig] = useState(() => getStoredSupabaseConfig().isCustom);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    ok: boolean;
    latencyMs?: number;
    message?: string;
  }>({ tested: false, ok: false });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Estatísticas do Banco
  const [stats, setStats] = useState<DatabaseSummaryStats>({
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
    loading: true,
  });

  // Exportação
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportNotice, setExportNotice] = useState('');

  // Reset Anual
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null);

  // Copiar SQL
  const [sqlCopied, setSqlCopied] = useState(false);

  // Carregar estatísticas e testar conexão inicial ao autenticar
  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    async function loadData() {
      // 1. Estatísticas
      const resStats = await getDatabaseSummaryStats();
      if (active) {
        setStats(resStats);
      }

      // 2. Teste da conexão ativa
      const test = await testSupabaseConnection();
      if (active) {
        setConnectionStatus({
          tested: true,
          ok: test.ok,
          latencyMs: test.latencyMs,
          message: test.message,
        });
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Tratar submissão de senha
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await apiPost<{ sucesso?: boolean; erro?: string }>({
        acao: 'validar_acesso_banco',
        senha: passwordInput,
      });
      if (response.sucesso) {
        sessionStorage.setItem(AUTH_SESSION_KEY, 'authenticated');
        setIsAuthenticated(true);
        setPasswordInput('');
        return;
      }
      setAuthError(response.erro || 'Senha do Administrador Supremo incorreta.');
    } catch {
      setAuthError('Não foi possível validar a senha no Supabase.');
    }
  }

  function handleLock() {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setIsAuthenticated(false);
    setPasswordInput('');
    setAuthError('');
  }

  // Testar conexão Supabase
  async function handleTestConnection() {
    setTestingConnection(true);
    setSaveSuccessMsg('');
    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setConnectionStatus({
      tested: true,
      ok: res.ok,
      latencyMs: res.latencyMs,
      message: res.message,
    });
    setTestingConnection(false);
  }

  // Salvar nova configuração de banco
  function handleSaveConnection() {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      alert('Por favor, preencha a URL do Supabase e a Chave de Acesso.');
      return;
    }
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setIsCustomConfig(true);
    setSaveSuccessMsg('Conexão atualizada com sucesso! O sistema agora utiliza o novo banco de dados.');
    setTimeout(() => setSaveSuccessMsg(''), 4500);
    // Atualiza status
    handleTestConnection();
  }

  // Restaurar padrão CETEC
  function handleResetDefaultConnection() {
    if (!confirm('Deseja realmente voltar para o banco de dados padrão do CETEC?')) return;
    resetSupabaseConfig();
    const def = getStoredSupabaseConfig();
    setSupabaseUrl(def.url);
    setSupabaseKey(def.key);
    setIsCustomConfig(false);
    setSaveSuccessMsg('Configuração restaurada para o banco padrão do CETEC.');
    setTimeout(() => setSaveSuccessMsg(''), 4500);
    handleTestConnection();
  }

  // Exportar Excel
  async function handleExportExcel() {
    setIsExportingExcel(true);
    setExportNotice('');
    try {
      const res = await exportDatabaseToExcel();
      setExportNotice(`Download concluído com sucesso: ${res.filename}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na exportação';
      setExportNotice(`Erro na exportação: ${msg}`);
    } finally {
      setIsExportingExcel(false);
    }
  }

  // Exportar CSVs
  async function handleExportCsv() {
    setIsExportingCsv(true);
    setExportNotice('');
    try {
      await downloadAllTablesAsCsv();
      setExportNotice('Downloads dos arquivos CSV iniciados com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na exportação';
      setExportNotice(`Erro na exportação: ${msg}`);
    } finally {
      setIsExportingCsv(false);
    }
  }

  // Executar Reset de Ciclo Anual
  async function handleExecuteReset() {
    if (resetConfirmText.trim().toUpperCase() !== 'RESETAR CICLO 2026') {
      alert('Digite exatamente "RESETAR CICLO 2026" no campo de confirmação.');
      return;
    }

    if (!confirm('ATENÇÃO: Você tem certeza que deseja resetar os dados do ciclo? Certifique-se de já ter baixado o backup em Excel.')) {
      return;
    }

    setResetting(true);
    setResetResult(null);

    const res = await executeAnnualReset();
    setResetResult(res);
    setResetting(false);
    setResetConfirmText('');

    // Atualiza contadores
    const fresh = await getDatabaseSummaryStats();
    setStats(fresh);
  }

  // Copiar SQL Setup
  function handleCopySql() {
    const sqlText = `-- ==============================================================================
-- SCRIPT COMPLETO DE CRIAÇÃO DO BANCO DE DADOS SUPABASE (CETEC - EDUCACODE)
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    acesso TEXT NOT NULL DEFAULT 'editor',
    tipo_usuario TEXT NOT NULL DEFAULT 'utec',
    utec TEXT DEFAULT '',
    ver_todas_utecs BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.clubes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    escola TEXT NOT NULL DEFAULT '',
    utec TEXT NOT NULL DEFAULT '',
    nome_utec TEXT DEFAULT '',
    prof TEXT DEFAULT '',
    estag TEXT DEFAULT '',
    dias TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    categoria TEXT NOT NULL DEFAULT 'CLUBES INICIAIS',
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube UUID NOT NULL REFERENCES public.clubes(id) ON DELETE CASCADE,
    matricula TEXT NOT NULL DEFAULT 'S/ MATRÍCULA',
    nome TEXT NOT NULL,
    sexo TEXT DEFAULT 'M' CHECK (sexo IN ('M', 'F')),
    data_registro TEXT DEFAULT to_char(now(), 'DD/MM/YYYY'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.encontros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube UUID NOT NULL REFERENCES public.clubes(id) ON DELETE CASCADE,
    modulo TEXT DEFAULT '',
    assunto TEXT NOT NULL DEFAULT '',
    detalhamento TEXT DEFAULT '',
    data TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'A FAZER',
    frequencia TEXT DEFAULT '',
    quantidade_alunos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.roteiros_didaticos (
    id TEXT PRIMARY KEY,
    segmento TEXT NOT NULL DEFAULT 'ANOS INICIAIS',
    titulo TEXT NOT NULL,
    subtitulo TEXT NOT NULL DEFAULT '',
    ano_sugerido TEXT DEFAULT '',
    categoria TEXT DEFAULT 'Robótica Educacional',
    modulo TEXT DEFAULT '',
    duracao TEXT DEFAULT '2 Encontros (4h)',
    nivel TEXT DEFAULT 'Iniciante',
    bncc JSONB DEFAULT '[]'::jsonb,
    objetivos JSONB DEFAULT '[]'::jsonb,
    materiais JSONB DEFAULT '[]'::jsonb,
    etapas JSONB DEFAULT '{}'::jsonb,
    link_material TEXT DEFAULT '',
    autor TEXT DEFAULT 'Equipe Pedagógica CETEC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.clubes_competicao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    escola TEXT NOT NULL DEFAULT '',
    utec TEXT NOT NULL DEFAULT '',
    competicao TEXT NOT NULL DEFAULT 'Geral',
    nivel TEXT NOT NULL DEFAULT 'Nível 1 (Anos Iniciais)',
    prof TEXT DEFAULT '',
    tecnico TEXT DEFAULT '',
    dias TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.competidores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube_competicao UUID NOT NULL REFERENCES public.clubes_competicao(id) ON DELETE CASCADE,
    matricula TEXT DEFAULT '',
    nome TEXT NOT NULL,
    genero TEXT DEFAULT 'M' CHECK (genero IN ('M', 'F')),
    tamanho_camisa TEXT DEFAULT 'M',
    data_registro TEXT DEFAULT to_char(now(), 'DD/MM/YYYY'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.encontros_competicao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube_competicao UUID NOT NULL REFERENCES public.clubes_competicao(id) ON DELETE CASCADE,
    data TEXT DEFAULT '',
    assunto TEXT NOT NULL DEFAULT '',
    detalhamento TEXT DEFAULT '',
    quantidade_alunos TEXT DEFAULT '0',
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.projetos_fic_fecom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    modalidade TEXT NOT NULL DEFAULT 'FIC',
    escola TEXT NOT NULL DEFAULT '',
    utec TEXT NOT NULL DEFAULT '',
    professor TEXT DEFAULT '',
    estagiario TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendente',
    data_cadastro TEXT DEFAULT to_char(now(), 'YYYY-MM-DD'),
    justificativa_tematica TEXT DEFAULT '',
    processo_construcao TEXT DEFAULT '',
    pensar_brincando TEXT DEFAULT '',
    linguagens_usadas JSONB DEFAULT '[]'::jsonb,
    proposito_coletivo TEXT DEFAULT '',
    recursos_robotica JSONB DEFAULT '[]'::jsonb,
    recursos_outro_descricao TEXT DEFAULT '',
    conteudos_escolares TEXT DEFAULT '',
    competencias_bncc TEXT DEFAULT '',
    habilidades_bncc TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.integrantes_projeto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_projeto UUID NOT NULL REFERENCES public.projetos_fic_fecom(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    matricula TEXT DEFAULT '',
    ano_escolar TEXT DEFAULT '',
    genero TEXT DEFAULT 'M' CHECK (genero IN ('M', 'F')),
    tamanho_camisa TEXT DEFAULT 'M',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.galeria_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    titulo TEXT NOT NULL,
    legenda TEXT DEFAULT '',
    descricao TEXT DEFAULT '',
    autor TEXT NOT NULL DEFAULT 'CETEC',
    cargo_autor TEXT DEFAULT '',
    escola TEXT DEFAULT '',
    utec TEXT DEFAULT '',
    clube_nome TEXT DEFAULT '',
    modulo TEXT DEFAULT '',
    data_envio TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    curtidas INTEGER DEFAULT 0,
    consentimento_confirmado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- HABILITAR RLS COM ACESSO PÚBLICO TOTAL
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encontros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiros_didaticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubes_competicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encontros_competicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos_fic_fecom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrantes_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso publico usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico clubes" ON public.clubes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico alunos" ON public.alunos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico encontros" ON public.encontros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico roteiros" ON public.roteiros_didaticos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico clubes_competicao" ON public.clubes_competicao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico competidores" ON public.competidores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico encontros_competicao" ON public.encontros_competicao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico projetos_fic_fecom" ON public.projetos_fic_fecom FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico integrantes_projeto" ON public.integrantes_projeto FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico galeria_fotos" ON public.galeria_fotos FOR ALL USING (true) WITH CHECK (true);

-- REGISTRO INICIAL ÚNICO: ADMIN SUPREMO
INSERT INTO public.usuarios (nome, email, senha, acesso, tipo_usuario, utec, ver_todas_utecs)
VALUES ('Administrador Supremo', 'adminsupremo@cetec.com', 'adminsupremo', 'superadmin', 'global', '', true)
ON CONFLICT (email) DO UPDATE SET
    nome = 'Administrador Supremo',
    senha = 'adminsupremo',
    acesso = 'superadmin',
    tipo_usuario = 'global',
    ver_todas_utecs = true;`;

    navigator.clipboard.writeText(supabaseSetupSql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  }

  // Se não estiver autenticado, exibe a tela de segurança com a senha master
  if (!isAuthenticated) {
    return (
      <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
        <AppSidebar
          activeView="database-control"
          userName={userName}
          allowUsersTools={allowUsersTools}
          onLogout={onLogout}
          onOpenDashboard={onOpenDashboard}
          onOpenClubs={onOpenClubs}
          onOpenAdminUsers={onOpenAdminUsers}
          onOpenRoteiros={onOpenRoteiros}
          onOpenGaleria={onOpenGaleria}
          onOpenClubesCompeticao={onOpenClubesCompeticao}
          onOpenProjetosFicFecom={onOpenProjetosFicFecom}
          onOpenDatabaseControl={onOpenDatabaseControl || (() => {})}
        />

        <main className="app-main-pane flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 text-center relative overflow-hidden">
            {/* Faixa decorativa no topo */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-cetecBlue to-emerald-500" />

            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-6 shadow-sm">
              <span className="material-symbols-rounded text-4xl text-amber-600">admin_panel_settings</span>
            </div>

            <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-800 inline-block mb-3">
              Acesso Restrito & Master
            </span>

            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
              Controle do Banco de Dados
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed font-medium">
              Esta área é protegida e gerencia a conexão com o Supabase, backups consolidados de ciclo e reset anual de dados.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Senha do Administrador Supremo
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="Digite a senha cadastrada no login..."
                    autoFocus
                    className="w-full px-4 py-3.5 pr-11 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    <span className="material-symbols-rounded text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2 text-left animate-shake">
                  <span className="material-symbols-rounded text-base shrink-0">error</span>
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-rounded text-lg">lock_open</span>
                <span>Acessar Painel Master</span>
              </button>

              <button
                type="button"
                onClick={onOpenDashboard}
                className="w-full py-2.5 text-xs text-slate-400 font-bold hover:text-slate-600 transition"
              >
                ← Voltar para a Visão Geral
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Tela principal desbloqueada
  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="database-control"
        userName={userName}
        allowUsersTools={allowUsersTools}
        onLogout={onLogout}
        onOpenDashboard={onOpenDashboard}
        onOpenClubs={onOpenClubs}
        onOpenAdminUsers={onOpenAdminUsers}
        onOpenRoteiros={onOpenRoteiros}
        onOpenGaleria={onOpenGaleria}
        onOpenClubesCompeticao={onOpenClubesCompeticao}
        onOpenProjetosFicFecom={onOpenProjetosFicFecom}
        onOpenDatabaseControl={onOpenDatabaseControl || (() => {})}
      />

      <main className="app-main-pane flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-y-auto relative bg-white lg:h-screen">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full relative z-10 bg-white">
          {/* Header da Tela Padronizado */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-5 sm:p-6 rounded-[2rem] border-2 border-amber-200/60 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-900/20 shrink-0">
                <span className="material-symbols-rounded text-2xl sm:text-3xl font-black">database</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded-md">
                    CONTROLE MASTER
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Conectado
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    Ciclo Anual 2026
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-cetecBlue tracking-tight">
                  Controle Geral do Banco de Dados
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold">
                  Gestão de conexões Supabase, exportação consolidada e virada anual de ciclo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                type="button"
                onClick={handleLock}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                title="Bloquear painel master"
              >
                <span className="material-symbols-rounded text-[16px]">lock</span>
                <span>Bloquear Painel</span>
              </button>
            </div>
          </div>

          {/* 4 KPIs Dinâmicos no Topo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: Status da Conexão */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-xs flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${connectionStatus.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                <span className="material-symbols-rounded text-2xl">
                  {connectionStatus.ok ? 'wifi' : 'wifi_off'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status Conexão</p>
                <p className={`text-base font-black truncate ${connectionStatus.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                  {connectionStatus.ok ? `Online (${connectionStatus.latencyMs || 0}ms)` : 'Desconectado'}
                </p>
              </div>
            </div>

            {/* KPI 2: Total de Registros */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-2xl">folder_zip</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total de Registros</p>
                <p className="text-xl font-black text-slate-800">
                  {stats.totalRegistrosGeral.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* KPI 3: Ciclo Atual */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-2xl">event_repeat</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ciclo Letivo</p>
                <p className="text-base font-black text-slate-800">
                  Ciclo 2026
                </p>
              </div>
            </div>

            {/* KPI 4: Tipo de Conexão */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-2xl">cloud_sync</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Instância Supabase</p>
                <p className="text-xs font-black text-slate-800 truncate" title={supabaseUrl}>
                  {isCustomConfig ? 'Personalizada' : 'Padrão CETEC'}
                </p>
              </div>
            </div>
          </div>

          {/* Abas de Navegação */}
          <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('conexao')}
              className={`px-5 py-3 rounded-t-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer border-b-2 ${
                activeTab === 'conexao'
                  ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-rounded text-lg">link</span>
              <span>1. Conexão com Supabase</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`px-5 py-3 rounded-t-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer border-b-2 ${
                activeTab === 'backup'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-rounded text-lg">table_chart</span>
              <span>2. Backup Completo (Excel / CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reset')}
              className={`px-5 py-3 rounded-t-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer border-b-2 ${
                activeTab === 'reset'
                  ? 'border-red-600 text-red-600 bg-red-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-rounded text-lg">restart_alt</span>
              <span>3. Virada de Ano & Reset</span>
            </button>
          </div>

          {/* Feedback de salvamento */}
          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs">
              <span className="material-symbols-rounded text-xl text-emerald-600">check_circle</span>
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 1: GERENCIAR CONEXÃO SUPABASE */}
          {/* ======================================================== */}
          {activeTab === 'conexao' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <span className="material-symbols-rounded text-amber-600">hub</span>
                      Parâmetros do Supabase
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Configure a URL do projeto e a chave anônima para direcionar o sistema para o novo banco de dados.
                    </p>
                  </div>
                  {isCustomConfig && (
                    <button
                      type="button"
                      onClick={handleResetDefaultConnection}
                      className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-rounded text-sm">undo</span>
                      Restaurar Banco Padrão CETEC
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      URL do Projeto Supabase
                    </label>
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyzproject.supabase.co"
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:border-amber-500 transition"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Encontrada no painel do Supabase em Project Settings &gt; API &gt; Project URL.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      Chave de Acesso (Publishable Key / Anon Key)
                    </label>
                    <input
                      type="text"
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      placeholder="sb_publishable_... ou eyJhbGciOi..."
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:border-amber-500 transition"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Encontrada no painel do Supabase em Project Settings &gt; API &gt; Project API keys (anon/public).
                    </p>
                  </div>
                </div>

                {/* Status da Conexão */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
                  connectionStatus.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-rounded text-xl">
                      {connectionStatus.ok ? 'check_circle' : 'info'}
                    </span>
                    <span className="text-xs font-bold">
                      {connectionStatus.message || 'Pronto para testar a conexão.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={testingConnection}
                    onClick={handleTestConnection}
                    className="px-4 py-2 rounded-xl bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {testingConnection ? (
                      <>
                        <span className="material-symbols-rounded text-sm animate-spin">refresh</span>
                        Testando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-rounded text-sm">network_check</span>
                        Testar Conexão em Tempo Real
                      </>
                    )}
                  </button>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveConnection}
                    className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-rounded text-lg">save</span>
                    Salvar Parâmetros de Conexão
                  </button>
                </div>
              </div>

              {/* Guia para Novo Banco e Script SQL */}
              <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span className="material-symbols-rounded text-blue-600">terminal</span>
                      Script SQL Inicial para Novo Banco Supabase
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Ao criar um novo banco de dados no Supabase para o novo ano, cole e execute este script no <strong>SQL Editor</strong> do Supabase para criar as tabelas e índices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-rounded text-base">
                      {sqlCopied ? 'check' : 'content_copy'}
                    </span>
                    <span>{sqlCopied ? 'Copiado!' : 'Copiar Script SQL'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono max-h-48 overflow-y-auto leading-relaxed border border-slate-800">
                  <pre>{supabaseSetupSql}</pre>
                  <pre className="hidden">
{`-- 1. Criação das Tabelas Principais do CETEC
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    acesso TEXT NOT NULL DEFAULT 'editor',
    tipo_usuario TEXT NOT NULL DEFAULT 'utec',
    utec TEXT DEFAULT '',
    ver_todas_utecs BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.clubes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    escola TEXT NOT NULL DEFAULT '',
    utec TEXT NOT NULL DEFAULT '',
    nome_utec TEXT DEFAULT '',
    prof TEXT DEFAULT '',
    estag TEXT DEFAULT '',
    dias TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    categoria TEXT NOT NULL DEFAULT 'CLUBES INICIAIS',
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube UUID NOT NULL REFERENCES public.clubes(id) ON DELETE CASCADE,
    matricula TEXT NOT NULL DEFAULT 'S/ MATRÍCULA',
    nome TEXT NOT NULL,
    sexo TEXT DEFAULT 'M' CHECK (sexo IN ('M', 'F')),
    data_registro TEXT DEFAULT to_char(now(), 'DD/MM/YYYY'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.encontros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube UUID NOT NULL REFERENCES public.clubes(id) ON DELETE CASCADE,
    modulo TEXT DEFAULT '',
    assunto TEXT NOT NULL DEFAULT '',
    detalhamento TEXT DEFAULT '',
    data TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'A FAZER',
    frequencia TEXT DEFAULT '',
    quantidade_alunos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: BACKUP E EXPORTAÇÃO COMPLETA */}
          {/* ======================================================== */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-blue-50/50 border-2 border-blue-200/70 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-900/20">
                    <span className="material-symbols-rounded text-2xl font-black">inventory_2</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">
                      Backup Consolidado de Dados Anuais
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Exportação completa e limpa de todas as tabelas em formato tabular (sem fotos nem imagens pesadas), ideal para arquivo histórico anual e auditoria.
                    </p>
                  </div>
                </div>

                {/* Grade de Contagem de Registros */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-2xl border border-blue-100 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Clubes Regulares</p>
                    <p className="text-lg font-black text-slate-800">{stats.totalClubes}</p>
                    <p className="text-[10px] text-gray-500">{stats.totalAlunos} alunos</p>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-blue-100 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Encontros</p>
                    <p className="text-lg font-black text-slate-800">{stats.totalEncontros}</p>
                    <p className="text-[10px] text-gray-500">presenças e temas</p>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-blue-100 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Clubes Competição</p>
                    <p className="text-lg font-black text-slate-800">{stats.totalClubesCompeticao}</p>
                    <p className="text-[10px] text-gray-500">{stats.totalCompetidores} competidores</p>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-blue-100 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Projetos FIC & FECOM</p>
                    <p className="text-lg font-black text-slate-800">{stats.totalProjetosFicFecom}</p>
                    <p className="text-[10px] text-gray-500">{stats.totalIntegrantesProjetos} membros</p>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-blue-100 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Usuários</p>
                    <p className="text-lg font-black text-slate-800">{stats.totalUsuarios}</p>
                    <p className="text-[10px] text-gray-500">contas registradas</p>
                  </div>
                </div>

                {exportNotice && (
                  <div className="p-3.5 rounded-2xl bg-blue-100 border border-blue-300 text-blue-900 text-xs font-bold flex items-center gap-2">
                    <span className="material-symbols-rounded text-base">info</span>
                    <span>{exportNotice}</span>
                  </div>
                )}

                {/* Botões de Ação de Backup */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
                  <button
                    type="button"
                    disabled={isExportingExcel || isExportingCsv}
                    onClick={handleExportExcel}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-900/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isExportingExcel ? (
                      <>
                        <span className="material-symbols-rounded animate-spin text-lg">refresh</span>
                        <span>Gerando Planilha Consolidada...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-rounded text-lg">table_view</span>
                        <span>Baixar Cópia Completa em Excel (.xlsx)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isExportingExcel || isExportingCsv}
                    onClick={handleExportCsv}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-black text-sm active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isExportingCsv ? (
                      <>
                        <span className="material-symbols-rounded animate-spin text-lg">refresh</span>
                        <span>Processando CSVs...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-rounded text-lg">description</span>
                        <span>Baixar Pacote de Arquivos CSV</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Detalhes sobre as abas geradas */}
              <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 space-y-3">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-rounded text-slate-600">checklist</span>
                  Estrutura das Abas Geradas no Arquivo Excel
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-600 font-medium">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>1. Clubes_Regulares:</strong> Nome, UTEC, Escola, Professor, Estagiário, Dias, Categoria e Status.
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>2. Alunos_Clubes:</strong> Nome, Clube, UTEC, Escola, Gênero (M/F) e Matrícula.
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>3. Encontros_Presencas:</strong> Clube, Módulo, Assunto, Data, Status e Quantidade de Alunos.
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>4. Clubes_Competicao:</strong> Equipe, Torneio, Nível 1/2, Escola, UTEC, Técnico e Status.
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>5. Competidores_Equipes:</strong> Aluno, Gênero, Equipe, Torneio, Escola e UTEC.
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>6. Projetos_FIC_FECOM:</strong> Título, Justificativa, Recursos, BNCC, Escola e UTEC.
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>7. Integrantes_Projetos:</strong> Nome, Série/Ano Escolar, Atribuições e Projeto.
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>8. Usuarios_Sistema:</strong> Nome, Email, Perfil de Acesso, Tipo e UTEC (sem senhas).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: VIRADA DE ANO E RESET ("COMEÇAR DO ZERO") */}
          {/* ======================================================== */}
          {activeTab === 'reset' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-red-50/40 border-2 border-red-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-900/20">
                    <span className="material-symbols-rounded text-2xl font-black">restart_alt</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">
                      Fluxo de Virada Anual & Reset de Ciclo
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Procedimento para arquivar o ano que passou e iniciar um novo ciclo letivo limpo para novos cadastros.
                    </p>
                  </div>
                </div>

                {/* Passo a Passo Recomendado */}
                <div className="p-4 rounded-2xl bg-white border border-red-200 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Passo a Passo Recomendado para o Fim de Ano:
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 font-medium">
                    <li>
                      <strong>Passo 1: Fazer download do backup em Excel:</strong> Acesse a aba 2 e baixe a planilha com todas as abas consolidadas.
                    </li>
                    <li>
                      <strong>Passo 2: Criar novo banco no Supabase (Opcional):</strong> Se preferir um banco novo a cada ano, crie um novo projeto no Supabase, copie o script SQL na aba 1 e aponte a URL e Chave.
                    </li>
                    <li>
                      <strong>Passo 3: Reset do Ciclo:</strong> Digite a confirmação abaixo para limpar as coleções anuais e iniciar o ciclo zerado para os novos registros.
                    </li>
                  </ol>
                </div>

                {resetResult && (
                  <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                    resetResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <span className="material-symbols-rounded text-lg">
                      {resetResult.success ? 'check_circle' : 'error'}
                    </span>
                    <span>{resetResult.message}</span>
                  </div>
                )}

                {/* Caixa de Confirmação Segura */}
                <div className="p-5 rounded-2xl bg-white border-2 border-red-300 space-y-3">
                  <div className="flex items-center gap-2 text-red-600 font-black text-xs sm:text-sm">
                    <span className="material-symbols-rounded text-lg">warning</span>
                    <span>Confirmação de Segurança Requerida</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Para evitar exclusões acidentais, digite a frase <code className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-black">RESETAR CICLO 2026</code> no campo abaixo:
                  </p>
                  <input
                    type="text"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder="RESETAR CICLO 2026"
                    className="w-full px-4 py-3 bg-red-50/50 border-2 border-red-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:border-red-500 transition"
                  />

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={resetting || resetConfirmText.trim().toUpperCase() !== 'RESETAR CICLO 2026'}
                      onClick={handleExecuteReset}
                      className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-md shadow-red-900/20 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-rounded text-lg">delete_sweep</span>
                      <span>Executar Reset do Ciclo Anual</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
