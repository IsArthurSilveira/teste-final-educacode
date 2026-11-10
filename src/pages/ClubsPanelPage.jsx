import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { statusKey } from '../utils/clubes';
import { ConfirmPasswordModal } from '../components/ui/ConfirmPasswordModal';
import { ClubFormModal } from '../components/ClubFormModal';

export function ClubsPanelPage({
  userName,
  allowCreateClub,
  allowAdminTools = false,
  allowUsersTools = false,
  onLogout,
  onOpenNewClubModal,
  onOpenAdminDeleteClubs,
  onOpenAdminUsers,
  clubes,
  loading,
  error,
  onDeleteClub,
  onRefreshClubs,
  onSaveClub,
  utecOptions = [],
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [encontrosFilter, setEncontrosFilter] = useState('all');
  const searchField = 'all';
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Edição In-Place do Clube (Abre modal por cima sem tela branca)
  const [editingClub, setEditingClub] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  async function handleSaveEditedClub(form) {
    setEditSaving(true);
    setEditError('');
    try {
      const id = resolveClubId(editingClub, clubes) || editingClub?.id;
      const payload = {
        acao: 'atualizar_clube',
        id_clube: id,
        ...form,
        status: editingClub?.status || 'pendente',
      };
      if (onSaveClub) {
        const res = await onSaveClub(payload);
        if (res?.sucesso) {
          setEditModalOpen(false);
          setEditingClub(null);
          if (onRefreshClubs) await onRefreshClubs();
          return;
        }
        setEditError(res?.erro || res?.mensagem || 'Erro ao salvar o clube.');
      }
    } catch {
      setEditError('Falha ao salvar clube.');
    } finally {
      setEditSaving(false);
    }
  }

  const normalizedSearch = search.trim().toLowerCase();

  const filteredClubes = useMemo(() => {
    return clubes.filter((clube) => {
      const key = statusKey(clube.status);
      const categoria = String(clube.categoria || '').toLowerCase();
      const inQuickFilter = matchQuickFilter(quickFilter, key, categoria);
      if (!inQuickFilter) return false;

      const encontros = Number(clube.encontrosFeitos || 0);
      if (encontrosFilter === 'zero' && encontros !== 0) return false;
      if (encontrosFilter === '1_5' && (encontros < 1 || encontros > 5)) return false;
      if (encontrosFilter === '6_10' && (encontros < 6 || encontros > 10)) return false;
      if (encontrosFilter === '11_plus' && encontros < 11) return false;

      if (!normalizedSearch) return true;
      return matchSearchField(clube, searchField, normalizedSearch);
    });
  }, [clubes, normalizedSearch, quickFilter, searchField, encontrosFilter]);

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="clubs"
        userName={userName}
        allowCreateClub={allowCreateClub}
        allowAdminTools={allowAdminTools}
        allowUsersTools={allowUsersTools}
        onLogout={onLogout}
        onOpenDashboard={() => navigate('/dashboard')}
        onOpenClubs={() => navigate('/clubes')}
        onOpenRoteiros={() => navigate('/roteiros')}
        onOpenGaleria={() => navigate('/galeria')}
        onOpenClubesCompeticao={() => navigate('/clubes-competicao')}
        onOpenProjetosFicFecom={() => navigate('/projetos-fic-fecom')}
        onOpenDatabaseControl={() => navigate('/admin/banco-de-dados')}
        onOpenNewClub={onOpenNewClubModal}
        onOpenAdminDeleteClubs={onOpenAdminDeleteClubs}
        onOpenAdminUsers={onOpenAdminUsers}
      />

      <main className="app-main-pane flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-y-auto relative bg-white lg:h-screen">
        <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full relative z-10 bg-white">
          {/* Header da Tela Padronizado */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-emerald-500/5 to-transparent p-5 sm:p-6 rounded-[2rem] border-2 border-blue-200/60 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cetecBlue to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
                <span className="material-symbols-rounded text-2xl sm:text-3xl font-black">groups</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-cetecBlue tracking-tight">
                  Painel de Clubes
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold">
                  Gestão completa dos clubes cadastrados com busca ativa e filtros rápidos
                </p>
              </div>
            </div>

            {allowCreateClub && (
              <button
                type="button"
                onClick={onOpenNewClubModal}
                className="btn-3d self-start md:self-center px-5 py-3 rounded-2xl bg-cetecGreen text-white font-black text-xs sm:text-sm flex items-center gap-2 border-b-[5px] border-cetecGreenDark hover:bg-[#7ed152] active:scale-95 transition cursor-pointer shadow-md shadow-emerald-900/20"
              >
                <span className="material-symbols-rounded text-lg">add_circle</span>
                <span>+ NOVO CLUBE</span>
              </button>
            )}
          </div>

          {/* ÁREA DE FILTROS E PESQUISA PADRONIZADA */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3 w-full">
              {/* Barra de Pesquisa Padronizada */}
              <div className="flex-1 flex items-center bg-white rounded-xl border-2 border-gray-200 px-3.5 h-[42px] shadow-xs focus-within:border-cetecGreen focus-within:ring-2 focus-within:ring-cetecGreen/20 transition-all">
                <span className="material-symbols-rounded text-[18px] text-gray-400 mr-2 shrink-0">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Pesquisar por clube, escola, professor, estagiário ou UTEC..."
                  className="w-full bg-transparent outline-none text-xs sm:text-sm font-bold text-gray-700 placeholder:text-gray-400 placeholder:font-semibold h-full"
                  aria-label="Pesquisar clubes"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  >
                    <span className="material-symbols-rounded text-sm">close</span>
                  </button>
                )}
              </div>
              
              {/* Select de Progresso Padronizado */}
              <select
                value={encontrosFilter}
                onChange={(e) => setEncontrosFilter(e.target.value)}
                className="bg-white border-2 border-gray-200 rounded-xl px-3 h-[42px] text-xs font-bold text-gray-700 outline-none focus:border-cetecGreen cursor-pointer shadow-xs min-w-[200px]"
                title="Filtrar por quantidade de encontros"
              >
                <option value="all">Progresso: Todos</option>
                <option value="zero">0 Encontros</option>
                <option value="1_5">1 a 5 Encontros</option>
                <option value="6_10">6 a 10 Encontros</option>
                <option value="11_plus">11+ Encontros</option>
              </select>
            </div>

            {/* Chips Alinhados à Esquerda com Botões Estilizados */}
            <div className="flex flex-wrap gap-2 w-full justify-start items-center">
              <FilterChip label="Todos" icon="groups" active={quickFilter === 'all'} onClick={() => setQuickFilter('all')} />
              <FilterChip label="Pendentes" icon="hourglass_top" active={quickFilter === 'pendente'} onClick={() => setQuickFilter('pendente')} />
              <FilterChip label="Em Andamento" icon="play_circle" active={quickFilter === 'em_andamento'} onClick={() => setQuickFilter('em_andamento')} />
              <FilterChip label="Concluídos" icon="check_circle" active={quickFilter === 'concluido'} onClick={() => setQuickFilter('concluido')} />
              <FilterChip label="Iniciais" icon="school" active={quickFilter === 'iniciais'} onClick={() => setQuickFilter('iniciais')} />
              <FilterChip label="Mistos" icon="diversity_3" active={quickFilter === 'mistos'} onClick={() => setQuickFilter('mistos')} />
              <FilterChip label="Finais" icon="category" active={quickFilter === 'finais'} onClick={() => setQuickFilter('finais')} />
            </div>
          </div>

          <div className="pb-5 flex-1 flex flex-col min-h-0 relative z-[2]">
            {loading && <div className="ui-state-panel ui-state-panel--loading">A sincronizar com a base de dados...</div>}
            {error && <div className="ui-state-panel ui-state-panel--empty text-red-500">{error}</div>}

            {!loading && !error && (
              <div className="flex-1 pb-4 pr-0 sm:pr-2">
                {filteredClubes.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-2">
                    <span className="material-symbols-rounded text-5xl text-blue-500/50">groups</span>
                    <h3 className="text-base font-bold text-gray-700">Nenhum clube encontrado</h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      Tente ajustar os filtros ou cadastre um novo clube para sua UTEC!
                    </p>
                    {allowCreateClub && (
                      <button
                        type="button"
                        onClick={onOpenNewClubModal}
                        className="mt-3 px-4 py-2 bg-cetecGreen text-white font-black rounded-xl text-xs hover:bg-[#7ed152] transition cursor-pointer shadow-xs"
                      >
                        Cadastrar Clube Agora
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" id="grid-clubes-react">
                    {filteredClubes.map((clube, index) => (
                      <div
                        key={clube.id || `clube-${index}`}
                        onClick={() => {
                          const targetId = resolveClubId(clube, clubes);
                          if (!targetId) return;
                          navigate(`/clubes/${encodeURIComponent(targetId)}`, { state: { from: '/clubes' } });
                        }}
                        className="bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-cetecGreen shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between gap-4 text-left cursor-pointer"
                      >
                        <div>
                          {/* Topo do Card: Nome e Selo da Categoria */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-black text-gray-900 group-hover:text-cetecBlue transition-colors line-clamp-1">
                              {clube.nome}
                            </h3>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-cetecBlue border border-blue-200/70 shrink-0">
                              {normalizeCategoriaLabel(clube.categoria)}
                            </span>
                          </div>

                          {/* Badges de Escola e UTEC */}
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            <span className="bg-indigo-50/70 text-indigo-800 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border border-indigo-100 inline-block truncate max-w-full">
                              {clube.escola}
                            </span>
                            <span className="bg-emerald-50 text-emerald-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border border-emerald-200 inline-block truncate max-w-full">
                              {clube.nomeUtec || clube.utec || 'UTEC'}
                            </span>
                          </div>

                          {/* Metadados: Professor e Estagiário */}
                          <div className="mt-3 space-y-1 text-xs">
                            <p className="text-gray-600 font-bold truncate">
                              <strong className="text-gray-400 font-black">Prof:</strong> {clube.prof}
                            </p>
                            <p className="text-emerald-800 font-bold truncate">
                              <strong className="text-gray-400 font-black">Estagiário:</strong> {clube.estag}
                            </p>
                          </div>

                          {/* Agenda: Dias e Horário */}
                          {(clube.dias || clube.horario) && (
                            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-500 font-semibold truncate">
                              <span className="material-symbols-rounded text-sm text-gray-400 shrink-0">schedule</span>
                              <span className="truncate">{clube.dias || 'A definir'} • {clube.horario || 'A definir'}</span>
                            </div>
                          )}
                        </div>

                        {/* Rodapé do Card: Alunos, Encontros e Status */}
                        <div className="flex items-end justify-between mt-auto pt-3 border-t border-gray-100">
                          <div className="flex flex-col">
                            <span className="text-cetecBlue font-black text-xs leading-none">
                              {clube.alunos || 0} Alunos
                            </span>
                            <span className="text-cetecGreen font-extrabold text-[11px] mt-1 uppercase tracking-tight">
                              {clube.encontrosFeitos || 0} Encontros
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingClub(clube);
                                setEditError('');
                                setEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-cetecGreen hover:bg-emerald-50 transition cursor-pointer"
                              title="Editar informações do clube"
                            >
                              <span className="material-symbols-rounded text-base">edit</span>
                            </button>

                            {allowAdminTools && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteError('');
                                  setClubToDelete(clube);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Excluir clube"
                              >
                                <span className="material-symbols-rounded text-base">delete</span>
                              </button>
                            )}

                            <span
                              className={`font-black text-[10px] px-2.5 py-1 rounded-lg border uppercase tracking-wider shrink-0 ${
                                statusKey(clube.status) === 'em_andamento'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : statusKey(clube.status) === 'concluido'
                                  ? 'bg-yellow-100 text-yellow-900 border-yellow-300'
                                  : 'bg-gray-100 text-gray-700 border-gray-300'
                              }`}
                            >
                              {statusText(clube.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <ConfirmPasswordModal
          open={deleteModalOpen}
          title={`Excluir clube`}
          message={`Deseja mesmo excluir o clube "${clubToDelete?.nome || ''}"? Esta ação é irreversível.`}
          passwordLabel="Senha do usuário"
          passwordPlaceholder="Digite sua senha para confirmar"
          confirmLabel="Excluir"
          saving={deleteSaving}
          error={deleteError}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={async (password) => {
            if (!onDeleteClub) return setDeleteError('Ação indisponível.');
            setDeleteSaving(true);
            setDeleteError('');
            try {
              const id = resolveClubId(clubToDelete, clubes) || clubToDelete?.id;
              const payload = { acao: 'remover_clube', id_clube: id, senha: password };
              const result = await onDeleteClub(payload);
              if (result && result.sucesso) {
                setDeleteModalOpen(false);
                if (onRefreshClubs) await onRefreshClubs();
                return;
              }
              setDeleteError((result && (result.erro || result.mensagem)) || 'Não foi possível excluir o clube.');
            } catch {
              setDeleteError('Erro ao excluir o clube.');
            } finally {
              setDeleteSaving(false);
            }
          }}
        />

        {editModalOpen && editingClub && (
          <ClubFormModal
            key={editingClub.id || 'edit-club'}
            open={editModalOpen}
            title={`Editar Clube: ${editingClub.nome || ''}`}
            initialValues={editingClub}
            utecOptions={utecOptions}
            onClose={() => {
              setEditModalOpen(false);
              setEditingClub(null);
            }}
            onSubmit={handleSaveEditedClub}
            saving={editSaving}
            error={editError}
          />
        )}
      </main>
    </div>
  );
}

function FilterChip({ label, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
        active
          ? 'bg-cetecBlue text-white border-cetecBlue shadow-xs'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-cetecBlue'
      }`}
    >
      <span className="material-symbols-rounded text-[16px]">{icon}</span>
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

function matchSearchField(clube, field, search) {
  const nome = String(clube.nome || '').toLowerCase();
  const escola = String(clube.escola || '').toLowerCase();
  const estag = String(clube.estag || '').toLowerCase();
  const prof = String(clube.prof || '').toLowerCase();

  if (field === 'nome') return nome.includes(search);
  if (field === 'escola') return escola.includes(search);
  if (field === 'estag') return estag.includes(search);
  if (field === 'prof') return prof.includes(search);

  return [nome, escola, estag, prof].join(' ').includes(search);
}

function normalizeCategoriaLabel(categoria) {
  const current = String(categoria || '').toLowerCase();
  if (current.includes('mist')) return 'Clubes Mistos';
  if (current.includes('fina')) return 'Clubes Finais';
  return 'Clubes Iniciais';
}

function statusText(status) {
  const key = statusKey(status);
  if (key === 'concluido') return 'CONCLUÍDO';
  if (key === 'em_andamento') return 'EM ANDAMENTO';
  return 'PENDENTE';
}

function resolveClubId(clube, clubes) {
  const currentId = String(clube?.id || '').trim();
  if (currentId) return currentId;

  const sameNameWithId = clubes.find((item) => item?.nome === clube?.nome && String(item?.id || '').trim());
  return String(sameNameWithId?.id || '').trim();
}