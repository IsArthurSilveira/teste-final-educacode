import { useMemo, useState } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { FotoDetailModal } from '../components/FotoDetailModal';
import { FotoUploadModal } from '../components/FotoUploadModal';
import { BaseModal } from '../components/ui/BaseModal';
import {
  deleteFotoGaleria,
  getStoredGaleriaFotos,
  saveFotoGaleria,
  toggleCurtidaFoto,
} from '../data/defaultGaleria';
import type { FotoGaleria } from '../data/defaultGaleria';

interface GaleriaPageProps {
  userName: string;
  userRole?: string;
  allowAdminTools?: boolean;
  allowUsersTools?: boolean;
  clubes?: Array<{ id?: string; nome: string; escola?: string; utec?: string; nomeUtec?: string }>;
  onLogout: () => void;
  onOpenDashboard: () => void;
  onOpenClubs: () => void;
  onOpenRoteiros: () => void;
  onOpenGaleria?: () => void;
  onOpenClubesCompeticao?: () => void;
  onOpenProjetosFicFecom?: () => void;
  onOpenNewClub?: () => void;
  onOpenAdminDeleteClubs?: () => void;
  onOpenAdminUsers?: () => void;
}

export function GaleriaPage({
  userName,
  userRole = 'editor',
  allowUsersTools = false,
  clubes = [],
  onLogout,
  onOpenDashboard,
  onOpenClubs,
  onOpenRoteiros,
  onOpenClubesCompeticao,
  onOpenProjetosFicFecom,
  onOpenAdminUsers,
}: GaleriaPageProps) {
  const [fotos, setFotos] = useState<FotoGaleria[]>(() => getStoredGaleriaFotos());
  const [selectedFoto, setSelectedFoto] = useState<FotoGaleria | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClube, setSelectedClube] = useState('TODOS');
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  const clubesList = useMemo(() => {
    const set = new Set<string>();
    if (clubes && clubes.length > 0) {
      clubes.forEach((c) => {
        if (c.nome) set.add(c.nome.trim());
      });
    }
    fotos.forEach((f) => {
      const nome = f.clubeNome || f.escola;
      if (nome) set.add(nome.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [fotos, clubes]);

  const filteredFotos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return fotos.filter((foto) => {
      const nomeClube = (foto.clubeNome || foto.escola || '').toLowerCase();
      const matchClube =
        selectedClube === 'TODOS' ||
        nomeClube === selectedClube.toLowerCase();

      const matchSearch =
        !term ||
        foto.titulo.toLowerCase().includes(term) ||
        foto.legenda.toLowerCase().includes(term) ||
        foto.descricao.toLowerCase().includes(term) ||
        foto.autor.toLowerCase().includes(term) ||
        (foto.clubeNome && foto.clubeNome.toLowerCase().includes(term)) ||
        (foto.escola && foto.escola.toLowerCase().includes(term)) ||
        (foto.utec && foto.utec.toLowerCase().includes(term));

      return matchClube && matchSearch;
    });
  }, [fotos, search, selectedClube]);

  function handleSaveNovaFoto(novaFoto: FotoGaleria) {
    const updated = saveFotoGaleria(novaFoto);
    setFotos(updated);
  }

  function handleDeleteFoto(id: string) {
    const updated = deleteFotoGaleria(id);
    setFotos(updated);
    if (selectedFoto?.id === id) {
      setSelectedFoto(null);
    }
  }

  function handleCurtir(id: string) {
    const updated = toggleCurtidaFoto(id);
    setFotos(updated);
    if (selectedFoto && selectedFoto.id === id) {
      setSelectedFoto((prev) => (prev ? { ...prev, curtidas: (prev.curtidas || 0) + 1 } : null));
    }
  }

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="galeria"
        userName={userName}
        allowUsersTools={allowUsersTools}
        onLogout={onLogout}
        onOpenDashboard={onOpenDashboard}
        onOpenClubs={onOpenClubs}
        onOpenAdminUsers={onOpenAdminUsers}
        onOpenRoteiros={onOpenRoteiros}
        onOpenGaleria={() => {}}
        onOpenClubesCompeticao={onOpenClubesCompeticao}
        onOpenProjetosFicFecom={onOpenProjetosFicFecom}
      />

      <main className="app-main-pane flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-y-auto relative bg-white lg:h-screen">
        <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full relative z-10 bg-white">
          {/* Header da Galeria */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-500/5 to-transparent p-5 sm:p-6 rounded-[2rem] border-2 border-blue-200/60 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cetecBlue to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
                <span className="material-symbols-rounded text-2xl sm:text-3xl">photo_library</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-cetecBlue tracking-tight">
                  Galeria de Fotos & Projetos
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  Compartilhamento de atividades práticas, montagens e protótipos dos clubes
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="btn-3d self-start md:self-center px-5 py-3 rounded-2xl bg-cetecBlue text-white font-black text-xs sm:text-sm flex items-center gap-2 border-b-[5px] border-blue-900 hover:bg-blue-800 active:scale-95 transition cursor-pointer shadow-md shadow-blue-900/20"
            >
              <span className="material-symbols-rounded text-lg">add_a_photo</span>
              <span>ENVIAR NOVA FOTO</span>
            </button>
          </div>

          {/* Adendo Discreto de Privacidade e Proteção de Imagem */}
          <div className="flex items-center justify-between gap-2.5 px-3.5 py-2 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-sm">shield</span>
              </span>
              <p className="text-[11px] sm:text-xs font-semibold text-amber-900 truncate">
                <strong className="font-black text-amber-950">Adendo:</strong> Fotos de menores de 18 anos exigem consentimento prévio dos responsáveis.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowGuidelinesModal(true)}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>Orientações</span>
              <span className="material-symbols-rounded text-xs">info</span>
            </button>
          </div>

          {/* Barra de Filtros e Busca - Lado a Lado */}
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl border-2 border-gray-100 shadow-xs flex flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-2.5">
            {/* Campo de Busca */}
            <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
              <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none select-none">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por título, legenda, autor ou escola..."
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

            {/* Menu Suspenso de Clubes */}
            <div className="w-full sm:w-auto lg:w-64 shrink-0">
              <div className="relative">
                <span className="material-symbols-rounded absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">
                  groups
                </span>
                <select
                  value={selectedClube}
                  onChange={(e) => setSelectedClube(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer appearance-none truncate"
                >
                  <option value="TODOS">Todos os Clubes ({fotos.length})</option>
                  {clubesList.map((clube) => (
                    <option key={clube} value={clube}>
                      {clube}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-rounded absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Limpar Filtros se Ativo */}
            {(selectedClube !== 'TODOS' || search !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClube('TODOS');
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

          {/* Grid de Imagens da Galeria */}
          {filteredFotos.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-2">
              <span className="material-symbols-rounded text-5xl text-gray-300">image_not_supported</span>
              <h3 className="text-base font-bold text-gray-700">Nenhuma foto encontrada</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Tente ajustar a busca ou seja o primeiro a publicar um registro prático na galeria!
              </p>
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="mt-3 px-4 py-2 bg-cetecBlue text-white font-black rounded-xl text-xs hover:bg-blue-800 transition cursor-pointer"
              >
                Enviar Foto Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFotos.map((foto) => (
                <article
                  key={foto.id}
                  onClick={() => setSelectedFoto(foto)}
                  className="bg-white rounded-2xl sm:rounded-[1.5rem] border-2 border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group text-left"
                >
                  {/* Foto com hover sutil */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                    <img
                      src={foto.url}
                      alt={foto.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-rounded text-sm">visibility</span>
                        Clique para ver detalhes e descrição
                      </span>
                    </div>
                    {(foto.clubeNome || foto.escola) && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/95 text-cetecBlue backdrop-blur-xs border border-white/40 shadow-xs flex items-center gap-1 max-w-[85%]">
                        <span className="material-symbols-rounded text-xs shrink-0">groups</span>
                        <span className="truncate">{foto.clubeNome || foto.escola}</span>
                      </span>
                    )}
                  </div>

                  {/* Conteúdo textual */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-gray-900 group-hover:text-cetecBlue transition line-clamp-1 mb-1">
                        {foto.titulo}
                      </h3>
                      <p className="text-xs text-gray-600 font-medium line-clamp-2 leading-snug">
                        {foto.legenda}
                      </p>
                    </div>

                    {/* Rodapé do Card: Data e Ação */}
                    <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
                        <span className="material-symbols-rounded text-sm text-gray-400">event</span>
                        <span>{new Date(foto.dataEnvio).toLocaleDateString('pt-BR')}</span>
                      </div>

                      <span className="text-[11px] font-bold text-cetecBlue flex items-center gap-0.5 group-hover:underline">
                        Ver detalhes
                        <span className="material-symbols-rounded text-xs">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalhes da Foto */}
      <FotoDetailModal
        foto={selectedFoto}
        onClose={() => setSelectedFoto(null)}
        onCurtir={handleCurtir}
        onDelete={handleDeleteFoto}
        canDelete={isAdmin || (selectedFoto ? selectedFoto.autor === userName : false)}
      />

      {/* Modal de Envio de Nova Foto */}
      <FotoUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={handleSaveNovaFoto}
        currentUser={userName}
        clubes={clubes}
      />

      {/* Modal Informativo com as Diretrizes Completas */}
      <BaseModal
        open={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
        title="Diretrizes de Privacidade e Proteção de Imagem"
        size="md"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Em conformidade com a LGPD e as diretrizes pedagógicas municipais, fotos de menores de 18 anos exigem autorização formal prévia e termo de consentimento dos pais ou responsáveis legais.
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <strong className="block font-black text-slate-800 mb-0.5">1. Foco nos Protótipos</strong>
              Priorize enquadramentos focados nos robôs, circuitos, telas de código e montagens maker.
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <strong className="block font-black text-slate-800 mb-0.5">2. Termo de Consentimento</strong>
              Caso apareçam rostos de estudantes, verifique se a escola possui a autorização de uso de imagem assinada pelos responsáveis.
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <strong className="block font-black text-slate-800 mb-0.5">3. Proteção de Dados</strong>
              Evite que documentos, crachás com nomes completos ou dados sensíveis fiquem legíveis na imagem.
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowGuidelinesModal(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
