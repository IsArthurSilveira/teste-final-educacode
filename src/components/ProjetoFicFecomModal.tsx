import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { ModalidadeProjeto, ProjetoFicFecom } from '../data/defaultProjetosFicFecom';
import { BaseModal } from './ui/BaseModal';

interface ProjetoFicFecomModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (projeto: ProjetoFicFecom) => void;
  projetoToEdit?: ProjetoFicFecom | null;
  utecOptions?: Array<{ value: string; label: string }>;
}

const RECURSOS_DISPONIVEIS = ['Humanóide NAO', 'EV3', 'WeDo', 'Arduino/maker', 'outro'];

export function ProjetoFicFecomModal({
  open,
  onClose,
  onSubmit,
  projetoToEdit,
  utecOptions = [],
}: ProjetoFicFecomModalProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'integrantes' | 'metodologia' | 'robotica' | 'bncc'>('geral');

  // Form states
  const [titulo, setTitulo] = useState('');
  const [modalidade, setModalidade] = useState<ModalidadeProjeto>('FIC');
  const [escola, setEscola] = useState('');
  const [utec, setUtec] = useState('');
  const [professor, setProfessor] = useState('');
  const [estagiario, setEstagiario] = useState('');
  const [status, setStatus] = useState<'pendente' | 'em_andamento' | 'concluido'>('em_andamento');

  // Integrantes
  const [integrantesList, setIntegrantesList] = useState<IntegranteProjeto[]>([]);
  const [novoIntegranteNome, setNovoIntegranteNome] = useState('');
  const [novoIntegranteMatricula, setNovoIntegranteMatricula] = useState('');
  const [novoIntegranteAno, setNovoIntegranteAno] = useState('');
  const [novoIntegranteGenero, setNovoIntegranteGenero] = useState<'M' | 'F'>('M');
  const [novoIntegranteTamanho, setNovoIntegranteTamanho] = useState('M');
  const [mostrarImportacaoLote, setMostrarImportacaoLote] = useState(false);
  const [integrantesLoteTexto, setIntegrantesLoteTexto] = useState('');

  // Perguntas do formulário da mostra
  const [justificativaTematica, setJustificativaTematica] = useState('');
  const [processoConstrucao, setProcessoConstrucao] = useState('');
  const [pensarBrincando, setPensarBrincando] = useState('');
  const [propositoColetivo, setPropositoColetivo] = useState('');
  const [recursosRobotica, setRecursosRobotica] = useState<string[]>([]);
  const [recursosOutroDescricao, setRecursosOutroDescricao] = useState('');

  // BNCC e conteúdos
  const [conteudosEscolares, setConteudosEscolares] = useState('');
  const [competenciasBncc, setCompetenciasBncc] = useState('');
  const [habilidadesBncc, setHabilidadesBncc] = useState('');

  useEffect(() => {
    if (projetoToEdit) {
      setTitulo(projetoToEdit.titulo || '');
      setModalidade(projetoToEdit.modalidade || 'FIC');
      setEscola(projetoToEdit.escola || '');
      setUtec(projetoToEdit.utec || '');
      setProfessor(projetoToEdit.professor || '');
      setEstagiario(projetoToEdit.estagiario || '');
      setStatus(projetoToEdit.status || 'em_andamento');
      setJustificativaTematica(projetoToEdit.justificativaTematica || '');
      setProcessoConstrucao(projetoToEdit.processoConstrucao || '');
      setPensarBrincando(projetoToEdit.pensarBrincando || '');
      setPropositoColetivo(projetoToEdit.propositoColetivo || '');
      setRecursosRobotica(projetoToEdit.recursosRobotica || []);
      setRecursosOutroDescricao(projetoToEdit.recursosOutroDescricao || '');
      setConteudosEscolares(projetoToEdit.conteudosEscolares || '');
      setCompetenciasBncc(projetoToEdit.competenciasBncc || '');
      setHabilidadesBncc(projetoToEdit.habilidadesBncc || '');

      setIntegrantesList(
        (projetoToEdit.integrantesList || []).map((i, idx) => ({
          id: i.id || `int-${Date.now()}-${idx}`,
          nome: i.nome || '',
          matricula: i.matricula || `2025${String(idx + 1).padStart(4, '0')}`,
          anoEscolar: i.anoEscolar || '8º Ano',
          genero: (i.genero === 'F' ? 'F' : 'M') as 'M' | 'F',
          tamanhoCamisa: i.tamanhoCamisa || 'M',
        }))
      );
    } else {
      setTitulo('');
      setModalidade('FIC');
      setEscola('');
      setUtec('');
      setProfessor('');
      setEstagiario('');
      setStatus('em_andamento');
      setIntegrantesList([]);
      setNovoIntegranteNome('');
      setNovoIntegranteMatricula('');
      setNovoIntegranteAno('');
      setNovoIntegranteGenero('M');
      setNovoIntegranteTamanho('M');
      setJustificativaTematica('');
      setProcessoConstrucao('');
      setPensarBrincando('');
      setPropositoColetivo('');
      setRecursosRobotica(['Arduino/maker']);
      setRecursosOutroDescricao('');
      setConteudosEscolares('');
      setCompetenciasBncc('');
      setHabilidadesBncc('');
    }
    setActiveTab('geral');
  }, [projetoToEdit, open]);

  function handleAddIntegrante() {
    if (!novoIntegranteNome.trim()) return;
    const novo: IntegranteProjeto = {
      id: `int-${Date.now()}`,
      nome: novoIntegranteNome.trim(),
      matricula: novoIntegranteMatricula.trim() || `2025${Math.floor(1000 + Math.random() * 9000)}`,
      anoEscolar: novoIntegranteAno.trim() || '8º Ano',
      genero: novoIntegranteGenero,
      tamanhoCamisa: novoIntegranteTamanho || 'M',
    };
    setIntegrantesList([...integrantesList, novo]);
    setNovoIntegranteNome('');
    setNovoIntegranteMatricula('');
    setNovoIntegranteAno('');
  }

  function handleRemoveIntegrante(id: string) {
    setIntegrantesList(integrantesList.filter((i) => i.id !== id));
  }

  function handleImportarLote() {
    if (!integrantesLoteTexto.trim()) return;
    const lines = integrantesLoteTexto.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: IntegranteProjeto[] = lines.map((line, idx) => {
      const parts = line.split('-').map((p) => p.trim());
      return {
        id: `int-${Date.now()}-${idx}`,
        nome: parts[0] || `Aluno ${idx + 1}`,
        matricula: parts[1] || `2025${Math.floor(1000 + Math.random() * 9000)}`,
        anoEscolar: parts[2] || '8º Ano',
        genero: 'M' as const,
        tamanhoCamisa: 'M',
      };
    });
    setIntegrantesList([...integrantesList, ...parsed]);
    setIntegrantesLoteTexto('');
    setMostrarImportacaoLote(false);
  }

  function handleToggleRecurso(recurso: string) {
    if (recursosRobotica.includes(recurso)) {
      setRecursosRobotica(recursosRobotica.filter((r) => r !== recurso));
    } else {
      setRecursosRobotica([...recursosRobotica, recurso]);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const projetoPayload: ProjetoFicFecom = {
      id: projetoToEdit?.id || `proj-${Date.now()}`,
      titulo: titulo.trim(),
      modalidade,
      escola: escola.trim(),
      utec: utec.trim(),
      professor: professor.trim() || 'A definir',
      estagiario: estagiario.trim(),
      status,
      dataCadastro: projetoToEdit?.dataCadastro || new Date().toISOString().split('T')[0],
      integrantesList,
      justificativaTematica: justificativaTematica.trim(),
      processoConstrucao: processoConstrucao.trim(),
      pensarBrincando: pensarBrincando.trim(),
      linguagensUsadas: ['Scratch', 'Robótica'],
      propositoColetivo: propositoColetivo.trim(),
      recursosRobotica,
      recursosOutroDescricao: recursosOutroDescricao.trim(),
      conteudosEscolares: conteudosEscolares.trim(),
      competenciasBncc: competenciasBncc.trim(),
      habilidadesBncc: habilidadesBncc.trim(),
    };

    onSubmit(projetoPayload);
    onClose();
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={projetoToEdit ? 'Editar Projeto FIC / FECOM' : 'Cadastrar Novo Projeto FIC / FECOM'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Banner Superior com Ícone Temático */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 via-emerald-50/50 to-blue-50 rounded-2xl border border-blue-200/80">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cetecBlue to-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-rounded text-2xl">science</span>
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black text-gray-900 tracking-tight">
              {projetoToEdit ? `Edição: ${projetoToEdit.titulo}` : 'Formulário Oficial de Submissão de Projetos'}
            </h4>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Reúna as informações do projeto (FIC / FECOM), integrantes, recursos e alinhamento à BNCC.
            </p>
          </div>
        </div>

        {/* Abas de Navegação no Formulário */}
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl overflow-x-auto text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              activeTab === 'geral' ? 'bg-white text-cetecBlue shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            1. Identificação
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('integrantes')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              activeTab === 'integrantes' ? 'bg-white text-cetecBlue shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            2. Integrantes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metodologia')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              activeTab === 'metodologia' ? 'bg-white text-cetecBlue shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            3. Temática & Propósito
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('robotica')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              activeTab === 'robotica' ? 'bg-white text-cetecBlue shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            4. Recursos & Código
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bncc')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              activeTab === 'bncc' ? 'bg-white text-cetecBlue shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            5. Alinhamento BNCC
          </button>
        </div>

        {/* ============================================================ */}
        {/* ABA 1: IDENTIFICAÇÃO BÁSICA */}
        {/* ============================================================ */}
        {activeTab === 'geral' && (
          <div className="space-y-3.5 animate-[fadeIn_0.2s_ease-in-out]">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                3. Título do Projeto *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título do projeto"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Modalidade do Projeto *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalidade('FIC')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition cursor-pointer ${
                      modalidade === 'FIC'
                        ? 'bg-cetecBlue text-white border-cetecBlue shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    FIC
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalidade('FECOM')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition cursor-pointer ${
                      modalidade === 'FECOM'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    FECOM
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Status do Projeto
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen cursor-pointer"
                >
                  <option value="em_andamento">EM ANDAMENTO</option>
                  <option value="concluido">CONCLUÍDO</option>
                  <option value="pendente">PENDENTE</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  1. Escola do Projeto *
                </label>
                <input
                  type="text"
                  value={escola}
                  onChange={(e) => setEscola(e.target.value)}
                  placeholder="Nome da Escola Municipal"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  1. UTEC de Referência *
                </label>
                <select
                  value={utec}
                  onChange={(e) => setUtec(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen"
                  required
                >
                  <option value="" disabled>Selecione uma UTEC</option>
                  {utecOptions.map((option) => (
                    <option key={option.value} value={option.label}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Professor Orientador
                </label>
                <input
                  type="text"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  placeholder="Nome do(a) professor(a)"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Técnico / Estagiário(a)
                </label>
                <input
                  type="text"
                  value={estagiario}
                  onChange={(e) => setEstagiario(e.target.value)}
                  placeholder="Nome do estagiário de robótica"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 2: INTEGRANTES DA EQUIPE */}
        {/* ============================================================ */}
        {activeTab === 'integrantes' && (
          <div className="space-y-4 animate-[fadeIn_0.2s_ease-in-out]">
            <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-rounded text-base text-cetecBlue">person_add</span>
                  Adicionar Integrante à Equipe
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarImportacaoLote(!mostrarImportacaoLote)}
                  className="text-[11px] font-bold text-cetecBlue hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-rounded text-sm">swap_horiz</span>
                  {mostrarImportacaoLote ? 'Formulário Normal' : 'Importar em Lote'}
                </button>
              </div>

              {mostrarImportacaoLote ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-500 font-medium">
                    Cole as linhas no formato: <strong>Nome - Matrícula - Ano Escolar</strong>
                  </p>
                  <textarea
                    value={integrantesLoteTexto}
                    onChange={(e) => setIntegrantesLoteTexto(e.target.value)}
                    rows={4}
                    placeholder="Exemplo:&#10;Mariana Duarte - 20250012 - 8º Ano B&#10;Arthur Silveira - 20250015 - 9º Ano A"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-cetecGreen font-mono"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleImportarLote}
                      className="px-3 py-1.5 rounded-xl bg-cetecBlue hover:bg-blue-700 text-white text-xs font-black cursor-pointer shadow-xs"
                    >
                      Inserir Linhas
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Nome do Aluno *
                      </label>
                      <input
                        type="text"
                        value={novoIntegranteNome}
                        onChange={(e) => setNovoIntegranteNome(e.target.value)}
                        placeholder="Nome completo do aluno"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Matrícula *
                      </label>
                      <input
                        type="text"
                        value={novoIntegranteMatricula}
                        onChange={(e) => setNovoIntegranteMatricula(e.target.value)}
                        placeholder="Ex: 20250123"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Ano / Turma
                      </label>
                      <input
                        type="text"
                        value={novoIntegranteAno}
                        onChange={(e) => setNovoIntegranteAno(e.target.value)}
                        placeholder="Ex: 8º Ano A"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Gênero do Aluno *
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNovoIntegranteGenero('M')}
                          className={`py-1.5 px-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1 transition cursor-pointer ${
                            novoIntegranteGenero === 'M'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span className="material-symbols-rounded text-sm">male</span>
                          <span>Masc (M)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNovoIntegranteGenero('F')}
                          className={`py-1.5 px-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1 transition cursor-pointer ${
                            novoIntegranteGenero === 'F'
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span className="material-symbols-rounded text-sm">female</span>
                          <span>Fem (F)</span>
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-7">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Tamanho de Camisa *
                      </label>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                        {['10', '12', '14', '16', 'PP', 'P', 'M', 'G', 'GG', 'XGG'].map((tamanho) => (
                          <button
                            key={tamanho}
                            type="button"
                            onClick={() => setNovoIntegranteTamanho(tamanho)}
                            className={`py-1.5 rounded-lg text-[11px] font-black border transition cursor-pointer ${
                              novoIntegranteTamanho === tamanho
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {tamanho}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddIntegrante}
                      disabled={!novoIntegranteNome.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-rounded text-base">add</span>
                      Adicionar Integrante
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Integrantes Cadastrados */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                  Integrantes Cadastrados ({integrantesList.length})
                </span>
                {integrantesList.length === 0 && (
                  <span className="text-[11px] text-amber-600 font-bold">
                    Adicione pelo menos 1 integrante
                  </span>
                )}
              </div>

              {integrantesList.length === 0 ? (
                <div className="p-4 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <p className="text-xs font-bold text-gray-400">
                    Nenhum aluno integrante adicionado. Preencha os campos acima para cadastrar.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {integrantesList.map((aluno) => (
                    <div
                      key={aluno.id}
                      className="p-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-gray-300 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                            aluno.genero === 'F' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <span className="material-symbols-rounded text-sm">
                            {aluno.genero === 'F' ? 'female' : 'male'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="block font-black text-xs text-gray-900 truncate">
                            {aluno.nome}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              Mat: {aluno.matricula}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {aluno.anoEscolar}
                            </span>
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                aluno.genero === 'F'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {aluno.genero === 'F' ? 'Fem (F)' : 'Masc (M)'}
                            </span>
                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <span className="material-symbols-rounded text-[11px]">apparel</span>
                              Camisa: {aluno.tamanhoCamisa || 'M'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveIntegrante(aluno.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                        title="Remover integrante"
                      >
                        <span className="material-symbols-rounded text-base">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 3: TEMÁTICA & PROPÓSITO COLETIVO */}
        {/* ============================================================ */}
        {activeTab === 'metodologia' && (
          <div className="space-y-3.5 animate-[fadeIn_0.2s_ease-in-out]">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                4. Justificativa dos principais motivos da escolha da temática *
              </label>
              <p className="text-[11px] text-gray-500 mb-1.5 font-medium">
                Por que escolheram essa temática? O que esse Projeto significa para sua equipe?
              </p>
              <textarea
                value={justificativaTematica}
                onChange={(e) => setJustificativaTematica(e.target.value)}
                rows={3}
                placeholder="Descreva a motivação da equipe, a relevância local ou problema enfrentado..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-cetecGreen resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                7. O P de Propósito e o Bem Comum *
              </label>
              <p className="text-[11px] text-gray-500 mb-1.5 font-medium">
                Qual é o objetivo mobilizador? Visando aspectos sociais, culturais e/ou ambientais, qual a importância para o bem coletivo?
              </p>
              <textarea
                value={propositoColetivo}
                onChange={(e) => setPropositoColetivo(e.target.value)}
                rows={3}
                placeholder="Fale um pouco sobre a importância do Projeto no que diz respeito ao bem coletivo..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-cetecGreen resize-none"
                required
              />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 4: RECURSOS & O PENSAR BRINCANDO */}
        {/* ============================================================ */}
        {activeTab === 'robotica' && (
          <div className="space-y-3.5 animate-[fadeIn_0.2s_ease-in-out]">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                9. Quais os recursos de robótica usados no desenvolvimento do projeto? *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {RECURSOS_DISPONIVEIS.map((rec) => {
                  const checked = recursosRobotica.includes(rec);
                  return (
                    <button
                      key={rec}
                      type="button"
                      onClick={() => handleToggleRecurso(rec)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition cursor-pointer text-left ${
                        checked
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                        checked ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300'
                      }`}>
                        {checked && '✓'}
                      </span>
                      <span>{rec}</span>
                    </button>
                  );
                })}
              </div>

              {recursosRobotica.includes('outro') && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={recursosOutroDescricao}
                    onChange={(e) => setRecursosOutroDescricao(e.target.value)}
                    placeholder="Especifique outros recursos utilizados (ex: sensores, materiais reciclados...)"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-cetecGreen"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                5. Processo de construção e participação dos integrantes *
              </label>
              <textarea
                value={processoConstrucao}
                onChange={(e) => setProcessoConstrucao(e.target.value)}
                rows={2}
                placeholder="Conte um pouco como foi a participação de cada integrante durante o desenvolvimento..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-cetecGreen resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                6. O Pensar Brincando com Linguagem de Programação *
              </label>
              <textarea
                value={pensarBrincando}
                onChange={(e) => setPensarBrincando(e.target.value)}
                rows={2}
                placeholder="Como foi a descoberta da equipe ao experimentar e testar o recurso/dispositivo escolhido? O que aprenderam brincando?"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-cetecGreen resize-none"
              />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 5: ALINHAMENTO COM A BNCC & CONTEÚDOS ESCOLARES */}
        {/* ============================================================ */}
        {activeTab === 'bncc' && (
          <div className="space-y-3.5 animate-[fadeIn_0.2s_ease-in-out]">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Quais os conteúdos escolares presentes no projeto? *
              </label>
              <textarea
                value={conteudosEscolares}
                onChange={(e) => setConteudosEscolares(e.target.value)}
                rows={2}
                placeholder="Ex: Ciências (ecossistemas, poluição da água), Geografia (bacias hidrográficas), Matemática (gráficos e estatística)..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-cetecGreen resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Quais as competências da BNCC e BNCC da computação presentes no projeto? *
              </label>
              <textarea
                value={competenciasBncc}
                onChange={(e) => setCompetenciasBncc(e.target.value)}
                rows={2}
                placeholder="Ex: Competência Geral 2 (Pensamento científico), Competência da Computação (Pensamento Computacional, Análise de Dados)..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-cetecGreen resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Quais as habilidades da BNCC e BNCC da computação presentes no projeto? *
              </label>
              <textarea
                value={habilidadesBncc}
                onChange={(e) => setHabilidadesBncc(e.target.value)}
                rows={2}
                placeholder="Ex: EF08CI05, EF07GE09, EF08MA23 (Coleta e interpretação de dados)..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-cetecGreen resize-none"
                required
              />
            </div>
          </div>
        )}

        {/* Rodapé com Navegação / Salvar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex gap-2">
            {activeTab !== 'bncc' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'geral') setActiveTab('integrantes');
                  else if (activeTab === 'integrantes') setActiveTab('metodologia');
                  else if (activeTab === 'metodologia') setActiveTab('robotica');
                  else if (activeTab === 'robotica') setActiveTab('bncc');
                }}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-black transition cursor-pointer"
              >
                Próximo Passo →
              </button>
            ) : null}

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cetecGreen hover:bg-[#7ed152] text-white text-xs font-black transition cursor-pointer shadow-xs"
            >
              {projetoToEdit ? 'Atualizar Projeto' : 'Salvar Projeto'}
            </button>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
