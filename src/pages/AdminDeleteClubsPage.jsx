import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { ConfirmPasswordModal } from '../components/ui/ConfirmPasswordModal';
import { statusKey } from '../utils/clubes';

export function AdminDeleteClubsPage({
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
  onOpenNewClub,
  onOpenAdminDeleteClubs,
  onOpenAdminUsers,
  clubes,
  loading,
  error,
  onDeleteClub,
  onRefreshClubs,
}) {
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [saving, setSaving] = useState(false);

  const normalizedSearch = search.trim().toLowerCase();
  const isAdmin = String(userRole || '').toLowerCase() === 'administrador';

  const filteredClubes = useMemo(() => {
    return clubes.filter((clube) => {
      const status = statusKey(clube.status);
      const categoria = String(clube.categoria || '').toLowerCase();
      if (!matchQuickFilter(quickFilter, status, categoria)) return false;

      if (!normalizedSearch) return true;

      return [clube.nome, clube.escola, clube.utec, clube.nomeUtec, clube.prof, clube.estag, clube.categoria]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(normalizedSearch));
    });
  }, [clubes, normalizedSearch, quickFilter]);

  if (!isAdmin || !allowAdminTools) {
    return <Navigate to="/dashboard" replace />;
  }

  function requestDelete(clube) {
    setDeleteError('');
    setPendingDelete(clube);
  }

  async function handleConfirmDelete(password) {
    if (!pendingDelete?.id) return;

    setSaving(true);
    setDeleteError('');

    try {
      let response = await onDeleteClub({ acao: 'remover_clube', id_clube: pendingDelete.id, senha: password });
      if (!response?.sucesso) {
        response = await onDeleteClub({ acao: 'excluir_clube', id_clube: pendingDelete.id, senha: password });
      }

      if (response?.sucesso) {
        setPendingDelete(null);
        if (onRefreshClubs) await onRefreshClubs();
        return;
      }

      setDeleteError(String(response?.erro || response?.mensagem || 'Não foi possível excluir o clube.'));
    } catch {
      setDeleteError('Não foi possível excluir o clube.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="admin-delete-clubs"
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
        onOpenNewClub={onOpenNewClub}
        onOpenAdminDeleteClubs={onOpenAdminDeleteClubs}
        onOpenAdminUsers={onOpenAdminUsers}
      />

      <main className="app-main-pane flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-y-auto relative bg-white lg:h-screen">
        <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full relative z-10 bg-white">
          {/* Header da Tela Padronizado */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-600/10 via-rose-500/5 to-transparent p-5 sm:p-6 rounded-[2rem] border-2 border-red-200/60 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-md shadow-red-900/20 shrink-0">
                <span className="material-symbols-rounded text-2xl sm:text-3xl font-black">delete_sweep</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-cetecBlue tracking-tight">
                  Excluir Clubes
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold">
                  Ferramenta administrativa para remoção de clubes cadastrados
                </p>
              </div>
            </div>
          </div>

          {/* BARRA DE PESQUISA E FILTROS */}
          <div className="flex flex-col gap-2.5">
            <div className="flex-1 flex items-center bg-white rounded-xl border border-gray-200 px-3 h-[42px] shadow-sm focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 transition-all">
              <span className="material-symbols-rounded text-[18px] text-gray-400 mr-2 shrink-0">search</span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por clube, escola, UTEC ou professor"
                aria-label="Pesquisar clubes"
                className="w-full bg-transparent outline-none text-sm font-bold text-gray-700 placeholder:text-gray-400 placeholder:font-semibold h-full"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full justify-start items-center">
              <FilterChip label="Todos" icon="dashboard" active={quickFilter === 'all'} onClick={() => setQuickFilter('all')} />
              <FilterChip label="Pendentes" icon="hourglass_top" active={quickFilter === 'pendente'} onClick={() => setQuickFilter('pendente')} />
              <FilterChip label="Andamento" icon="progress_activity" active={quickFilter === 'em_andamento'} onClick={() => setQuickFilter('em_andamento')} />
              <FilterChip label="Concluídos" icon="task_alt" active={quickFilter === 'concluido'} onClick={() => setQuickFilter('concluido')} />
              <FilterChip label="Iniciais" icon="school" active={quickFilter === 'iniciais'} onClick={() => setQuickFilter('iniciais')} />
              <FilterChip label="Mistos" icon="groups" active={quickFilter === 'mistos'} onClick={() => setQuickFilter('mistos')} />
              <FilterChip label="Finais" icon="category" active={quickFilter === 'finais'} onClick={() => setQuickFilter('finais')} />
            </div>
          </div>

          <div className="pb-5 flex-1 flex flex-col min-h-0 relative z-[2]">
            {loading && <div className="ui-state-panel ui-state-panel--loading">Carregando clubes...</div>}
            {error && <div className="ui-state-panel ui-state-panel--empty text-red-500">{error}</div>}

          {!loading && !error && (
            <div className="flex-1 overflow-y-auto no-scrollbar pb-4 pr-0 sm:pr-2">
              {filteredClubes.length === 0 && (
                <div className="ui-state-panel ui-state-panel--empty mb-4">Nenhum clube encontrado para os filtros aplicados.</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 ui-card-grid ui-card-grid--three">
                {filteredClubes.map((clube, index) => (
                  <article key={clube.id || `clube-${index}`} className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 min-h-[240px]">
                    <div>
                      <h3 className="text-lg font-black text-cetecBlue truncate">{clube.nome}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xs px-3 py-1 rounded-lg border border-indigo-100 inline-block truncate max-w-full">{clube.escola}</span>
                        <span className="bg-sky-100 text-sky-700 border-sky-200 font-extrabold text-xs px-3 py-1 rounded-lg border truncate max-w-full">{clube.nomeUtec || clube.utec || 'UTEC sem nome'}</span>
                      </div>
                    </div>

                    <div className="mt-1 space-y-2">
                      <span className="text-gray-600 font-extrabold text-sm block truncate">Prof: {clube.prof}</span>
                      <span className="text-purple-600 font-extrabold text-sm block truncate">Estag: {clube.estag}</span>
                      <span className={`status-badge ${statusClass(clube.status)} font-black text-xs px-3 py-1.5 rounded-lg inline-flex items-center border w-fit`}>{statusText(clube.status)}</span>
                    </div>

                    <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-50">
                      <span className="text-cetecBlue font-black text-sm">{categoriaLabel(clube.categoria)}</span>
                      <button
                        type="button"
                        onClick={() => requestDelete(clube)}
                        className="bg-red-500 text-white font-black px-4 py-2.5 rounded-xl border-b-[4px] border-red-700 hover:bg-red-600 transition"
                      >
                        EXCLUIR
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </main>

      <ConfirmPasswordModal
        open={Boolean(pendingDelete)}
        title="Confirmar exclusão"
        message={pendingDelete ? `Deseja mesmo excluir o clube ${pendingDelete.nome}? Esta ação não pode ser desfeita.` : ''}
        passwordLabel="Senha do administrador"
        passwordPlaceholder="Digite sua senha para confirmar"
        confirmLabel="Excluir clube"
        saving={saving}
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

function matchQuickFilter(filter, status, categoria) {
  if (filter === 'pendente' || filter === 'em_andamento' || filter === 'concluido') {
    return status === filter;
  }
  if (filter === 'iniciais') return categoria.includes('iniciais');
  if (filter === 'mistos') return categoria.includes('mistos');
  if (filter === 'finais') return categoria.includes('finais');
  return true;
}

function statusClass(status) {
  const key = statusKey(status);
  if (key === 'concluido') return 'bg-green-100 text-green-700 border-green-200';
  if (key === 'em_andamento') return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-cyan-100 text-cyan-700 border-cyan-200';
}

function statusText(status) {
  const key = statusKey(status);
  if (key === 'concluido') return 'CONCLUÍDO';
  if (key === 'em_andamento') return 'EM ANDAMENTO';
  return 'PENDENTE';
}

function categoriaLabel(categoria) {
  const current = String(categoria || '').toLowerCase();
  if (current.includes('mist')) return 'Clubes Mistos';
  if (current.includes('fina')) return 'Clubes Finais';
  return 'Clubes Iniciais';
}