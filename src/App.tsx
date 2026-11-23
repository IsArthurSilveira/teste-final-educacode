import { useCallback, useEffect, useMemo, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ClubFormModal } from './components/ClubFormModal';
import { useClubes } from './hooks/useClubes';
import { DashboardPage } from './pages/DashboardPage';
import { ClubsPanelPage } from './pages/ClubsPanelPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { ClubFormPage } from './pages/ClubFormPage';
import { AdminDeleteClubsPage } from './pages/AdminDeleteClubsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { RoteirosPage } from './pages/RoteirosPage';
import { GaleriaPage } from './pages/GaleriaPage';
import { ClubesCompeticaoPage } from './pages/ClubesCompeticaoPage';
import { ProjetosFicFecomPage } from './pages/ProjetosFicFecomPage';
import { DatabaseControlPage } from './pages/DatabaseControlPage';
import { LoginPageRoute } from './pages/LoginPageRoute';
import { AUTH_EXPIRED_EVENT, apiGet, apiPost, clearSessionToken, getSessionToken, logoutSession, validateSession } from './services/api';
import type { ApiBaseResponse } from './services/api';
import { pickField } from './utils/clubes';
import {
  USER_ROLE_STORAGE_KEY,
  USER_UTEC_SCOPE_STORAGE_KEY,
  USER_VIEW_ALL_UTECS_STORAGE_KEY,
  canAccessDatabase,
  canCreateClub,
  canDeleteClub,
  canManageUsers,
  isAnyAdmin,
  normalizeAccessLevel,
  resolveUserScope,
} from './utils/permissions';

interface AuthLoginPayload {
  name: string;
  access: string;
  token?: string;
  tipoUsuario?: string;
  utec?: string;
  verTodasUtecs?: boolean;
}

interface ClubFormValues {
  nome: string;
  escola: string;
  utec: string;
  prof: string;
  estag: string;
  dias: string;
  horario: string;
  categoria: string;
}

interface UtecOption {
  value: string;
  label: string;
}

interface AdminUser {
  id: string;
  nome: string;
  email: string;
  acesso: string;
  tipoUsuario: string;
  utec: string;
  verTodasUtecs: boolean;
}

interface AuthContextValue {
  userName: string;
  login: (payload: AuthLoginPayload) => void;
  logout: () => Promise<void>;
}

function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

function AppRoutes() {
  const [userName, setUserName] = useState(localStorage.getItem('usuarioLogado') || '');
  const [userRole, setUserRole] = useState(() => normalizeAccessLevel(localStorage.getItem(USER_ROLE_STORAGE_KEY) || 'editor'));
  const [userUtecScope, setUserUtecScope] = useState(localStorage.getItem(USER_UTEC_SCOPE_STORAGE_KEY) || '');
  const [userCanSeeAllUtecs, setUserCanSeeAllUtecs] = useState(() => localStorage.getItem(USER_VIEW_ALL_UTECS_STORAGE_KEY) === 'true');
  const [sessionChecked, setSessionChecked] = useState(false);
  const [newClubModalOpen, setNewClubModalOpen] = useState(false);
  const [newClubSaving, setNewClubSaving] = useState(false);
  const [newClubModalError, setNewClubModalError] = useState('');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState('');
  const [utecs, setUtecs] = useState<Array<{ id: string; nome: string }>>([]);
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const resolvedUtecScope = userCanSeeAllUtecs ? '' : userUtecScope;
  const {
    clubes,
    loading,
    error,
    details,
    genderStats,
    detailsLoading,
    detailsError,
    loadClubes,
    loadClubDetails,
    saveClub,
    saveAluno,
    deleteAluno,
    saveEncontro,
    deleteEncontro,
    updateStatus,
  } = useClubes({
    userName,
    utecScope: resolvedUtecScope,
    canViewAllUtecs: userCanSeeAllUtecs,
  });
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const token = getSessionToken();
      if (!userName || !token) {
        if (!cancelled) setSessionChecked(true);
        return;
      }

      const session = await validateSession();
      if (cancelled) return;

      if (!session?.sucesso) {
        clearSessionToken();
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem(USER_ROLE_STORAGE_KEY);
        localStorage.removeItem(USER_UTEC_SCOPE_STORAGE_KEY);
        localStorage.removeItem(USER_VIEW_ALL_UTECS_STORAGE_KEY);
        setUserName('');
        setUserRole('editor');
        setUserUtecScope('');
        setUserCanSeeAllUtecs(false);
        navigate('/login', { replace: true });
        setSessionChecked(true);
        return;
      }

      if (session?.nome) setUserName(session.nome);
      if (session?.acesso) {
        const normalizedRole = normalizeAccessLevel(session.acesso);
        localStorage.setItem(USER_ROLE_STORAGE_KEY, normalizedRole);
        setUserRole(normalizedRole);
      }

      const scope = resolveUserScope(session);
      localStorage.setItem(USER_UTEC_SCOPE_STORAGE_KEY, scope.utecScope);
      localStorage.setItem(USER_VIEW_ALL_UTECS_STORAGE_KEY, String(scope.verTodasUtecs));
      setUserUtecScope(scope.utecScope);
      setUserCanSeeAllUtecs(scope.verTodasUtecs);

      setSessionChecked(true);
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [navigate, userName]);

  useEffect(() => {
    function handleAuthExpired() {
      localStorage.removeItem('usuarioLogado');
      localStorage.removeItem(USER_ROLE_STORAGE_KEY);
      localStorage.removeItem(USER_UTEC_SCOPE_STORAGE_KEY);
      localStorage.removeItem(USER_VIEW_ALL_UTECS_STORAGE_KEY);
      setUserName('');
      setUserRole('editor');
      setUserUtecScope('');
      setUserCanSeeAllUtecs(false);
      navigate('/login', { replace: true });
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, [navigate]);

  const normalizedRole = normalizeAccessLevel(userRole);
  const allowCreateClub = canCreateClub(normalizedRole);
  const allowAdminTools = isAnyAdmin(normalizedRole);
  const allowUsersTools = canManageUsers(normalizedRole);
  const utecOptions = useMemo(() => {
    const allOptions = utecs.map((utec) => ({ value: String(utec.id), label: utec.nome }));
    if (userCanSeeAllUtecs || !resolvedUtecScope) return allOptions;
    const scope = String(resolvedUtecScope).trim().toLowerCase();
    return allOptions.filter((option) => option.value === scope || option.label.trim().toLowerCase() === scope);
  }, [utecs, resolvedUtecScope, userCanSeeAllUtecs]);
  const loadUtecs = useCallback(async () => {
    try {
      const response = await apiGet<unknown>({ acao: 'listar_utecs', _t: Date.now() });
      setUtecs(Array.isArray(response) ? response as Array<{ id: string; nome: string }> : []);
    } catch {
      setUtecs([]);
    }
  }, []);
  const loadAdminUsers = useCallback(async () => {
    if (!allowUsersTools) return;

    setAdminUsersLoading(true);
    setAdminUsersError('');

    try {
      const response = await apiGet<unknown>({ acao: 'listar_usuarios', _t: Date.now() });
      setAdminUsers(extractAdminUsers(response));
    } catch {
      setAdminUsers([]);
      setAdminUsersError('Não foi possível carregar os usuários.');
    } finally {
      setAdminUsersLoading(false);
    }
  }, [allowUsersTools]);
  const loadAdminManagementData = useCallback(async () => {
    if (!allowUsersTools) return;
    try {
      const [utecResponse, auditResponse] = await Promise.all([
        apiGet<unknown>({ acao: 'listar_utecs', _t: Date.now() }),
        apiGet<unknown>({ acao: 'listar_auditoria', _t: Date.now() }),
      ]);
      setUtecs(Array.isArray(utecResponse) ? utecResponse as Array<{ id: string; nome: string }> : []);
      setAuditEntries(Array.isArray(auditResponse) ? auditResponse : []);
    } catch {
      setUtecs([]);
      setAuditEntries([]);
    }
  }, [allowUsersTools]);

  useEffect(() => {
    if (userName && sessionChecked) {
      loadClubes();
      loadUtecs();
    }
  }, [userName, sessionChecked, loadClubes, loadUtecs, resolvedUtecScope, userCanSeeAllUtecs]);

  useEffect(() => {
    if (userName && sessionChecked && allowUsersTools) {
      loadAdminUsers();
      loadAdminManagementData();
    }
  }, [userName, sessionChecked, allowUsersTools, loadAdminUsers, loadAdminManagementData]);

  const auth = useMemo<AuthContextValue>(() => ({
    userName,
    login: ({ name, access, tipoUsuario, utec, verTodasUtecs }: AuthLoginPayload) => {
      localStorage.setItem('usuarioLogado', name);
      localStorage.setItem(USER_ROLE_STORAGE_KEY, normalizeAccessLevel(access));
      const scope = resolveUserScope({ nome: name, tipo_usuario: tipoUsuario, utec, ver_todas_utecs: verTodasUtecs });
      localStorage.setItem(USER_UTEC_SCOPE_STORAGE_KEY, scope.utecScope);
      localStorage.setItem(USER_VIEW_ALL_UTECS_STORAGE_KEY, String(scope.verTodasUtecs));
      setUserName(name);
      setUserRole(normalizeAccessLevel(access));
      setUserUtecScope(scope.utecScope);
      setUserCanSeeAllUtecs(scope.verTodasUtecs);
      setSessionChecked(true);
      navigate('/dashboard', { replace: true });
    },
    logout: async () => {
      await logoutSession();
      localStorage.removeItem('usuarioLogado');
      localStorage.removeItem(USER_ROLE_STORAGE_KEY);
      localStorage.removeItem(USER_UTEC_SCOPE_STORAGE_KEY);
      localStorage.removeItem(USER_VIEW_ALL_UTECS_STORAGE_KEY);
      setUserName('');
      setUserRole('editor');
      setUserUtecScope('');
      setUserCanSeeAllUtecs(false);
      setSessionChecked(true);
      navigate('/login', { replace: true });
    },
  }), [navigate, userName]);

  function openNewClubModal() {
    if (!allowCreateClub) return;
    setNewClubModalError('');
    setNewClubModalOpen(true);
  }

  async function handleCreateClub(form: ClubFormValues) {
    setNewClubSaving(true);
    setNewClubModalError('');
    try {
      const result = await saveClub({ acao: 'salvar_clube', ...form, status: 'pendente' });
      if (result?.sucesso) {
        setNewClubModalOpen(false);
        await loadClubes();
        return;
      }

      setNewClubModalError(getActionError(result, 'Não foi possível salvar o clube.'));
    } catch {
      setNewClubModalError('Não foi possível salvar o clube.');
    } finally {
      setNewClubSaving(false);
    }
  }

  async function handleDeleteClub(payload: Record<string, unknown>) {
    return apiPost<ApiBaseResponse>(payload);
  }

  async function handleSaveUser(payload: Record<string, unknown>) {
    return apiPost<ApiBaseResponse>(payload);
  }

  async function handleDeleteUser(payload: Record<string, unknown>) {
    return apiPost<ApiBaseResponse>(payload);
  }

  async function refreshAdminUsers() {
    await loadAdminUsers();
  }

  if (!sessionChecked && userName) {
    return null;
  }

  if (!userName) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPageRoute userName={userName} onLogin={auth.login} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={(
            <DashboardPage
              userName={auth.userName}
              allowCreateClub={allowCreateClub}
              allowAdminTools={allowAdminTools}
              allowUsersTools={allowUsersTools}
              onLogout={auth.logout}
              onOpenNewClubModal={openNewClubModal}
              onOpenAdminDeleteClubs={() => navigate('/admin/excluir-clubes')}
              onOpenAdminUsers={() => navigate('/admin/usuarios')}
              clubes={clubes}
              genderStats={genderStats}
              loading={loading}
              error={error}
            />
          )}
        />
        <Route
          path="/clubes"
          element={(
            <ClubsPanelPage
              userName={auth.userName}
              allowCreateClub={allowCreateClub}
              allowAdminTools={allowAdminTools}
              allowUsersTools={allowUsersTools}
              onLogout={auth.logout}
              onOpenNewClubModal={openNewClubModal}
              onOpenAdminDeleteClubs={() => navigate('/admin/excluir-clubes')}
              onOpenAdminUsers={() => navigate('/admin/usuarios')}
              onDeleteClub={handleDeleteClub}
              onRefreshClubs={loadClubes}
              clubes={clubes}
              loading={loading}
              error={error}
              onSaveClub={saveClub}
              utecOptions={utecOptions as never[]}
            />
          )}
        />
        <Route path="/clubes/novo" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/clubes/:clubId/editar"
          element={(
            <ClubFormPage
              userRole={normalizedRole}
              clubes={clubes}
              utecOptions={utecOptions as never[]}
              utecScope={resolvedUtecScope}
              canViewAllUtecs={userCanSeeAllUtecs}
              onSaveClub={saveClub}
            />
          )}
        />
        <Route
          path="/admin/excluir-clubes"
          element={
            canDeleteClub(normalizedRole) ? (
              <AdminDeleteClubsPage
                userName={auth.userName}
                userRole={normalizedRole}
                allowAdminTools={allowAdminTools}
                allowUsersTools={allowUsersTools}
                onLogout={auth.logout}
                onOpenDashboard={() => navigate('/dashboard')}
                onOpenClubs={() => navigate('/clubes')}
                onOpenRoteiros={() => navigate('/roteiros')}
                onOpenGaleria={() => navigate('/galeria')}
                onOpenClubesCompeticao={() => navigate('/clubes-competicao')}
                onOpenProjetosFicFecom={() => navigate('/projetos-fic-fecom')}
                onOpenDatabaseControl={() => navigate('/admin/banco-de-dados')}
                onOpenNewClub={openNewClubModal}
                onOpenAdminDeleteClubs={() => navigate('/admin/excluir-clubes')}
                onOpenAdminUsers={() => navigate('/admin/usuarios')}
                clubes={clubes}
                loading={loading}
                error={error}
                onDeleteClub={handleDeleteClub}
                onRefreshClubs={loadClubes}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            canManageUsers(normalizedRole) ? (
              <AdminUsersPage
                userName={auth.userName}
                userRole={normalizedRole}
                allowAdminTools={allowAdminTools}
                allowUsersTools={allowUsersTools}
                onLogout={auth.logout}
                onOpenDashboard={() => navigate('/dashboard')}
                onOpenClubs={() => navigate('/clubes')}
                onOpenRoteiros={() => navigate('/roteiros')}
                onOpenGaleria={() => navigate('/galeria')}
                onOpenClubesCompeticao={() => navigate('/clubes-competicao')}
                onOpenProjetosFicFecom={() => navigate('/projetos-fic-fecom')}
                onOpenDatabaseControl={() => navigate('/admin/banco-de-dados')}
                onOpenNewClub={openNewClubModal}
                onOpenAdminDeleteClubs={() => navigate('/admin/excluir-clubes')}
                onOpenAdminUsers={() => navigate('/admin/usuarios')}
                usuarios={adminUsers as never[]}
                usuariosLoading={adminUsersLoading}
                usuariosError={adminUsersError}
                onRefreshUsuarios={refreshAdminUsers}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
                utecs={utecs}
                auditoria={auditEntries}
                onSaveUtec={async (payload) => {
                  const result = await apiPost<ApiBaseResponse>(payload);
                  await loadAdminManagementData();
                  return result;
                }}
                onDeleteUtec={async (payload) => {
                  const result = await apiPost<ApiBaseResponse>(payload);
                  await loadAdminManagementData();
                  return result;
                }}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/roteiros"
          element={(
            <RoteirosPage
              userName={auth.userName}
              userRole={normalizedRole}
              allowAdminTools={allowAdminTools}
              allowUsersTools={allowUsersTools}
              onLogout={auth.logout}
              onOpenDashboard={() => navigate('/dashboard')}
              onOpenClubs={() => navigate('/clubes')}
              onOpenRoteiros={() => navigate('/roteiros')}
              onOpenGaleria={() => navigate('/galeria')}
              onOpenClubesCompeticao={() => navigate('/clubes-competicao')}
              onOpenProjetosFicFecom={() => navigate('/projetos-fic-fecom')}
              onOpenDatabaseControl={() => navigate('/admin/banco-de-dados')}
              onOpenNewClub={openNewClubModal}
              onOpenAdminDeleteClubs={() => navigate('/admin/excluir-clubes')}
              onOpenAdminUsers={() => navigate('/admin/usuarios')}
            />
          )}
        />
        <Route
          path="/galeria"
          element={(
            <GaleriaPage
              userName={auth.userName}
              userRole={normalizedRole}
              allowAdminTools={allowAdminTools}
              allowUsersTools={allowUsersTools}
              clubes={clubes}
              onLogout={auth.logout}
              onOpenDashboard={() => navigate('/dashboard')}
              onOpenClubs={() => navigate('/clubes')}
              onOpenRoteiros={() => navigate('/roteiros')}
              onOpenGaleria={() => navigate('/galeria')}
              onOpenClubesCompeticao={() => navigate('/clubes-competicao')}
              onOpenProjetosFicFecom={() => navigate('/projetos-fic-fecom')}
              onOpenDatabaseControl={() => navigate('/admin/banco-de-dados')}
              onOpenNewClub={openNewClubModal}
              onOpenAdminDeleteClubs={() => navigate('/admin/excluir-clubes')}
              onOpenAdminUsers={() => navigate('/admin/usuarios')}
            />
          )}
        />
        <Route
          path="/clubes-competicao"
          element={(
            <ClubesCompeticaoPage
              userName={auth.userName}
              userRole={normalizedRole}
              allowAdminTools={allowAdminTools}
              allowUsersTools={allowUsersTools}
              onLogout={auth.logout}
              onOpenDashboard={() => navigate('/dashboard')}
              onOpenClubs={() => navigate('/clubes')}
              onOpenRoteiros={() => navigate('/roteiros')}
              onOpenGaleria={() => navigate('/galeria')}
              onOpenClubesCompeticao={() => navigate('/clubes-competicao')}
              onOpenProjetosFicFecom={() => navigate('/projetos-fic-fecom')}
              onOpenDatabaseControl={() => navigate('/admin/banco-de-dados')}
              onOpenNewClub={openNewClubModal}
              onOpenAdminDeleteClubs={() => navigate('/admin/excluir-clubes')}
              onOpenAdminUsers={() => navigate('/admin/usuarios')}
              utecOptions={utecOptions as never[]}
              utecScope={resolvedUtecScope}
              canViewAllUtecs={userCanSeeAllUtecs}
            />
          )}
        />
        <Route
          path="/projetos-fic-fecom"
          element={(
            <ProjetosFicFecomPage
              userName={auth.userName}
              userRole={normalizedRole}
              allowAdminTools={allowAdminTools}
              allowUsersTools={allowUsersTools}
              onLogout={auth.logout}
              onOpenDashboard={() => navigate('/dashboard')}
              onOpenClubs={() => navigate('/clubes')}
              onOpenRoteiros={() => navigate('/roteiros')}
              onOpenGaleria={() => navigate('/galeria')}
              onOpenClubesCompeticao={() => navigate('/clubes-competicao')}
              onOpenProjetosFicFecom={() => navigate('/projetos-fic-fecom')}
              onOpenDatabaseControl={() => navigate('/admin/banco-de-dados')}
              onOpenNewClub={openNewClubModal}
              onOpenAdminDeleteClubs={() => navigate('/admin/excluir-clubes')}
              onOpenAdminUsers={() => navigate('/admin/usuarios')}
              utecOptions={utecOptions as never[]}
              utecScope={resolvedUtecScope}
              canViewAllUtecs={userCanSeeAllUtecs}
            />
          )}
        />
        <Route
          path="/admin/banco-de-dados"
          element={
            canAccessDatabase(normalizedRole) ? (
              <DatabaseControlPage
                userName={auth.userName}
                userRole={normalizedRole}
                allowAdminTools={allowAdminTools}
                allowUsersTools={allowUsersTools}
                onLogout={auth.logout}
                onOpenDashboard={() => navigate('/dashboard')}
                onOpenClubs={() => navigate('/clubes')}
                onOpenRoteiros={() => navigate('/roteiros')}
                onOpenGaleria={() => navigate('/galeria')}
                onOpenClubesCompeticao={() => navigate('/clubes-competicao')}
                onOpenProjetosFicFecom={() => navigate('/projetos-fic-fecom')}
                onOpenDatabaseControl={() => navigate('/admin/banco-de-dados')}
                onOpenNewClub={openNewClubModal}
                onOpenAdminDeleteClubs={() => navigate('/admin/excluir-clubes')}
                onOpenAdminUsers={() => navigate('/admin/usuarios')}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/clubes/:clubId"
          element={(
            <ClubDetailPage
              userName={auth.userName}
              userRole={normalizedRole}
              allowAdminTools={allowAdminTools}
              allowUsersTools={allowUsersTools}
              onLogout={auth.logout}
              onOpenNewClubModal={openNewClubModal}
              onOpenAdminDeleteClubs={() => navigate('/admin/excluir-clubes')}
              onOpenAdminUsers={() => navigate('/admin/usuarios')}
              clubes={clubes}
              details={details}
              detailsLoading={detailsLoading}
              detailsError={detailsError}
              onLoadDetails={loadClubDetails}
              onRefresh={loadClubes}
              onSaveClub={saveClub}
              onSaveAluno={saveAluno}
              onDeleteAluno={deleteAluno}
              onSaveEncontro={saveEncontro}
              onDeleteEncontro={deleteEncontro}
              onUpdateStatus={updateStatus}
            />
          )}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <ClubFormModal
        key={newClubModalOpen ? 'new-open' : 'new-closed'}
        open={newClubModalOpen}
        title="Adicionar Novo Clube"
        utecOptions={utecOptions as never[]}
        lockedUtec={resolvedUtecScope}
        showUtecPlaceholder={userCanSeeAllUtecs}
        onClose={() => setNewClubModalOpen(false)}
        onSubmit={handleCreateClub}
        saving={newClubSaving}
        error={newClubModalError}
      />
    </>
  );
}

function extractAdminUsers(payload: unknown): AdminUser[] {
  const rows = extractRows(payload);
  return rows.map(normalizeAdminUser).filter((user) => user.nome || user.email || user.id);
}

function extractRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const data = payload as Record<string, unknown>;
  for (const key of ['dados', 'data', 'rows', 'itens', 'items', 'usuarios', 'users', 'result', 'resultado']) {
    const value = data[key];
    if (Array.isArray(value)) return value;
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

function normalizeAdminUser(raw: unknown): AdminUser {
  return {
    id: String(pickField(raw, ['ID', 'id', 'ID_Usuario', 'id_usuario', 'IDUSUARIO', 'idusuario'], '') || '').trim(),
    nome: String(pickField(raw, ['NOME', 'Nome', 'nome', 'USUARIO', 'usuario'], '') || '').trim(),
    email: String(pickField(raw, ['EMAIL', 'Email', 'email', 'E-MAIL', 'e-mail'], '') || '').trim(),
    acesso: String(pickField(raw, ['ACESSO', 'Acesso', 'acesso', 'PERFIL', 'perfil', 'ROLE', 'role'], 'editor') || '').trim(),
    tipoUsuario: String(pickField(raw, ['TIPO_USUARIO', 'tipo_usuario', 'tipoUsuario', 'TIPO', 'tipo'], '') || '').trim(),
    utec: String(pickField(raw, ['UTEC', 'utec', 'ID_UTEC', 'id_utec', 'UTEC_SCOPE', 'utecScope'], '') || '').trim(),
    verTodasUtecs: Boolean(pickField(raw, ['VER_TODAS_UTECS', 'ver_todas_utecs', 'ver_todas_utec', 'verTodasUtecs'], false)),
  };
}

function getActionError(response: ApiBaseResponse | unknown, fallback: string): string {
  if (!response || typeof response !== 'object') return fallback;
  const result = response as ApiBaseResponse;
  return String(result.erro || result.mensagem || result.message || fallback);
}

function buildUtecOptions(clubes: Array<{ utec?: string; nomeUtec?: string }>, canViewAllUtecs: boolean, utecScope: string): UtecOption[] {
  const normalize = (value: unknown) => String(value || '').trim().toUpperCase();
  const normalizeKey = (value: unknown) => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');

  if (canViewAllUtecs) {
    const options = new Map<string, UtecOption>();

    clubes.forEach((clube) => {
      const value = normalize(clube.utec || (clube as { id_utec?: string }).id_utec);
      if (!value) return;

      const nome = String(clube.nomeUtec || '').trim();
      const label = nome || 'UTEC sem nome';
      const key = normalizeKey(value);
      if (!options.has(key)) {
        options.set(key, { value, label });
      }
    });

    return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));
  }

  const scopedValue = normalize(utecScope);
  if (!scopedValue) return [];

  const scopedClub = clubes.find((clube) => normalizeKey(clube.utec || (clube as { id_utec?: string }).id_utec) === normalizeKey(scopedValue));
  const value = scopedClub?.utec ? normalize(scopedClub.utec) : scopedClub && (scopedClub as { id_utec?: string }).id_utec ? normalize((scopedClub as { id_utec?: string }).id_utec) : scopedValue;
  const labelBase = scopedClub?.nomeUtec ? String(scopedClub.nomeUtec).trim() : 'UTEC sem nome';

  return [{ value, label: labelBase }];
}

export default App;
