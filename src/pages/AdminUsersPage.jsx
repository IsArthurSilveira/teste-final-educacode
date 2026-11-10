import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { ConfirmPasswordModal } from '../components/ui/ConfirmPasswordModal';
import { BaseModal } from '../components/ui/BaseModal';
import { FormSelect } from '../components/ui/FormSelect';
import { FormTextInput } from '../components/ui/FormTextInput';
import { ModalActionRow } from '../components/ui/ModalActionRow';
import {
  accessLabel,
  canManageTargetUser,
  canManageUsers as canManageUsersFn,
  getAllowedAssignableRoles,
  isAnyAdmin,
  normalizeAccessLevel,
} from '../utils/permissions';

const EMPTY_FORM = {
  nome: '',
  email: '',
  senha: '',
  acesso: 'editor',
  utec: '',
};

export function AdminUsersPage({
  userName,
  userRole,
  allowAdminTools,
  allowUsersTools = false,
  onLogout,
  onOpenDashboard,
  onOpenClubs,
  onOpenRoteiros,
  onOpenGaleria,
  onOpenClubesCompeticao,
  onOpenProjetosFicFecom,
  onOpenDatabaseControl,
  onOpenNewClub,
  onOpenAdminDeleteClubs,
  onOpenAdminUsers,
  utecOptions,
  usuarios = [],
  usuariosLoading = false,
  usuariosError = '',
  onRefreshUsuarios,
  onSaveUser,
  onDeleteUser,
  utecs = [],
  auditoria = [],
  onSaveUtec,
  onDeleteUtec,
}) {
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('usuarios');
  const [editingUser, setEditingUser] = useState(null);
  const [utecName, setUtecName] = useState('');
  const [editingUtec, setEditingUtec] = useState(null);
  const [utecError, setUtecError] = useState('');

  const canManage = canManageUsersFn(userRole);
  const allowedAssignableRoles = useMemo(() => getAllowedAssignableRoles(userRole), [userRole]);
  const options = useMemo(() => (Array.isArray(utecOptions) ? utecOptions : []), [utecOptions]);
  const managedUtecOptions = useMemo(
    () => (Array.isArray(utecs) ? utecs.map((utec) => ({ value: String(utec.id), label: utec.nome })) : options),
    [utecs, options],
  );
  const normalizedSearch = search.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return usuarios.filter((user) => {
      const access = normalizeAccessLevel(user.acesso || user.tipoUsuario || user.tipo_usuario);
      const userIsGlobal = Boolean(user.verTodasUtecs) || String(user.tipoUsuario || '').toLowerCase() === 'global' || isAnyAdmin(access);
      if (!matchQuickFilter(quickFilter, access, userIsGlobal)) return false;

      if (!normalizedSearch) return true;

      return [user.nome, user.email, user.utec, user.tipoUsuario, user.acesso]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(normalizedSearch));
    });
  }, [usuarios, quickFilter, normalizedSearch]);

  if (!allowUsersTools && !canManage) {
    return <Navigate to="/dashboard" replace />;
  }

  function openAddModal() {
    setError('');
    setSuccess('');
    setShowAddModal(true);
    const initialRole = allowedAssignableRoles[0]?.value || 'editor';
    setForm({
      ...EMPTY_FORM,
      acesso: initialRole,
      utec: initialRole === 'editor' ? (managedUtecOptions[0]?.value || '') : '',
    });
    setEditingUser(null);
  }

  function openEditModal(user) {
    setError('');
    setSuccess('');
    setEditingUser(user);
    setShowAddModal(true);
    setForm({
      nome: user.nome || '',
      email: user.email || '',
      senha: '',
      acesso: normalizeAccessLevel(user.acesso || user.tipoUsuario || 'editor'),
      utec: String(user.id_utec || user.utec || ''),
    });
  }

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === 'acesso') {
        const isGlobal = isAnyAdmin(value);
        if (isGlobal) {
          next.utec = '';
        } else if (!next.utec) {
          next.utec = managedUtecOptions[0]?.value || '';
        }
      }

      if (field === 'utec' && isAnyAdmin(current.acesso)) {
        next.utec = '';
      }

      return next;
    });
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const isGlobalUser = isAnyAdmin(form.acesso);
      const payload = {
        acao: 'salvar_usuario',
        nome: String(form.nome || '').trim(),
        email: String(form.email || '').trim(),
        senha: String(form.senha || '').trim(),
        acesso: form.acesso,
        tipo_usuario: isGlobalUser ? 'global' : 'utec',
        ver_todas_utecs: isGlobalUser,
        id_utec: isGlobalUser ? null : form.utec || null,
        id: editingUser?.id,
      };

      let result = await onSaveUser(payload);
      if (!result?.sucesso) {
        result = await onSaveUser({ ...payload, acao: 'cadastrar_usuario' });
      }

      if (result?.sucesso) {
        setShowAddModal(false);
        setForm(EMPTY_FORM);
        setSuccess(editingUser ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.');
        if (onRefreshUsuarios) await onRefreshUsuarios();
        return;
      }

      setError(String(result?.erro || result?.mensagem || 'Não foi possível salvar o usuário.'));
    } catch {
      setError('Não foi possível salvar o usuário.');
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(user) {
    setDeleteError('');
    setPendingDelete(user);
  }

  async function handleConfirmDelete(password) {
    if (!pendingDelete?.id) return;

    setDeleteSaving(true);
    setDeleteError('');

    try {
      let response = await onDeleteUser({ acao: 'remover_usuario', id_usuario: pendingDelete.id, senha: password });
      if (!response?.sucesso) {
        response = await onDeleteUser({ acao: 'excluir_usuario', id_usuario: pendingDelete.id, senha: password });
      }

      if (response?.sucesso) {
        setPendingDelete(null);
        if (onRefreshUsuarios) await onRefreshUsuarios();
        return;
      }

      setDeleteError(String(response?.erro || response?.mensagem || 'Não foi possível excluir o usuário.'));
    } catch {
      setDeleteError('Não foi possível excluir o usuário.');
    } finally {
      setDeleteSaving(false);
    }

  }

  async function handleSaveUtec(event) {
      event.preventDefault();
      setUtecError('');
      const nome = utecName.trim();
      if (!nome || !onSaveUtec) return;
      const result = await onSaveUtec({ acao: 'salvar_utec', id: editingUtec?.id, nome });
      if (result?.sucesso) {
        setUtecName('');
        setEditingUtec(null);
      } else {
        setUtecError(String(result?.erro || result?.mensagem || 'Não foi possível salvar a UTEC.'));
      }
  }

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="admin-users"
        userName={userName}
        allowCreateClub={true}
        allowAdminTools={allowAdminTools}
        allowUsersTools={allowUsersTools}
        onLogout={onLogout}
        onOpenDashboard={onOpenDashboard}
        onOpenClubs={onOpenClubs}
        onOpenRoteiros={onOpenRoteiros}
        onOpenGaleria={onOpenGaleria}
        onOpenClubesCompeticao={onOpenClubesCompeticao}
        onOpenProjetosFicFecom={onOpenProjetosFicFecom}
        onOpenDatabaseControl={onOpenDatabaseControl}
        onOpenNewClub={onOpenNewClub}
        onOpenAdminDeleteClubs={onOpenAdminDeleteClubs}
        onOpenAdminUsers={onOpenAdminUsers}
      />

      <main className="app-main-pane flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-y-auto relative bg-white lg:h-screen">
        <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full relative z-10 bg-white">
          {/* Header da Tela Padronizado */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-emerald-500/5 to-transparent p-5 sm:p-6 rounded-[2rem] border-2 border-blue-200/60 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cetecBlue to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
                <span className="material-symbols-rounded text-2xl sm:text-3xl font-black">manage_accounts</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-cetecBlue tracking-tight">
                  Gerenciamento do Sistema
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold">
                  Usuários, UTECs, auditoria e permissões de acesso ao painel
                </p>
              </div>
            </div>

            {canManage && activeSection === 'usuarios' && (
              <button
                type="button"
                onClick={openAddModal}
                className="btn-3d self-start md:self-center px-5 py-3 rounded-2xl bg-cetecGreen text-white font-black text-xs sm:text-sm flex items-center gap-2 border-b-[5px] border-cetecGreenDark hover:bg-[#7ed152] active:scale-95 transition cursor-pointer shadow-md shadow-emerald-900/20"
              >
                <span className="material-symbols-rounded text-lg">person_add</span>
                <span>+ NOVO USUÁRIO</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {[
              ['usuarios', 'Contas e Usuários', 'manage_accounts'],
              ['utecs', 'UTECs', 'apartment'],
              ['auditoria', 'Auditoria', 'history'],
            ].map(([value, label, icon]) => (
              <button type="button" key={value} onClick={() => setActiveSection(value)} className={`dashboard-filter-chip ${activeSection === value ? 'is-active' : ''}`}>
                <span className="material-symbols-rounded">{icon}</span>{label}
              </button>
            ))}
          </div>

          {activeSection === 'utecs' && (
            <section className="space-y-4">
              <form onSubmit={handleSaveUtec} className="flex flex-col sm:flex-row gap-2">
                <input value={utecName} onChange={(event) => setUtecName(event.target.value)} placeholder="Nome da UTEC" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-bold" required />
                <button type="submit" className="btn-3d bg-cetecGreen text-white font-black px-5 py-3 rounded-xl">{editingUtec ? 'ATUALIZAR' : 'CADASTRAR UTEC'}</button>
                {editingUtec && <button type="button" onClick={() => { setEditingUtec(null); setUtecName(''); }} className="px-4 py-3 rounded-xl bg-gray-200 font-bold">CANCELAR</button>}
              </form>
              {utecError && <p className="text-red-600 font-bold">{utecError}</p>}
              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left"><th className="p-3">ID</th><th className="p-3">Nome</th><th className="p-3">Ações</th></tr></thead><tbody>
                  {utecs.map((utec) => (
                    <tr key={utec.id} className="border-t"><td className="p-3">{utec.id}</td><td className="p-3 font-bold">{utec.nome}</td><td className="p-3 flex gap-2"><button type="button" onClick={() => { setEditingUtec(utec); setUtecName(utec.nome); }} className="text-blue-700 font-bold">Editar</button><button type="button" onClick={async () => { if (onDeleteUtec) await onDeleteUtec({ acao: 'excluir_utec', id: utec.id }); }} className="text-red-600 font-bold">Excluir</button></td></tr>
                  ))}</tbody></table>
              </div>
            </section>
          )}

          {activeSection === 'auditoria' && (
            <section className="overflow-x-auto border rounded-2xl">
              <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left"><th className="p-3">Data</th><th className="p-3">Usuário</th><th className="p-3">Ação</th><th className="p-3">Tabela</th><th className="p-3">Registro</th><th className="p-3">Detalhes</th></tr></thead><tbody>
                {auditoria.map((entry) => <tr key={entry.id} className="border-t"><td className="p-3 whitespace-nowrap">{entry.created_at ? new Date(entry.created_at).toLocaleString('pt-BR') : '-'}</td><td className="p-3">{entry.usuario_nome || '-'}</td><td className="p-3 font-bold">{entry.acao}</td><td className="p-3">{entry.tabela}</td><td className="p-3">{entry.id_registro || '-'}</td><td className="p-3">{JSON.stringify(entry.detalhes || {})}</td></tr>)}
              </tbody></table>
              {!auditoria.length && <p className="p-6 text-center text-gray-500 font-bold">Nenhuma ação auditada ainda.</p>}
            </section>
          )}

          <div className={activeSection !== 'usuarios' ? 'hidden' : ''}>
          {/* BARRA DE PESQUISA E FILTROS */}
          <div className="flex flex-col gap-2.5">
            <div className="flex-1 flex items-center bg-white rounded-xl border border-gray-200 px-3 h-[42px] shadow-sm focus-within:border-cetecGreen focus-within:ring-2 focus-within:ring-cetecGreen/20 transition-all">
              <span className="material-symbols-rounded text-[18px] text-gray-400 mr-2 shrink-0">search</span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, e-mail ou UTEC"
                aria-label="Pesquisar usuários"
                className="w-full bg-transparent outline-none text-sm font-bold text-gray-700 placeholder:text-gray-400 placeholder:font-semibold h-full"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full justify-start items-center">
              <FilterChip label="Todos" icon="dashboard" active={quickFilter === 'all'} onClick={() => setQuickFilter('all')} />
              <FilterChip label="Admin Supremo" icon="crown" active={quickFilter === 'superadmin'} onClick={() => setQuickFilter('superadmin')} />
              <FilterChip label="Admin Padrão" icon="shield_person" active={quickFilter === 'administrador'} onClick={() => setQuickFilter('administrador')} />
              <FilterChip label="Editores" icon="edit" active={quickFilter === 'editor'} onClick={() => setQuickFilter('editor')} />
              <FilterChip label="Leitores" icon="visibility" active={quickFilter === 'leitor'} onClick={() => setQuickFilter('leitor')} />
              <FilterChip label="UTEC" icon="apartment" active={quickFilter === 'utec'} onClick={() => setQuickFilter('utec')} />
            </div>
          </div>

          <div className="pb-5 flex-1 flex flex-col min-h-0 relative z-[2]">
            {usuariosLoading && <div className="ui-state-panel ui-state-panel--loading">Carregando usuários...</div>}
            {usuariosError && <div className="ui-state-panel ui-state-panel--empty text-red-500">{usuariosError}</div>}
            {success && <div className="ui-state-panel ui-state-panel--empty text-green-600">{success}</div>}

            {!usuariosLoading && !usuariosError && (
              <div className="flex-1 pb-4 pr-0 sm:pr-2">
                {filteredUsers.length === 0 && (
                  <div className="ui-state-panel ui-state-panel--empty mb-4">Nenhum usuário encontrado para os filtros aplicados.</div>
                )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 ui-card-grid ui-card-grid--three">
                {filteredUsers.map((user, index) => {
                  const access = normalizeAccessLevel(user.acesso || user.tipoUsuario || user.tipo_usuario);
                  const isGlobalUser = Boolean(user.verTodasUtecs) || String(user.tipoUsuario || '').toLowerCase() === 'global' || isAnyAdmin(access);
                  const isSuperAdmin = normalizeAccessLevel(userRole) === 'superadmin';
                  const canDeleteThisUser = isSuperAdmin || canManageTargetUser(userRole, access, userName, user.nome || user.email);
                  const canEditThisUser = canDeleteThisUser;
                  return (
                    <article key={user.id || user.email || `user-${index}`} className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 min-h-[240px]">
                      <div>
                        <h3 className="text-lg font-black text-cetecBlue truncate">{user.nome || 'Usuário sem nome'}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xs px-3 py-1 rounded-lg border border-indigo-100 inline-block truncate max-w-full">{user.email || '-'}</span>
                          <span className="bg-sky-100 text-sky-700 border-sky-200 font-extrabold text-xs px-3 py-1 rounded-lg border truncate max-w-full">{isGlobalUser ? 'GLOBAL' : (user.utec || 'UTEC')}</span>
                        </div>
                      </div>

                      <div className="mt-1 space-y-2">
                        <span className="text-gray-600 font-extrabold text-sm block truncate">Acesso: {accessLabel(access)}</span>
                        <span className="text-purple-600 font-extrabold text-sm block truncate">{isGlobalUser ? 'Acesso global' : `UTEC: ${user.utec || '-'}`}</span>
                      </div>

                      <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-50">
                        <span className={`status-badge ${accessClass(access)} font-black text-xs px-3 py-1.5 rounded-lg inline-flex items-center border w-fit`}>{accessLabel(access).toUpperCase()}</span>
                        {canEditThisUser && (
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="bg-blue-600 text-white font-black px-3 py-2 rounded-xl border-b-[4px] border-blue-800 hover:bg-blue-700 transition"
                            >
                              EDITAR
                            </button>
                            {canDeleteThisUser && <button
                              type="button"
                              onClick={() => requestDelete(user)}
                              className="bg-red-500 text-white font-black px-3 py-2 rounded-xl border-b-[4px] border-red-700 hover:bg-red-600 transition"
                            >
                              EXCLUIR
                            </button>}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
          </div>
        )}
        </div>
      </div>
        </div>
      </main>

      <BaseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}
        sizeClass="ui-modal-card"
        contentAs="form"
        contentProps={{ onSubmit: handleSubmit }}
        bodyClass="ui-modal-body space-y-4"
      >
        {error && <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormTextInput
            label="Nome"
            value={form.nome}
            onChange={(event) => updateField('nome', event.target.value)}
            placeholder="Nome completo"
            required={!editingUser}
          />
          <FormTextInput
            label="E-mail"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="email@exemplo.com"
            type="email"
            required
          />
          <FormTextInput
            label="Senha"
            value={form.senha}
            onChange={(event) => updateField('senha', event.target.value)}
            placeholder={editingUser ? 'Deixe em branco para manter a atual' : 'Senha de acesso'}
            type="password"
            required={!editingUser}
          />
          <FormSelect
            label="Acesso"
            value={form.acesso}
            onChange={(event) => updateField('acesso', event.target.value)}
            options={allowedAssignableRoles}
            getOptionKey={(option) => option.value}
            getOptionLabel={(option) => option.label}
            className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-sm text-gray-700 shadow-sm appearance-none bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))] pr-11"
            selectClassName="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-sm text-gray-700 shadow-sm appearance-none bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))] pr-11"
            optionClassName="bg-white text-gray-800 font-semibold"
            required
          />
          <FormSelect
            label="UTEC"
            value={isAnyAdmin(form.acesso) ? '' : form.utec}
            onChange={(event) => updateField('utec', event.target.value)}
            options={isAnyAdmin(form.acesso) ? [] : managedUtecOptions}
            getOptionKey={(option) => option.value}
            getOptionLabel={(option) => option.label}
            className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-sm text-gray-700 shadow-sm appearance-none bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))] pr-11"
            selectClassName="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-sm text-gray-700 shadow-sm appearance-none bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))] pr-11"
            optionClassName="bg-white text-gray-800 font-semibold"
            disabled={isAnyAdmin(form.acesso)}
            required={!editingUser && !isAnyAdmin(form.acesso)}
          />
        </div>

        <p className="text-xs font-bold text-gray-500">
          {isAnyAdmin(form.acesso)
            ? 'Usuários administradores têm acesso global e não precisam de UTEC vinculada.'
            : 'Usuários editores devem ficar vinculados à sua UTEC de atuação.'}
        </p>

        <ModalActionRow
          onCancel={() => setShowAddModal(false)}
          submitLabel={saving ? 'SALVANDO...' : 'SALVAR USUÁRIO'}
          saving={saving}
          submitClassName="btn-3d bg-cetecGreen text-white font-black px-5 py-2.5 rounded-xl border-b-[4px] border-cetecGreenDark hover:bg-[#7ed152] w-full sm:w-auto"
          cancelClassName="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl w-full sm:w-auto"
        />
      </BaseModal>

      <ConfirmPasswordModal
        open={Boolean(pendingDelete)}
        title="Confirmar exclusão"
        message={pendingDelete ? `Deseja mesmo excluir o usuário ${pendingDelete.nome || pendingDelete.email || 'selecionado'}? Esta ação não pode ser desfeita.` : ''}
        passwordLabel="Senha do administrador"
        passwordPlaceholder="Digite sua senha para confirmar"
        confirmLabel="Excluir usuário"
        saving={deleteSaving}
        error={deleteError}
        onClose={() => {
          setPendingDelete(null);
          setDeleteError('');
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function FilterChip({ label, icon, active, onClick }) {
  return (
    <button type="button" className={`dashboard-filter-chip ${active ? 'is-active' : ''}`} onClick={onClick}>
      <span className="material-symbols-rounded">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function matchQuickFilter(filter, access, isGlobalUser) {
  if (filter === 'all') return true;
  if (filter === 'global') return isGlobalUser;
  if (filter === 'utec') return !isGlobalUser;
  if (filter === 'superadmin') return access === 'superadmin';
  if (filter === 'administrador') return access === 'administrador';
  if (filter === 'editor') return access === 'editor';
  if (filter === 'leitor') return access === 'leitor';
  return access === filter;
}

function accessClass(access) {
  const normalized = String(access || '').toLowerCase();
  if (normalized === 'superadmin') return 'bg-amber-100 text-amber-900 border-amber-300 font-black shadow-xs';
  if (normalized === 'administrador' || normalized.includes('admin')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  if (normalized.includes('edit')) return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-cyan-100 text-cyan-800 border-cyan-200';
}