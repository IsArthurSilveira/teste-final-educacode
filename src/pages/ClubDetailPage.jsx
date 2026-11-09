import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { BaseModal } from '../components/ui/BaseModal';
import { FormSelect } from '../components/ui/FormSelect';
import { FormTextInput } from '../components/ui/FormTextInput';
import { ModalActionRow } from '../components/ui/ModalActionRow';
import { formatDateBR, statusKey, toUpperTextPreserveSpaces } from '../utils/clubes';
import { canCreateAluno, canCreateEncontro, canDeleteAluno, canDeleteEncontro, canUpdateStatus, canEditEncontro } from '../utils/permissions';

export function ClubDetailPage({ userName, userRole, allowAdminTools = false, allowUsersTools = false, onLogout, onOpenNewClubModal, onOpenAdminDeleteClubs, onOpenAdminUsers, clubes, details, detailsLoading = false, detailsError, onLoadDetails, onRefresh, onSaveClub, onSaveAluno, onDeleteAluno, onSaveEncontro, onDeleteEncontro, onUpdateStatus }) {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const routeClubId = decodeURIComponent(String(clubId || '')).trim();
  const [statusValue, setStatusValue] = useState('pendente');
  const [showAlunoModal, setShowAlunoModal] = useState(false);
  const [showEncontroModal, setShowEncontroModal] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAluno, setSavingAluno] = useState(false);
  const [savingEncontro, setSavingEncontro] = useState(false);
  const [savingEstag, setSavingEstag] = useState(false);
  const [actionError, setActionError] = useState('');
  const [alunoLoadingMap, setAlunoLoadingMap] = useState({});
  const [encontroLoadingMap, setEncontroLoadingMap] = useState({});
  const [confirmRemoval, setConfirmRemoval] = useState(null);
  const [novoAluno, setNovoAluno] = useState({ matricula: '', nome: '' });
  const [novoEncontro, setNovoEncontro] = useState({ modulo: '', assunto: '', detalhamento: '', frequencia: '', quantidadeAlunos: '', data: '' });
  const meetingSearch = '';
  const [showEstagModal, setShowEstagModal] = useState(false);
  const [novoEstag, setNovoEstag] = useState('');

  const club = useMemo(() => clubes.find((item) => isSameClubId(item.id, routeClubId)) || null, [clubes, routeClubId]);
  const allowCreateAluno = canCreateAluno(userRole);
  const allowCreateEncontro = canCreateEncontro(userRole);
  const allowDeleteAluno = canDeleteAluno(userRole);
  const allowDeleteEncontro = canDeleteEncontro(userRole);
  const allowEditEncontro = canEditEncontro(userRole);
  const allowUpdateStatus = canUpdateStatus(userRole);
  const returnTo = location.state?.from || '/clubes';
  const encontros = useMemo(() => details?.encontros || [], [details]);
  const alunos = useMemo(() => details?.alunos || [], [details]);
  const meetingSections = useMemo(() => getMeetingSections(club.categoria), [club.categoria]);
  const encontrosFiltrados = useMemo(() => filterMeetings(encontros, meetingSearch, club), [encontros, meetingSearch, club]);
  const encontrosPorModulo = useMemo(() => groupMeetingsByModulo(encontrosFiltrados, meetingSections), [encontrosFiltrados, meetingSections]);

  useEffect(() => {
    if (club?.id) {
      onLoadDetails(club.id);
    }
  }, [club?.id, onLoadDetails]);

  useEffect(() => {
    if (club?.status) setStatusValue(statusKey(club.status));
  }, [club]);

  if (!club) {
    return (
      <main className="panel-shell">
        <div className="ui-state-panel ui-state-panel--empty">
          <p className="state-note state-error">Clube não encontrado.</p>
          <button className="btn-primary btn-ghost" type="button" onClick={() => navigate('/dashboard')}>Voltar</button>
        </div>
      </main>
    );
  }

  async function refreshDetails() {
    await onRefresh();
    await onLoadDetails(club.id);
  }

  async function handleUpdateClubStatus(nextStatus) {
    setStatusValue(nextStatus);
    setSavingStatus(true);
    setActionError('');
    try {
      const response = await onUpdateStatus({ acao: 'atualizar_status_clube', id_clube: club.id, status: statusValueToBackend(nextStatus) });
      if (response?.sucesso) {
        await refreshDetails();
      } else {
        setStatusValue(statusKey(club.status) || 'pendente');
        setActionError(getErrorMessage(response, 'Não foi possível atualizar o status do clube.'));
      }
    } catch {
      setStatusValue(statusKey(club.status) || 'pendente');
      setActionError('Não foi possível atualizar o status do clube.');
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleSaveAluno(event) {
    event.preventDefault();
    setSavingAluno(true);
    setActionError('');
    try {
      const response = await onSaveAluno({ acao: 'salvar_aluno', id_clube: club.id, matricula: novoAluno.matricula || 'S/ MATRÍCULA', nome: novoAluno.nome });
      if (response?.sucesso) {
        setNovoAluno({ matricula: '', nome: '' });
        setShowAlunoModal(false);
        await refreshDetails();
      } else {
        setActionError(getErrorMessage(response, 'Não foi possível salvar o aluno.'));
      }
    } catch {
      setActionError('Não foi possível salvar o aluno.');
    } finally {
      setSavingAluno(false);
    }
  }

  function openEncontroModal() {
    setActionError('');
    setNovoEncontro({
      modulo: meetingSections[0]?.value || '',
      assunto: '',
      detalhamento: '',
      frequencia: '',
      quantidadeAlunos: String(alunos.length || 0),
      data: '',
    });
    setShowEncontroModal(true);
  }

  function openEditEncontroModal(enc) {
    setActionError('');
    const moduloValue = resolveMeetingModulo(enc.modulo, meetingSections) || enc.modulo || meetingSections[0]?.value || '';
    // Normalize date from multiple possible shapes: 'YYYY-MM-DD', 'DD/MM/YYYY', '2026-05-29T13:42:37.878Z'
    const rawDate = enc.data || enc.Data || enc.DATA || enc['Data'] || enc['DATA'] || '';
    let dataValue = '';
    function normalizeDateString(s) {
      const t = String(s || '').trim();
      if (!t) return '';
      if (t.includes('T')) return t.split('T')[0];
      if (t.includes('/')) {
        const parts = t.split('/').map((p) => p.padStart(2, '0'));
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return `${y}-${m}-${d}`;
        }
      }
      const match = t.match(/(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : t;
    }

    if (rawDate) dataValue = normalizeDateString(rawDate);
    // If still empty, try to discover any date-like substring in the whole record (defensive)
    if (!dataValue) {
      try {
        const text = Object.values(enc || {}).join(' ');
        const isoMatch = String(text).match(/(\d{4}-\d{2}-\d{2})/);
        if (isoMatch) dataValue = isoMatch[1];
        else {
          const dmyMatch = String(text).match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
          if (dmyMatch) dataValue = normalizeDateString(dmyMatch[1]);
        }
      } catch {
        // ignore
      }
    }
    setNovoEncontro({
      id: enc.id,
      modulo: moduloValue,
      assunto: enc.assunto || '',
      detalhamento: enc.detalhamento || enc.Detalhamento || '',
      frequencia: String(enc.frequencia || enc['Frequência'] || ''),
      quantidadeAlunos: String(enc.quantidadeAlunos || enc['Quantidade de Alunos'] || ''),
      data: dataValue,
    });
    setShowEncontroModal(true);
  }

  function handleAlunoMatriculaChange(value) {
    const sanitized = String(value || '').replace(/\D/g, '').slice(0, 10);
    setNovoAluno((curr) => ({ ...curr, matricula: sanitized }));
  }

  async function handleSaveEncontro(event) {
    event.preventDefault();
    setSavingEncontro(true);
    setActionError('');
    try {
      const payload = {
        acao: 'salvar_encontro',
        id_clube: club.id,
        modulo: novoEncontro.modulo,
        assunto: novoEncontro.assunto,
        detalhamento: novoEncontro.detalhamento,
        frequencia: normalizeDigits(novoEncontro.frequencia),
        quantidade_alunos: normalizeDigits(novoEncontro.quantidadeAlunos),
        data: novoEncontro.data,
      };
      if (novoEncontro.id) payload.id_encontro = novoEncontro.id;
      const response = await onSaveEncontro(payload);
      if (response?.sucesso) {
        setNovoEncontro({ modulo: meetingSections[0]?.value || '', assunto: '', detalhamento: '', frequencia: '', quantidadeAlunos: '', data: '' });
        setShowEncontroModal(false);
        await refreshDetails();
      } else {
        setActionError(getErrorMessage(response, 'Não foi possível salvar o encontro.'));
      }
    } catch {
      setActionError('Não foi possível salvar o encontro.');
    } finally {
      setSavingEncontro(false);
    }
  }

  function openEditEstagModal() {
    setActionError('');
    setNovoEstag(String(club.estag || '').trim() === '-' ? '' : String(club.estag || ''));
    setShowEstagModal(true);
  }

  async function handleSaveEstag(event) {
    event.preventDefault();
    if (!onSaveClub) return;

    setSavingEstag(true);
    setActionError('');
    try {
      const response = await onSaveClub({
        acao: 'atualizar_clube',
        id_clube: club.id,
        nome: club.nome,
        escola: club.escola,
        utec: club.utec,
        prof: club.prof,
        estag: novoEstag,
        dias: club.dias,
        horario: club.horario,
        categoria: club.categoria,
        status: club.status,
      });

      if (response?.sucesso) {
        setShowEstagModal(false);
        await refreshDetails();
      } else {
        setActionError(getErrorMessage(response, 'Não foi possível atualizar o nome do estagiário.'));
      }
    } catch {
      setActionError('Não foi possível atualizar o nome do estagiário.');
    } finally {
      setSavingEstag(false);
    }
  }

  async function toggleEncontroStatus(encontro) {
    if (!encontro?.id) {
      const msg = 'Este encontro não possui um identificador (id). Sincronize os dados ou contate o suporte.';
      console.warn('toggleEncontroStatus: encontro sem id', encontro);
      setActionError(msg);
      return;
    }

    setEncontroLoadingMap((curr) => ({ ...curr, [encontro.id]: true }));
    const novoStatus = String(encontro.status || '').toUpperCase() === 'FEITO' ? 'A FAZER' : 'FEITO';
    try {
      const payload = { acao: 'atualizar_status_encontro', id_encontro: encontro.id, status: novoStatus };
      console.log('toggleEncontroStatus -> payload:', payload);
      const response = await onUpdateStatus(payload);
      console.log('toggleEncontroStatus <- response:', response);
      if (response?.sucesso) await refreshDetails();
    } catch (err) {
      console.error('toggleEncontroStatus error', err);
      throw err;
    } finally {
      setEncontroLoadingMap((curr) => ({ ...curr, [encontro.id]: false }));
    }
  }

  async function removeEncontro(encontro) {
    const encontroKey = encontro?.id || `${encontro?.modulo || ''}-${encontro?.assunto || ''}-${encontro?.data || ''}`;
    if (!encontroKey) return;

    setEncontroLoadingMap((curr) => ({ ...curr, [encontroKey]: true }));
    try {
      setActionError('');
      if (!encontro?.id) {
        const msg = 'Este encontro não possui um identificador (id). Não é possível remover sem id.';
        setActionError(msg);
        console.warn('removeEncontro: encontro sem id', encontro);
        return;
      }

      const payloadPrimary = { acao: 'remover_encontro', id_encontro: encontro?.id || '' };
      console.log('removeEncontro -> trying primary payload:', payloadPrimary);
      let response = await onDeleteEncontro(payloadPrimary);
      if (!isSuccessResponse(response)) {
        const payloadFallback = { acao: 'excluir_encontro', id_encontro: encontro?.id || '' };
        console.log('removeEncontro -> primary failed, trying fallback payload:', payloadFallback);
        response = await onDeleteEncontro(payloadFallback);
      }

      if (isSuccessResponse(response)) {
        await refreshDetails();
      } else {
        setActionError(getErrorMessage(response, 'Não foi possível remover o encontro.'));
      }
    } catch {
      setActionError('Não foi possível remover o encontro.');
    } finally {
      setEncontroLoadingMap((curr) => ({ ...curr, [encontroKey]: false }));
    }
  }

  async function removeAluno(aluno) {
    if (!aluno) return;

    const alunoKey = aluno.id || `${aluno?.matricula || ''}-${aluno?.nome || ''}`;
    if (!alunoKey) return;

    setAlunoLoadingMap((curr) => ({ ...curr, [alunoKey]: true }));
    try {
      setActionError('');
      const basePayload = {
        id_aluno: aluno?.id || '',
        idAluno: aluno?.id || '',
        id: aluno?.id || '',
        id_clube: club.id,
        matricula: aluno?.matricula || '',
        nome: aluno?.nome || '',
      };

      let response = await onDeleteAluno({ acao: 'remover_aluno', ...basePayload });
      if (!isSuccessResponse(response)) {
        response = await onDeleteAluno({ acao: 'excluir_aluno', ...basePayload });
      }

      if (isSuccessResponse(response)) {
        await refreshDetails();
      } else {
        setActionError(getErrorMessage(response, 'Não foi possível remover o aluno.'));
      }
    } catch {
      setActionError('Não foi possível remover o aluno.');
    } finally {
      setAlunoLoadingMap((curr) => ({ ...curr, [alunoKey]: false }));
    }
  }

  function requestRemoveAluno(aluno) {
    if (!aluno) return;
    setActionError('');
    setConfirmRemoval({ type: 'aluno', item: aluno });
  }

  function requestRemoveEncontro(encontro) {
    if (!encontro) return;
    setActionError('');
    setConfirmRemoval({ type: 'encontro', item: encontro });
  }

  async function handleConfirmRemoval(event) {
    event.preventDefault();
    if (!confirmRemoval) return;

    const { type, item } = confirmRemoval;
    setConfirmRemoval(null);

    if (type === 'aluno') {
      await removeAluno(item);
      return;
    }

    await removeEncontro(item);
  }

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="clubs"
        userName={userName}
        userRole={userRole}
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

      <main className="app-main-pane dashboard-main-modern flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-y-auto relative bg-white lg:h-screen">
        <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full relative z-10 bg-white">
          {(detailsError || actionError) && (
            <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 text-xs font-bold flex items-center justify-between">
              <span>{detailsError || actionError}</span>
              <button
                type="button"
                onClick={() => setActionError('')}
                className="text-red-500 hover:text-red-700 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
          {detailsLoading && (
            <div className="p-8 text-center text-xs font-bold text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
              Carregando detalhes do clube...
            </div>
          )}

          <div className="flex flex-col space-y-4 animate-[fadeIn_0.3s_ease-in-out]">
            {/* Botão de Fechar / Voltar */}
            <div className="flex justify-between items-center pb-1">
              <button
                type="button"
                onClick={() => navigate(returnTo)}
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <span className="material-symbols-rounded text-sm">arrow_back</span>
                <span>Voltar aos Clubes</span>
              </button>

              <button
                onClick={() => navigate(returnTo)}
                className="w-8 h-8 rounded-full bg-red-100 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition shadow-xs font-black text-xs flex items-center justify-center cursor-pointer"
                type="button"
                aria-label="Fechar detalhes"
                title="Fechar e Voltar"
              >
                ✕
              </button>
            </div>

            {/* Card Superior de Informações do Clube */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-blue-200 shadow-sm relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Nome e Status */}
                <div className="flex flex-col gap-2 min-w-0 lg:col-span-4">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    {club.nome}
                  </h2>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={statusValue}
                      disabled={savingStatus || !allowUpdateStatus}
                      onChange={(event) => handleUpdateClubStatus(event.target.value)}
                      className={statusSelectClass(statusValue, savingStatus || !allowUpdateStatus)}
                    >
                      <option value="pendente">PENDENTE</option>
                      <option value="em_andamento">EM ANDAMENTO</option>
                      <option value="concluido">CONCLUÍDO</option>
                    </select>

                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${categoriaBadgeClass(club.categoria)}`}>
                      {normalizeCategoriaLabel(club.categoria)}
                    </span>
                  </div>
                </div>

                {/* Informações detalhadas */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-6">
                  {/* Localização */}
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                      Localização
                    </span>
                    <p className="text-sm font-black text-gray-900 leading-tight">
                      {club.escola}
                    </p>
                    <span className="text-xs font-bold text-cetecBlue block mt-0.5">
                      {club.utec}
                    </span>
                  </div>

                  {/* Equipe Responsável */}
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                      Equipe Responsável
                    </span>
                    <p className="text-xs font-black text-gray-900">
                      <strong className="text-gray-400 font-bold">Prof:</strong> {club.prof}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-xs font-black text-emerald-800">
                        <strong className="text-gray-400 font-bold">Estagiário:</strong> {club.estag}
                      </p>
                      <button
                        type="button"
                        onClick={openEditEstagModal}
                        className="text-[9px] font-black px-1.5 py-0.5 rounded border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition shrink-0 cursor-pointer"
                        title="Editar nome do estagiário"
                      >
                        EDITAR
                      </button>
                    </div>
                  </div>

                  {/* Agenda */}
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                      Agenda dos Encontros
                    </span>
                    <p className="text-sm font-black text-gray-900 leading-tight">
                      {club.dias || 'A definir'}
                    </p>
                    <span className="text-xs font-bold text-cetecBlue block mt-0.5">
                      {club.horario || 'A definir'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Duas Colunas: Alunos na Esquerda, Cronograma na Direita */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              {/* Coluna de Alunos */}
              <div className="xl:col-span-4 bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-xs flex flex-col min-h-[380px]">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-rounded text-cetecBlue text-xl">groups</span>
                    <h3 className="font-black text-base text-gray-900">
                      Alunos do Clube ({alunos.length})
                    </h3>
                  </div>

                  {allowCreateAluno && (
                    <button
                      type="button"
                      onClick={() => setShowAlunoModal(true)}
                      className="w-8 h-8 rounded-lg bg-cetecGreen text-white font-black text-lg hover:bg-[#7ed152] transition flex items-center justify-center cursor-pointer shadow-xs"
                      title="Adicionar Aluno"
                    >
                      +
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
                  {alunos.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">
                      Nenhum aluno cadastrado neste clube ainda.
                    </p>
                  ) : (
                    alunos.map((aluno, index) => (
                      <div
                        key={aluno.id || `${aluno.nome}-${aluno.matricula}`.trim() || `aluno-${index}`}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 bg-blue-100 text-cetecBlue">
                            <span className="material-symbols-rounded text-base">person</span>
                          </div>
                          <div className="min-w-0">
                            <span className="block font-black text-xs text-gray-900 truncate">
                              {aluno.nome}
                            </span>
                            <span className="block text-[10px] font-bold text-gray-400">
                              MAT: {aluno.matricula || 'S/ MATRÍCULA'}
                            </span>
                          </div>
                        </div>

                        {allowDeleteAluno && (
                          <button
                            type="button"
                            onClick={() => requestRemoveAluno(aluno)}
                            disabled={alunoLoadingMap?.[aluno.id || `${aluno?.matricula || ''}-${aluno?.nome || ''}`]}
                            className="text-[10px] font-black text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-md px-2 py-1 transition cursor-pointer"
                          >
                            {alunoLoadingMap?.[aluno.id || `${aluno?.matricula || ''}-${aluno?.nome || ''}`] ? '...' : 'REMOVER'}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Coluna do Cronograma da Trilha */}
              <div className="xl:col-span-8 bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-xs flex flex-col min-h-[380px]">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-rounded text-cetecBlue text-xl">event_note</span>
                    <div>
                      <h3 className="font-black text-base text-gray-900">
                        Cronograma da Trilha ({encontros.length})
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Acompanhamento pedagógico dividido por módulos de aprendizagem
                      </p>
                    </div>
                  </div>

                  {allowCreateEncontro && (
                    <button
                      type="button"
                      onClick={openEncontroModal}
                      className="px-3 py-1.5 rounded-lg bg-cetecGreen hover:bg-[#7ed152] text-white font-black text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-rounded text-sm">add</span>
                      <span>Novo Encontro</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-1 pb-2 space-y-4 max-h-[600px]">
                  <div className="space-y-4">
                    {meetingSections.map((section, index) => (
                      <ModuloSection
                        key={section.value}
                        title={`${index + 1}. ${section.label}`}
                        colorClass={section.colorClass}
                        encontros={encontrosPorModulo[section.value] || []}
                        onToggleStatus={toggleEncontroStatus}
                        onRemoveEncontro={requestRemoveEncontro}
                        onEditEncontro={openEditEncontroModal}
                        onCanRemove={allowDeleteEncontro}
                        onCanEdit={allowEditEncontro}
                        onCanToggleStatus={allowUpdateStatus}
                        encontroLoadingMap={encontroLoadingMap}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Adicionar Aluno Padronizado */}
      {showAlunoModal && (
        <BaseModal
          open={showAlunoModal}
          onClose={() => setShowAlunoModal(false)}
          title="Adicionar Aluno ao Clube"
          backdropClass="fixed inset-0 bg-cetecBlue/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          sizeClass="ui-modal-card ui-modal-card--sm"
          contentAs="form"
          contentProps={{ onSubmit: handleSaveAluno }}
          bodyClass="ui-modal-body space-y-4"
        >
          <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl border border-blue-100/80">
            <div className="w-10 h-10 rounded-xl bg-cetecBlue text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-rounded text-xl">person_add</span>
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Novo Aluno</h4>
              <p className="text-[11px] font-bold text-gray-500">Cadastre o aluno participante informando matrícula e nome.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Matrícula (opcional)
            </label>
            <FormTextInput
              placeholder="Matrícula (até 10 dígitos)"
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{0,10}"
              title="Digite somente números, até 10 dígitos"
              value={novoAluno.matricula}
              onChange={(event) => handleAlunoMatriculaChange(event.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nome do Aluno *
            </label>
            <FormTextInput
              placeholder="Ex: ANA SOUZA"
              value={novoAluno.nome}
              autoCapitalize="characters"
              onChange={(event) => setNovoAluno((curr) => ({ ...curr, nome: toUpperTextPreserveSpaces(event.target.value, '') }))}
              required
            />
          </div>

          <ModalActionRow
            onCancel={() => setShowAlunoModal(false)}
            submitLabel="Salvar Aluno"
            saving={savingAluno}
          />
        </BaseModal>
      )}

      {/* Modal Adicionar Encontro Padronizado */}
      {showEncontroModal && (
        <BaseModal
          open={showEncontroModal}
          onClose={() => setShowEncontroModal(false)}
          title={novoEncontro.id ? 'Editar Encontro' : 'Adicionar Encontro'}
          backdropClass="fixed inset-0 bg-cetecBlue/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          sizeClass="ui-modal-card ui-modal-card--compact"
          contentAs="form"
          contentProps={{ onSubmit: handleSaveEncontro }}
          bodyClass="ui-modal-body space-y-4"
        >
          <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl border border-blue-100/80">
            <div className="w-10 h-10 rounded-xl bg-cetecBlue text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-rounded text-xl">event_note</span>
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                {novoEncontro.id ? 'Edição de Encontro' : 'Registro de Encontro'}
              </h4>
              <p className="text-[11px] font-bold text-gray-500">
                Preencha o módulo, assunto, frequência e o detalhamento pedagógico trabalhado.
              </p>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1 block">Módulo</span>
            <FormSelect
              value={novoEncontro.modulo}
              onChange={(event) => setNovoEncontro((curr) => ({ ...curr, modulo: event.target.value }))}
              options={meetingSections.map((section) => ({ label: section.label, value: section.value }))}
              getOptionLabel={(option) => option.label}
              getOptionKey={(option) => option.value}
            />
          </label>

          <label className="block">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1 block">Assunto</span>
            <FormTextInput
              placeholder="Ex: INTRODUÇÃO AO SCRATCH"
              value={novoEncontro.assunto}
              autoCapitalize="characters"
              onChange={(event) => setNovoEncontro((curr) => ({ ...curr, assunto: toUpperTextPreserveSpaces(event.target.value, '') }))}
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1 block">Detalhamento / Descrição</span>
            <textarea
              className="w-full min-h-[100px] px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-cetecGreen font-bold text-xs text-gray-700 resize-none"
              placeholder="Ex: jogo, quiz, atividade desplugada, introdução ao conteúdo, revisão de aula (Metodologia Ativa , Cultura Maker)"
              value={novoEncontro.detalhamento}
              onChange={(event) => setNovoEncontro((curr) => ({ ...curr, detalhamento: toUpperTextPreserveSpaces(event.target.value, '') }))}
              required
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1 block">Frequência (Presentes)</span>
              <FormTextInput
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Nº de alunos presentes"
                title="Digite somente números"
                value={novoEncontro.frequencia}
                onChange={(event) => setNovoEncontro((curr) => ({ ...curr, frequencia: normalizeDigits(event.target.value) }))}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1 block">Data</span>
              <FormTextInput
                type="date"
                placeholder="Data do encontro"
                title="Selecione a data do encontro"
                value={novoEncontro.data}
                onChange={(event) => setNovoEncontro((curr) => ({ ...curr, data: event.target.value }))}
                required
              />
            </label>
          </div>

          <ModalActionRow
            onCancel={() => setShowEncontroModal(false)}
            submitLabel="Salvar Encontro"
            saving={savingEncontro}
          />
        </BaseModal>
      )}

      {/* Modal Editar Estagiário Padronizado */}
      {showEstagModal && (
        <BaseModal
          open={showEstagModal}
          onClose={() => setShowEstagModal(false)}
          title="Editar Estagiário"
          backdropClass="fixed inset-0 bg-cetecBlue/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          sizeClass="ui-modal-card ui-modal-card--sm"
          contentAs="form"
          contentProps={{ onSubmit: handleSaveEstag }}
          bodyClass="ui-modal-body space-y-4"
        >
          <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100/80">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-rounded text-xl">badge</span>
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Equipe do Clube</h4>
              <p className="text-[11px] font-bold text-gray-500">Atualize o nome do estagiário responsável pelas aulas.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nome do Estagiário *
            </label>
            <FormTextInput
              placeholder="Ex: Arthur Silveira"
              value={novoEstag}
              autoCapitalize="characters"
              onChange={(event) => setNovoEstag(toUpperTextPreserveSpaces(event.target.value, ''))}
              required
            />
          </div>

          <ModalActionRow
            onCancel={() => setShowEstagModal(false)}
            submitLabel="Salvar Estagiário"
            saving={savingEstag}
          />
        </BaseModal>
      )}

      {/* Modal Confirmar Remoção Padronizado */}
      {confirmRemoval && (
        <BaseModal
          open={Boolean(confirmRemoval)}
          onClose={() => setConfirmRemoval(null)}
          title="Confirmar Remoção"
          backdropClass="fixed inset-0 bg-cetecBlue/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          sizeClass="ui-modal-card ui-modal-card--sm"
          contentAs="form"
          contentProps={{ onSubmit: handleConfirmRemoval }}
          bodyClass="ui-modal-body space-y-4"
        >
          <div className="flex items-center gap-3 p-3.5 bg-rose-50 rounded-2xl border border-rose-200">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-rounded text-xl">warning</span>
            </div>
            <div>
              <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider">Atenção</h4>
              <p className="text-[11px] font-bold text-rose-700">Esta ação é irreversível.</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-gray-800 font-bold text-sm">
              Tem certeza que deseja remover {confirmRemoval.type === 'aluno' ? 'este aluno' : 'este encontro'}?
            </p>
            <p className="text-xs text-gray-500 font-medium">
              Os dados vinculados a este registro serão excluídos da base de dados.
            </p>
          </div>

          <ModalActionRow
            onCancel={() => setConfirmRemoval(null)}
            cancelLabel="Cancelar"
            submitLabel="Remover"
            savingLabel="Removendo..."
            saving={confirmRemoval.type === 'aluno' ? Boolean(alunoLoadingMap?.[confirmRemoval.item?.id || `${confirmRemoval.item?.matricula || ''}-${confirmRemoval.item?.nome || ''}`]) : Boolean(encontroLoadingMap?.[confirmRemoval.item?.id])}
            submitClassName="btn-3d bg-red-600 text-white font-black px-5 py-2.5 rounded-xl border-b-[4px] border-red-800 hover:bg-red-500 cursor-pointer"
          />
        </BaseModal>
      )}
    </div>
  );
}

function ModuloSection({
  title,
  colorClass,
  encontros,
  onToggleStatus,
  onRemoveEncontro,
  onEditEncontro,
  onCanRemove,
  onCanEdit,
  onCanToggleStatus,
  encontroLoadingMap
}) {
  return (
    <details className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden group shadow-xs">
      <summary className={`font-black text-white p-3.5 text-sm cursor-pointer hover:opacity-95 transition flex justify-between items-center outline-none select-none ${colorClass}`}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-rounded text-base">folder</span>
          <span>{title}</span>
          <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-white/20">
            {encontros.length}
          </span>
        </div>
        <span className="text-white text-base font-bold group-open:rotate-180 transition-transform leading-none">
          expand_more
        </span>
      </summary>
      <div className="p-3.5 space-y-3 bg-gray-50/50">
        {encontros.length === 0 && (
          <p className="text-xs font-bold text-gray-400 py-3 text-center">Nenhum encontro registrado neste módulo.</p>
        )}
        {encontros.map((enc, index) => (
          <div
            key={enc.id || `${enc.assunto}-${enc.data}`.trim() || `encontro-${index}`}
            className="p-3.5 bg-white border border-gray-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-sm leading-tight">{enc.assunto}</p>
              {enc.detalhamento && (
                <p className="text-xs text-gray-600 font-semibold leading-relaxed mt-1 break-words">{enc.detalhamento}</p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {enc.quantidadeAlunos && (
                  <span className="text-[10px] font-black uppercase tracking-wide bg-blue-50 text-cetecBlue border border-blue-200/60 px-2 py-0.5 rounded-lg">
                    Inscritos: {enc.quantidadeAlunos}
                  </span>
                )}
                {enc.frequencia && (
                  <span className="text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-lg">
                    Presentes: {enc.frequencia}
                  </span>
                )}
                <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                  <span className="material-symbols-rounded text-[13px]">calendar_month</span>
                  {formatDateBR(enc.data)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
              {onCanToggleStatus && (
                <button
                  type="button"
                  onClick={() => onToggleStatus(enc)}
                  disabled={encontroLoadingMap?.[enc.id]}
                  className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    encontroLoadingMap?.[enc.id]
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait'
                      : String(enc.status || '').toUpperCase() === 'FEITO'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                  }`}
                >
                  {encontroLoadingMap?.[enc.id] ? '...' : String(enc.status || '').toUpperCase() === 'FEITO' ? 'FEITO' : 'A FAZER'}
                </button>
              )}
              {onCanEdit && (
                <button
                  type="button"
                  onClick={() => onEditEncontro && onEditEncontro(enc)}
                  disabled={encontroLoadingMap?.[enc.id]}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-cetecGreen hover:bg-emerald-50 transition cursor-pointer"
                  title="Editar Encontro"
                >
                  <span className="material-symbols-rounded text-base">edit</span>
                </button>
              )}
              {onCanRemove && (
                <button
                  type="button"
                  onClick={() => onRemoveEncontro(enc)}
                  disabled={encontroLoadingMap?.[enc.id]}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  title="Remover Encontro"
                >
                  <span className="material-symbols-rounded text-base">delete</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function statusValueToBackend(statusValue) {
  if (statusValue === 'concluido') return 'CONCLUIDO';
  if (statusValue === 'em_andamento') return 'EM ANDAMENTO';
  return 'PENDENTE';
}

function getMeetingSections(categoria) {
  const isInitial = String(categoria || '').toLowerCase().includes('inicia');
  if (isInitial) {
    return [
      { value: 'lista-scratchjr', label: 'SCRATCH JR.', colorClass: 'bg-[#F3A712]' },
      { value: 'lista-WeDo', label: 'WeDo', colorClass: 'bg-cetecBlue' },
    ];
  }

  return [
    { value: 'lista-scratch', label: 'SCRATCH', colorClass: 'bg-[#F3A712]' },
    { value: 'lista-ev3', label: 'EV3 / SPYKE', colorClass: 'bg-cetecBlue' },
    { value: 'lista-maker', label: 'MAKER / ARDUINO', colorClass: 'bg-cetecOrange' },
    { value: 'lista-python', label: 'PYTHON', colorClass: 'bg-cetecGreen' },
  ];
}

function groupMeetingsByModulo(encontros, meetingSections) {
  const base = meetingSections.reduce((acc, section) => {
    acc[section.value] = [];
    return acc;
  }, {});

  const defaultKey = meetingSections[0]?.value || 'lista-scratch';
  encontros.forEach((enc) => {
    const bucket = resolveMeetingModulo(enc.modulo, meetingSections) || defaultKey;
    if (!base[bucket]) base[bucket] = [];
    base[bucket].push(enc);
  });

  return base;
}

function resolveMeetingModulo(rawModulo, meetingSections) {
  const modulo = String(rawModulo || '').trim().toLowerCase();
  if (!modulo) return '';

  const sectionMap = {
    'lista-scratchjr': ['scratch jr', 'scratchjr', 'scratch-jr', 'scratch jovem', 'scratch jr.'],
    'lista-WeDo': ['wedo', 'we-do', 'we do', 'lista-wedo'],
    'lista-scratch': ['scratch', 'lista-scratch'],
    'lista-ev3': ['ev3', 'lista-ev3'],
    'lista-maker': ['maker', 'arduino', 'lista-maker'],
    'lista-python': ['python', 'lista-python'],
  };

  for (const section of meetingSections) {
    const aliases = sectionMap[section.value] || [];
    if (aliases.some((alias) => modulo.includes(alias))) return section.value;
    if (modulo === section.value) return section.value;
    if (String(section.label || '').trim().toLowerCase() === modulo) return section.value;
  }

  for (const [key, aliases] of Object.entries(sectionMap)) {
    if (!meetingSections.some((section) => section.value === key)) continue;
    if (aliases.some((alias) => modulo.includes(alias))) return key;
  }

  return meetingSections[0]?.value || '';
}

function normalizeCategoriaLabel(categoria) {
  const current = String(categoria || '').toLowerCase();
  if (current.includes('mist')) return 'Clubes Mistos';
  if (current.includes('fina')) return 'Clubes Finais';
  return 'Clubes Iniciais';
}

function categoriaBadgeClass(categoria) {
  const current = String(categoria || '').toLowerCase();
  if (current.includes('mist')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (current.includes('fina')) return 'bg-green-100 text-green-700 border-green-200';
  return 'bg-sky-100 text-sky-700 border-sky-200';
}

function filterMeetings(encontros, term, club) {
  const query = normalizeSearchText(term);
  if (!query) return encontros;

  const clubText = [club?.utec, club?.nomeUtec, club?.nome, club?.escola].map(normalizeSearchText).filter(Boolean).join(' ');

  return encontros.filter((enc) => {
    const searchText = [
      enc.id,
      enc.idClube,
      enc.modulo,
      enc.assunto,
      enc.detalhamento,
      enc.data,
      enc.status,
      enc.frequencia,
      enc.quantidadeAlunos,
      clubText,
    ].map(normalizeSearchText).join(' ');

    return searchText.includes(query);
  });
}

function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeSearchText(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function statusSelectClass(status, disabled) {
  const base = disabled
    ? 'font-black text-xs px-3 py-1.5 rounded-lg mt-1 border outline-none w-fit appearance-none text-center opacity-70 cursor-wait'
    : 'font-black text-xs px-3 py-1.5 rounded-lg mt-1 border outline-none cursor-pointer w-fit appearance-none text-center';

  if (status === 'concluido') return `bg-green-100 text-green-700 border-green-200 ${base}`;
  if (status === 'em_andamento') return `bg-blue-100 text-blue-700 border-blue-200 ${base}`;
  return `bg-cyan-100 text-cyan-700 border-cyan-200 ${base}`;
}

function isSuccessResponse(response) {
  if (!response) return false;
  if (response === true) return true;
  return response.sucesso === true || response.SUCESSO === true;
}

function getErrorMessage(response, fallback) {
  if (!response || typeof response !== 'object') return fallback;
  const code = String(response.codigo || '').toUpperCase();
  if (code === 'ACAO_INVALIDA') {
    return 'Ação inválida no backend. Verifique se o frontend está apontando para o deployment mais recente do Apps Script.';
  }

  return response.erro || response.mensagem || response.message || fallback;
}

function normalizeIdRef(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  if (!normalized) return '';
  if (/^\d+$/.test(normalized)) return normalized.replace(/^0+(?=\d)/, '');
  return normalized;
}

function isSameClubId(a, b) {
  const aId = normalizeIdRef(a);
  const bId = normalizeIdRef(b);
  if (!aId || !bId) return false;
  return aId === bId;
}
