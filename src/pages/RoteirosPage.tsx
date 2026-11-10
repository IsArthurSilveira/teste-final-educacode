import { useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { RoteiroDetailModal } from '../components/RoteiroDetailModal';
import { RoteiroFormModal } from '../components/RoteiroFormModal';
import { apiGet, apiPost } from '../services/api';
import type { RoteiroDidatico } from '../data/defaultRoteiros';
import { MODULOS_ANOS_INICIAIS, MODULOS_ANOS_FINAIS } from '../data/defaultRoteiros';
import { canManageMaterials } from '../utils/permissions';

interface RoteirosPageProps {
  userName: string;
  userRole: string;
  allowAdminTools: boolean;
  allowUsersTools: boolean;
  onLogout: () => Promise<void>;
  onOpenDashboard: () => void;
  onOpenClubs: () => void;
  onOpenRoteiros: () => void;
  onOpenGaleria?: () => void;
  onOpenClubesCompeticao?: () => void;
  onOpenProjetosFicFecom?: () => void;
  onOpenDatabaseControl?: () => void;
  onOpenNewClub: () => void;
  onOpenAdminDeleteClubs: () => void;
  onOpenAdminUsers: () => void;
}

export function RoteirosPage({
  userName,
  userRole,
  allowAdminTools,
  allowUsersTools,
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
}: RoteirosPageProps) {
  const [roteiros, setRoteiros] = useState<RoteiroDidatico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<'TODOS' | 'ANOS INICIAIS' | 'ANOS FINAIS'>('TODOS');
  const [selectedModulo, setSelectedModulo] = useState<string>('TODOS');
  const [search, setSearch] = useState('');
  const [selectedRoteiro, setSelectedRoteiro] = useState<RoteiroDidatico | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRoteiro, setEditingRoteiro] = useState<RoteiroDidatico | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<RoteiroDidatico | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = canManageMaterials(userRole);

  async function loadRoteiros() {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<RoteiroDidatico[]>({ acao: 'listar_roteiros', _t: Date.now() });
      setRoteiros(Array.isArray(data) ? data : []);
    } catch {
      setError('Não foi possível carregar os roteiros.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoteiros();
  }, []);

  // Módulos disponíveis por segmento
  const modulosIniciais = useMemo(() => {
    const set = new Set<string>(MODULOS_ANOS_INICIAIS);
    roteiros
      .filter((r) => r.segmento === 'ANOS INICIAIS')
      .forEach((r) => {
        const mod = r.modulo || r.categoria;
        if (mod) set.add(mod);
      });
    return Array.from(set);
  }, [roteiros]);

  const modulosFinais = useMemo(() => {
    const set = new Set<string>(MODULOS_ANOS_FINAIS);
    roteiros
      .filter((r) => r.segmento === 'ANOS FINAIS')
      .forEach((r) => {
        const mod = r.modulo || r.categoria;
        if (mod) set.add(mod);
      });
    return Array.from(set);
  }, [roteiros]);

  const outrosModulos = useMemo(() => {
    const standard = new Set<string>([...MODULOS_ANOS_INICIAIS, ...MODULOS_ANOS_FINAIS]);
    const set = new Set<string>();
    roteiros.forEach((r) => {
      const mod = r.modulo || r.categoria;
      if (mod && !standard.has(mod)) {
        set.add(mod);
      }
    });
    return Array.from(set);
  }, [roteiros]);

  // Contadores para o painel de estatísticas
  const stats = useMemo(() => {
    const total = roteiros.length;
    const iniciais = roteiros.filter((r) => r.segmento === 'ANOS INICIAIS').length;
    const finais = roteiros.filter((r) => r.segmento === 'ANOS FINAIS').length;
    const totalBncc = new Set(roteiros.flatMap((r) => r.bncc || [])).size;
    return { total, iniciais, finais, totalBncc };
  }, [roteiros]);

  // Filtro
  const filteredRoteiros = useMemo(() => {
    return roteiros.filter((r) => {
      if (selectedSegment !== 'TODOS' && r.segmento !== selectedSegment) {
        return false;
      }
      if (selectedModulo !== 'TODOS') {
        const mod = (r.modulo || r.categoria || '').trim().toLowerCase();
        const target = selectedModulo.trim().toLowerCase();
        if (mod !== target) {
          return false;
        }
      }
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const inTitle = r.titulo.toLowerCase().includes(query);
        const inSub = r.subtitulo.toLowerCase().includes(query);
        const inAno = r.anoSugerido.toLowerCase().includes(query);
        const inMod = (r.modulo || r.categoria || '').toLowerCase().includes(query);
        const inBncc = (r.bncc || []).some((b) => b.toLowerCase().includes(query));
        const inObj = (r.objetivos || []).some((o) => o.toLowerCase().includes(query));
        return inTitle || inSub || inAno || inMod || inBncc || inObj;
      }
      return true;
    });
  }, [roteiros, selectedSegment, selectedModulo, search]);

  function handleSelectSegment(segment: 'TODOS' | 'ANOS INICIAIS' | 'ANOS FINAIS') {
    setSelectedSegment(segment);
    if (selectedModulo !== 'TODOS') {
      if (segment === 'ANOS INICIAIS' && !modulosIniciais.includes(selectedModulo)) {
        setSelectedModulo('TODOS');
      } else if (segment === 'ANOS FINAIS' && !modulosFinais.includes(selectedModulo)) {
        setSelectedModulo('TODOS');
      }
    }
  }

  function handleOpenCreate() {
    setEditingRoteiro(null);
    setFormModalOpen(true);
  }

  function handleOpenEdit(r: RoteiroDidatico) {
    setEditingRoteiro(r);
    setSelectedRoteiro(null);
    setFormModalOpen(true);
  }

  async function handleSaveRoteiro(roteiroData: RoteiroDidatico) {
    setSaving(true);
    try {
      const response = await apiPost<{ sucesso: boolean; mensagem?: string }>({
        acao: 'salvar_roteiro',
        roteiro: roteiroData,
      });

      if (response?.sucesso) {
        setFormModalOpen(false);
        setEditingRoteiro(null);
        await loadRoteiros();
        return;
      }
      throw new Error(response?.mensagem || 'Erro ao salvar roteiro.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const response = await apiPost<{ sucesso: boolean }>({
        acao: 'excluir_roteiro',
        id: deleteConfirm.id,
      });

      if (response?.sucesso) {
        setDeleteConfirm(null);
        if (selectedRoteiro?.id === deleteConfirm.id) {
          setSelectedRoteiro(null);
        }
        await loadRoteiros();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="roteiros"
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
        onOpenDatabaseControl={onOpenDatabaseControl}
      />

      <main className="app-main-pane flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-y-auto relative bg-white lg:h-screen">
        {/* Orbs de fundo sutis e neutros */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" aria-hidden="true" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full relative z-10 bg-white">
          {/* Header da Tela com estética quente CETEC Orange (mantida exclusivamente aqui) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-5 sm:p-6 rounded-[2rem] border-2 border-orange-200/60 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cetecOrange to-[#d9550b] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                <span className="material-symbols-rounded text-2xl sm:text-3xl">menu_book</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-cetecBlue tracking-tight">
                  Roteiros Didáticos & Planos de Aula
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  Planos estruturados para Anos Iniciais e Anos Finais alinhados à BNCC
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="btn-3d self-start md:self-center px-5 py-3 rounded-2xl bg-cetecOrange text-white font-black text-xs sm:text-sm flex items-center gap-2 border-b-[5px] border-[#c55411] hover:bg-[#ff7e33] active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/20"
              >
                <span className="material-symbols-rounded text-lg">add_circle</span>
                <span>NOVO PLANO DE AULA</span>
              </button>
            )}
          </div>

          {/* Cards de Métricas em tons equilibrados de Azul e Verde */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs hover:border-slate-300 transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black uppercase text-gray-400">Total de Planos</span>
                <span className="material-symbols-rounded text-lg text-cetecBlue">auto_stories</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-cetecBlue">{stats.total}</p>
              <p className="text-[11px] font-semibold text-gray-500">Acervo cadastrado</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/20 border-2 border-blue-200 shadow-xs hover:border-blue-400 transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black uppercase text-blue-700">Anos Iniciais</span>
                <span className="material-symbols-rounded text-lg text-blue-600">backpack</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-blue-800">{stats.iniciais}</p>
              <p className="text-[11px] font-semibold text-blue-700/80">1º ao 5º ano escolar</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/20 border-2 border-emerald-200 shadow-xs hover:border-emerald-400 transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black uppercase text-emerald-700">Anos Finais</span>
                <span className="material-symbols-rounded text-lg text-emerald-600">rocket_launch</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-800">{stats.finais}</p>
              <p className="text-[11px] font-semibold text-emerald-700/80">6º ao 9º ano escolar</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs hover:border-teal-300 transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black uppercase text-teal-700">Habilidades BNCC</span>
                <span className="material-symbols-rounded text-lg text-teal-600">verified</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-teal-800">{stats.totalBncc}</p>
              <p className="text-[11px] font-semibold text-teal-700/80">Competências ativas</p>
            </div>
          </div>

          {/* Barra de Filtros e Busca - Otimizada lado a lado em linha única */}
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl border-2 border-gray-100 shadow-xs flex flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-2.5">
            {/* Segmentos (Pílulas compactas) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl shrink-0 w-full sm:w-auto justify-start overflow-x-auto">
              <button
                type="button"
                onClick={() => handleSelectSegment('TODOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap cursor-pointer ${
                  selectedSegment === 'TODOS'
                    ? 'bg-cetecBlue text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-slate-200/60'
                }`}
              >
                Todos ({roteiros.length})
              </button>
              <button
                type="button"
                onClick={() => handleSelectSegment('ANOS INICIAIS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap cursor-pointer ${
                  selectedSegment === 'ANOS INICIAIS'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-blue-700 hover:bg-blue-100/70'
                }`}
              >
                Anos Iniciais ({stats.iniciais})
              </button>
              <button
                type="button"
                onClick={() => handleSelectSegment('ANOS FINAIS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap cursor-pointer ${
                  selectedSegment === 'ANOS FINAIS'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-700 hover:bg-emerald-100/70'
                }`}
              >
                Anos Finais ({stats.finais})
              </button>
            </div>

            {/* Campo de Busca (flexível para ocupar o espaço central) */}
            <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
              <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none select-none">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por título, módulo ou BNCC..."
                className="w-full pl-11 pr-9 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full cursor-pointer"
                  title="Limpar busca"
                >
                  <span className="material-symbols-rounded text-sm">close</span>
                </button>
              )}
            </div>

            {/* Menu Suspenso de Módulos */}
            <div className="w-full sm:w-auto lg:w-56 shrink-0">
              <div className="relative">
                <span className="material-symbols-rounded absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">
                  widgets
                </span>
                <select
                  value={selectedModulo}
                  onChange={(e) => setSelectedModulo(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer appearance-none truncate"
                >
                  <option value="TODOS">Todos os Módulos</option>
                  {selectedSegment === 'ANOS INICIAIS' ? (
                    modulosIniciais.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))
                  ) : selectedSegment === 'ANOS FINAIS' ? (
                    modulosFinais.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))
                  ) : (
                    <>
                      <optgroup label="Anos Iniciais">
                        {modulosIniciais.map((mod) => (
                          <option key={`ini-${mod}`} value={mod}>
                            {mod}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Anos Finais">
                        {modulosFinais.map((mod) => (
                          <option key={`fin-${mod}`} value={mod}>
                            {mod}
                          </option>
                        ))}
                      </optgroup>
                      {outrosModulos.length > 0 && (
                        <optgroup label="Outros Módulos">
                          {outrosModulos.map((mod) => (
                            <option key={`out-${mod}`} value={mod}>
                              {mod}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  )}
                </select>
                <span className="material-symbols-rounded absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Botão de Limpar Filtros quando houver filtro ativo */}
            {(selectedSegment !== 'TODOS' || selectedModulo !== 'TODOS' || search !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSegment('TODOS');
                  setSelectedModulo('TODOS');
                  setSearch('');
                }}
                className="px-2.5 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl shrink-0 transition flex items-center gap-1 cursor-pointer"
                title="Limpar todos os filtros"
              >
                <span className="material-symbols-rounded text-sm">filter_alt_off</span>
                <span className="hidden xl:inline">Limpar</span>
              </button>
            )}
          </div>

          {/* Grid de Roteiros */}
          {loading ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-200">
              <span className="material-symbols-rounded text-4xl text-blue-600 animate-spin mb-2">progress_activity</span>
              <p className="text-sm font-bold text-gray-500">A carregar planos de aula...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-red-50 border border-red-200 rounded-2xl text-red-600 font-bold text-sm">
              <p>{error}</p>
              <button
                type="button"
                onClick={loadRoteiros}
                className="mt-2 text-xs font-black underline text-red-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredRoteiros.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-2">
              <span className="material-symbols-rounded text-5xl text-gray-300">auto_stories</span>
              <h3 className="text-base font-bold text-gray-700">Nenhum plano de aula encontrado</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Tente ajustar os filtros ou a palavra-chave pesquisada para localizar os roteiros pedagógicos.
              </p>
              {(search || selectedModulo !== 'TODOS' || selectedSegment !== 'TODOS') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedModulo('TODOS');
                    setSelectedSegment('TODOS');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition mt-2"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRoteiros.map((roteiro) => {
                const isIniciais = roteiro.segmento === 'ANOS INICIAIS';

                return (
                  <article
                    key={roteiro.id}
                    className={`bg-white rounded-2xl sm:rounded-[1.5rem] p-5 border-2 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group relative overflow-hidden text-left ${
                      isIniciais
                        ? 'border-blue-200 hover:border-blue-500 bg-gradient-to-b from-blue-50/25 to-white'
                        : 'border-emerald-200 hover:border-emerald-500 bg-gradient-to-b from-emerald-50/25 to-white'
                    }`}
                  >
                    {/* Borda superior de destaque: Azul para Iniciais, Verde para Finais */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        isIniciais ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}
                    />

                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isIniciais
                              ? 'bg-blue-100/80 text-blue-800 border border-blue-300'
                              : 'bg-emerald-100/80 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isIniciais ? 'Anos Iniciais' : 'Anos Finais'}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                              isIniciais
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {roteiro.modulo || roteiro.categoria}
                          </span>

                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">
                            {roteiro.anoSugerido}
                          </span>
                        </div>
                      </div>

                      <h3
                        className={`text-base font-black text-cetecBlue transition line-clamp-2 mb-1.5 ${
                          isIniciais ? 'group-hover:text-blue-700' : 'group-hover:text-emerald-700'
                        }`}
                      >
                        {roteiro.titulo}
                      </h3>

                      <p className="text-xs text-gray-500 line-clamp-2 mb-3 font-medium leading-relaxed">
                        {roteiro.subtitulo}
                      </p>

                      {/* Meta Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px] font-semibold text-gray-600">
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                            isIniciais
                              ? 'bg-blue-50/50 border-blue-100 text-blue-900'
                              : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                          }`}
                        >
                          <span
                            className={`material-symbols-rounded text-[13px] ${
                              isIniciais ? 'text-blue-600' : 'text-emerald-600'
                            }`}
                          >
                            timer
                          </span>
                          {roteiro.duracao}
                        </span>
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                            isIniciais
                              ? 'bg-blue-50/50 border-blue-100 text-blue-900'
                              : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                          }`}
                        >
                          <span
                            className={`material-symbols-rounded text-[13px] ${
                              isIniciais ? 'text-blue-600' : 'text-emerald-600'
                            }`}
                          >
                            signal_cellular_alt
                          </span>
                          {roteiro.nivel}
                        </span>
                      </div>

                      {/* BNCC tags preview */}
                      {roteiro.bncc && roteiro.bncc.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {roteiro.bncc.slice(0, 3).map((code) => (
                            <span
                              key={code}
                              className={`px-1.5 py-0.5 border rounded text-[10px] font-mono font-bold ${
                                isIniciais
                                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              }`}
                            >
                              {code}
                            </span>
                          ))}
                          {roteiro.bncc.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500">
                              +{roteiro.bncc.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedRoteiro(roteiro)}
                        className={`btn-3d flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-white border-b-2 shadow-xs ${
                          isIniciais
                            ? 'bg-blue-600 hover:bg-blue-700 border-blue-800 shadow-blue-500/20'
                            : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-800 shadow-emerald-500/20'
                        }`}
                      >
                        <span className="material-symbols-rounded text-base">visibility</span>
                        <span>Ver Roteiro</span>
                      </button>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(roteiro)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-95 border ${
                              isIniciais
                                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title="Editar plano"
                          >
                            <span className="material-symbols-rounded text-base">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(roteiro)}
                            className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center transition active:scale-95"
                            title="Excluir plano"
                          >
                            <span className="material-symbols-rounded text-base">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalhes do Roteiro */}
      <RoteiroDetailModal
        open={Boolean(selectedRoteiro)}
        onClose={() => setSelectedRoteiro(null)}
        roteiro={selectedRoteiro}
        isAdmin={isAdmin}
        onEdit={handleOpenEdit}
      />

      {/* Modal de Criação / Edição (Admin) */}
      <RoteiroFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingRoteiro(null);
        }}
        onSubmit={handleSaveRoteiro}
        initialValues={editingRoteiro}
        saving={saving}
      />

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-4 border-red-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-rounded text-2xl">delete_forever</span>
            </div>
            <h3 className="text-lg font-black text-gray-900">Excluir Plano de Aula?</h3>
            <p className="text-xs text-gray-600">
              Tem certeza de que deseja remover o roteiro{' '}
              <strong className="text-gray-900">&quot;{deleteConfirm.titulo}&quot;</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs transition"
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
