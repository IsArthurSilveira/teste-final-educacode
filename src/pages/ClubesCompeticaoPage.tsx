import { useMemo, useState } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { ClubeCompeticaoModal } from '../components/ClubeCompeticaoModal';
import { BaseModal } from '../components/ui/BaseModal';
import {
  deleteClubeCompeticao,
  getStoredClubesCompeticao,
  saveClubeCompeticao,
} from '../data/defaultClubesCompeticao';
import type { AlunoCompeticao, ClubeCompeticao, EncontroCompeticao } from '../data/defaultClubesCompeticao';
import { isAnyAdmin } from '../utils/permissions';

interface ClubesCompeticaoPageProps {
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

export function ClubesCompeticaoPage({
  userName,
  userRole = 'editor',
  allowAdminTools = false,
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
}: ClubesCompeticaoPageProps) {
  const [clubes, setClubes] = useState<ClubeCompeticao[]>(() => getStoredClubesCompeticao());
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [competicaoFilter, setCompeticaoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClube, setEditingClube] = useState<ClubeCompeticao | null>(null);

  // Estado para detalhe do clube selecionado (estilo ClubDetailPage)
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  // Modais de Aluno e Aula/Encontro
  const [showAlunoModal, setShowAlunoModal] = useState(false);
  const [novoAluno, setNovoAluno] = useState<{
    matricula: string;
    nome: string;
    genero: 'M' | 'F';
    tamanhoCamisa: string;
  }>({
    matricula: '',
    nome: '',
    genero: 'M',
    tamanhoCamisa: 'M',
  });
  const [showEncontroModal, setShowEncontroModal] = useState(false);
  const [novoEncontro, setNovoEncontro] = useState({
    data: new Date().toISOString().split('T')[0],
    assunto: '',
    detalhamento: '',
    quantidadeAlunos: '',
    status: 'concluido' as 'pendente' | 'concluido',
  });

  // Modal de Exportação (PDF / Excel / CSV)
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'excel' | 'csv' | null>(null);

  const selectedClube = useMemo(() => {
    if (!selectedClubId) return null;
    return clubes.find((c) => c.id === selectedClubId) || null;
  }, [clubes, selectedClubId]);

  const normalizedSearch = search.trim().toLowerCase();

  // Clubes filtrados organizados por UTEC em ordem alfabética (A-Z)
  const filteredClubes = useMemo(() => {
    return clubes
      .filter((clube) => {
        // Filtro rápido de chips
        if (quickFilter !== 'all') {
          const qf = quickFilter.toLowerCase();
          const comp = (clube.competicao || '').toLowerCase();
          const status = (clube.status || '').toLowerCase();
          const matchChip =
            comp === qf ||
            status === qf ||
            (qf === 'em_andamento' && status.includes('andamento')) ||
            (qf === 'concluido' && status.includes('conclu'));
          if (!matchChip) return false;
        }

        // Filtro de competição
        if (competicaoFilter !== 'all' && clube.competicao !== competicaoFilter) {
          return false;
        }

        // Filtro de status
        if (statusFilter !== 'all') {
          const st = (clube.status || '').toLowerCase();
          if (statusFilter === 'em_andamento' && !st.includes('andamento') && st !== 'em_andamento') {
            return false;
          }
          if (statusFilter === 'concluido' && !st.includes('conclu') && st !== 'concluido') {
            return false;
          }
          if (statusFilter === 'pendente' && !st.includes('pendente') && st !== 'pendente') {
            return false;
          }
        }

        // Busca por texto
        if (!normalizedSearch) return true;
        return (
          clube.nome.toLowerCase().includes(normalizedSearch) ||
          clube.escola.toLowerCase().includes(normalizedSearch) ||
          clube.utec.toLowerCase().includes(normalizedSearch) ||
          clube.prof.toLowerCase().includes(normalizedSearch) ||
          (clube.tecnico && clube.tecnico.toLowerCase().includes(normalizedSearch)) ||
          (clube.nivel && clube.nivel.toLowerCase().includes(normalizedSearch)) ||
          clube.competicao.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        const utecA = String(a.utec || '').trim().toUpperCase();
        const utecB = String(b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          const nomeA = String(a.nome || '').trim().toUpperCase();
          const nomeB = String(b.nome || '').trim().toUpperCase();
          return nomeA.localeCompare(nomeB, 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });
  }, [clubes, normalizedSearch, quickFilter, competicaoFilter, statusFilter]);

  // Indicadores rápidos DINÂMICOS baseados nos filtros ativos
  const totalEquipes = filteredClubes.length;
  const totalCompetidores = filteredClubes.reduce((acc, c) => acc + (c.alunosList?.length || 0), 0);
  const totalMeninos = filteredClubes.reduce((acc, c) => acc + (c.alunosList?.filter((a) => a.genero === 'M').length || 0), 0);
  const totalMeninas = filteredClubes.reduce((acc, c) => acc + (c.alunosList?.filter((a) => a.genero === 'F').length || 0), 0);
  const totalTreinos = filteredClubes.reduce((acc, c) => acc + (c.encontrosList?.length || 0), 0);
  const totalAtivos = filteredClubes.filter((c) => c.status === 'em_andamento').length;

  // Exportar Excel (.xlsx) padronizado por UTEC (A-Z)
  async function handleExportExcel() {
    setIsExporting('excel');
    try {
      const { utils, writeFile } = await import('xlsx');

      const sorted = [...filteredClubes].sort((a, b) => {
        const utecA = String(a.utec || '').trim().toUpperCase();
        const utecB = String(b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });

      const rows = sorted.map((c) => {
        const meninos = c.alunosList?.filter((a) => a.genero === 'M').length || 0;
        const meninas = c.alunosList?.filter((a) => a.genero === 'F').length || 0;
        return {
          'UTEC': c.utec || 'Não informada',
          'ESCOLA': c.escola,
          'CLUBE / EQUIPE': c.nome,
          'TORNEIO': c.competicao,
          'NÍVEL': c.nivel,
          'STATUS': c.status === 'em_andamento' ? 'EM ANDAMENTO' : c.status === 'concluido' ? 'CONCLUÍDO' : 'PENDENTE',
          'PROFESSOR(A)': c.prof,
          'TÉCNICO / ESTAGIÁRIO': c.tecnico,
          'DIAS DE TREINO': c.dias,
          'HORÁRIO': c.horario,
          'TOTAL ALUNOS': c.alunosList?.length || 0,
          'MENINOS (M)': meninos,
          'MENINAS (F)': meninas,
          'TOTAL ENCONTROS/TREINOS': c.encontrosList?.length || 0,
        };
      });

      const worksheet = utils.json_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 18 },
        { wch: 30 },
        { wch: 30 },
        { wch: 14 },
        { wch: 22 },
        { wch: 16 },
        { wch: 22 },
        { wch: 22 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 24 },
      ];

      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Clubes de Competição');
      const dateStr = new Date().toISOString().split('T')[0];
      writeFile(workbook, `clubes_competicao_por_utec_${dateStr}.xlsx`);
      setShowExportModal(false);
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
    } finally {
      setIsExporting(null);
    }
  }

  // Exportar PDF (.pdf) padronizado por UTEC (A-Z)
  async function handleExportPdf() {
    setIsExporting('pdf');
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const sorted = [...filteredClubes].sort((a, b) => {
        const utecA = String(a.utec || '').trim().toUpperCase();
        const utecB = String(b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });

      const now = new Date();
      const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Cabeçalho institucional
      doc.setFillColor(1, 30, 98);
      doc.rect(0, 0, 297, 20, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('RELATÓRIO DE CLUBES DE COMPETIÇÃO - ROBÓTICA', 14, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(220, 235, 255);
      doc.text(`Gerado em: ${dateFormatted} | Organizado por UTEC (Ordem Alfabética A-Z) | Total: ${sorted.length} equipes`, 14, 26);

      const tableRows = sorted.map((c) => {
        const meninos = c.alunosList?.filter((a) => a.genero === 'M').length || 0;
        const meninas = c.alunosList?.filter((a) => a.genero === 'F').length || 0;
        const statusText = c.status === 'em_andamento' ? 'Em Andamento' : c.status === 'concluido' ? 'Concluído' : 'Pendente';
        return [
          c.utec || 'UTEC',
          c.escola || '-',
          c.nome || '-',
          c.competicao || '-',
          c.nivel || '-',
          statusText,
          c.prof || '-',
          c.tecnico || '-',
          `${c.dias || '-'} ${c.horario ? `• ${c.horario}` : ''}`,
          String(c.alunosList?.length || 0),
          `${meninos}M / ${meninas}F`,
          String(c.encontrosList?.length || 0),
        ];
      });

      autoTable(doc, {
        startY: 30,
        head: [['UTEC', 'ESCOLA', 'CLUBE / EQUIPE', 'TORNEIO', 'NÍVEL', 'STATUS', 'PROFESSOR(A)', 'TÉCNICO / ESTAG.', 'AGENDA', 'ALUNOS', 'GÊNERO', 'TREINOS']],
        body: tableRows,
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          font: 'helvetica',
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [1, 30, 98],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [1, 30, 98], cellWidth: 22 },
          1: { cellWidth: 32 },
          2: { fontStyle: 'bold', cellWidth: 32 },
          3: { halign: 'center', cellWidth: 16 },
          4: { cellWidth: 26 },
          5: { halign: 'center', cellWidth: 20 },
          6: { cellWidth: 24 },
          7: { cellWidth: 24 },
          8: { cellWidth: 26 },
          9: { halign: 'center', cellWidth: 14 },
          10: { halign: 'center', cellWidth: 16 },
          11: { halign: 'center', cellWidth: 14 },
        },
        didDrawPage: (data) => {
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            297 - 25,
            205,
            { align: 'right' }
          );
        },
      });

      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`clubes_competicao_por_utec_${dateStr}.pdf`);
      setShowExportModal(false);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
    } finally {
      setIsExporting(null);
    }
  }

  // Exportar CSV padronizado por UTEC (A-Z)
  function handleExportCsv() {
    setIsExporting('csv');
    try {
      const sorted = [...filteredClubes].sort((a, b) => {
        const utecA = String(a.utec || '').trim().toUpperCase();
        const utecB = String(b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });

      const headers = ['UTEC', 'ESCOLA', 'CLUBE / EQUIPE', 'TORNEIO', 'NÍVEL', 'STATUS', 'PROFESSOR(A)', 'TÉCNICO / ESTAGIÁRIO', 'DIAS DE TREINO', 'HORÁRIO', 'TOTAL ALUNOS', 'MENINOS (M)', 'MENINAS (F)', 'TOTAL TREINOS'];
      const escapeCsv = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;

      const lines = [
        headers.join(';'),
        ...sorted.map((c) => {
          const meninos = c.alunosList?.filter((a) => a.genero === 'M').length || 0;
          const meninas = c.alunosList?.filter((a) => a.genero === 'F').length || 0;
          const statusText = c.status === 'em_andamento' ? 'EM ANDAMENTO' : c.status === 'concluido' ? 'CONCLUÍDO' : 'PENDENTE';
          return [
            escapeCsv(c.utec || 'UTEC'),
            escapeCsv(c.escola),
            escapeCsv(c.nome),
            escapeCsv(c.competicao),
            escapeCsv(c.nivel),
            escapeCsv(statusText),
            escapeCsv(c.prof),
            escapeCsv(c.tecnico),
            escapeCsv(c.dias),
            escapeCsv(c.horario),
            escapeCsv(c.alunosList?.length || 0),
            escapeCsv(meninos),
            escapeCsv(meninas),
            escapeCsv(c.encontrosList?.length || 0),
          ].join(';');
        }),
      ];

      const csvContent = '\uFEFF' + lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `clubes_competicao_por_utec_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
    } finally {
      setIsExporting(null);
    }
  }

  // Modal de Excluir Clube
  const [clubeToDelete, setClubeToDelete] = useState<ClubeCompeticao | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  function handleSave(clube: ClubeCompeticao) {
    const updated = saveClubeCompeticao(clube);
    setClubes(updated);
    setEditingClube(null);
  }

  function handleOpenDeleteModal(clube: ClubeCompeticao) {
    setClubeToDelete(clube);
    setDeleteModalOpen(true);
  }

  function handleConfirmDeleteClube() {
    if (!clubeToDelete) return;
    const updated = deleteClubeCompeticao(clubeToDelete.id);
    setClubes(updated);
    if (selectedClubId === clubeToDelete.id) setSelectedClubId(null);
    setDeleteModalOpen(false);
    setClubeToDelete(null);
  }

  // Ações de Alunos no Clube Selecionado
  function handleAddAluno(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClube || !novoAluno.nome.trim()) return;

    const aluno: AlunoCompeticao = {
      id: `al-${Date.now()}`,
      matricula: novoAluno.matricula.trim() || 'S/ MATRÍCULA',
      nome: novoAluno.nome.trim(),
      genero: novoAluno.genero,
      tamanhoCamisa: novoAluno.tamanhoCamisa || 'M',
      dataRegistro: new Date().toLocaleDateString('pt-BR'),
    };

    const updatedClube: ClubeCompeticao = {
      ...selectedClube,
      alunosList: [...(selectedClube.alunosList || []), aluno],
    };

    handleSave(updatedClube);
    setNovoAluno({ matricula: '', nome: '', genero: 'M', tamanhoCamisa: 'M' });
    setShowAlunoModal(false);
  }

  function handleRemoveAluno(alunoId: string) {
    if (!selectedClube) return;
    const updatedClube: ClubeCompeticao = {
      ...selectedClube,
      alunosList: selectedClube.alunosList.filter((a) => a.id !== alunoId),
    };
    handleSave(updatedClube);
  }

  // Ações de Encontros/Treinos no Clube Selecionado
  function handleAddEncontro(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClube || !novoEncontro.assunto.trim()) return;

    const encontro: EncontroCompeticao = {
      id: `enc-${Date.now()}`,
      data: novoEncontro.data,
      assunto: novoEncontro.assunto.trim(),
      detalhamento: novoEncontro.detalhamento.trim() || 'Treino prático da equipe.',
      quantidadeAlunos: novoEncontro.quantidadeAlunos || String(selectedClube.alunosList.length),
      status: novoEncontro.status,
    };

    const updatedClube: ClubeCompeticao = {
      ...selectedClube,
      encontrosList: [encontro, ...(selectedClube.encontrosList || [])],
    };

    handleSave(updatedClube);
    setNovoEncontro({
      data: new Date().toISOString().split('T')[0],
      assunto: '',
      detalhamento: '',
      quantidadeAlunos: '',
      status: 'concluido',
    });
    setShowEncontroModal(false);
  }

  function handleToggleEncontroStatus(encontroId: string) {
    if (!selectedClube) return;
    const updatedEncontros = selectedClube.encontrosList.map((enc) => {
      if (enc.id === encontroId) {
        return {
          ...enc,
          status: (enc.status === 'concluido' ? 'pendente' : 'concluido') as 'pendente' | 'concluido',
        };
      }
      return enc;
    });

    const updatedClube: ClubeCompeticao = {
      ...selectedClube,
      encontrosList: updatedEncontros,
    };
    handleSave(updatedClube);
  }

  function handleRemoveEncontro(encontroId: string) {
    if (!selectedClube) return;
    const updatedClube: ClubeCompeticao = {
      ...selectedClube,
      encontrosList: selectedClube.encontrosList.filter((e) => e.id !== encontroId),
    };
    handleSave(updatedClube);
  }

  function handleUpdateClubStatus(nextStatus: ClubeCompeticao['status']) {
    if (!selectedClube) return;
    const updatedClube: ClubeCompeticao = {
      ...selectedClube,
      status: nextStatus,
    };
    handleSave(updatedClube);
  }

  const isAdmin = isAnyAdmin(userRole);

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="clubes-competicao"
        userName={userName}
        allowUsersTools={allowUsersTools}
        onLogout={onLogout}
        onOpenDashboard={onOpenDashboard}
        onOpenClubs={onOpenClubs}
        onOpenAdminUsers={onOpenAdminUsers}
        onOpenRoteiros={onOpenRoteiros}
        onOpenGaleria={onOpenGaleria}
        onOpenClubesCompeticao={onOpenClubesCompeticao || (() => {})}
        onOpenProjetosFicFecom={onOpenProjetosFicFecom}
        onOpenDatabaseControl={onOpenDatabaseControl}
      />

      <main className="app-main-pane dashboard-main-modern flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-y-auto relative bg-white lg:h-screen">
        {/* Orbs de fundo em Amarelo e Verde */}
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-yellow-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" aria-hidden="true" />
        <div className="absolute bottom-0 left-1/4 w-[380px] h-[380px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full relative z-10 bg-white">
          {/* ============================================================ */}
          {/* MODO 1: DETALHE DO CLUBE DE COMPETIÇÃO (ESTILO ClubDetailPage) */}
          {/* ============================================================ */}
          {selectedClube ? (
            <div className="flex flex-col space-y-4 animate-[fadeIn_0.3s_ease-in-out]">
              {/* Botão de Fechar / Voltar */}
              <div className="flex justify-between items-center pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedClubId(null)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <span className="material-symbols-rounded text-sm">arrow_back</span>
                  <span>Voltar aos Clubes de Competição</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClube(selectedClube);
                      setModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <span className="material-symbols-rounded text-sm">edit</span>
                    <span>Editar Informações</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(selectedClube)}
                      className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <span className="material-symbols-rounded text-sm">delete</span>
                      <span>Excluir Clube</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedClubId(null)}
                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition shadow-xs font-black text-xs flex items-center justify-center cursor-pointer"
                    type="button"
                    aria-label="Fechar detalhes"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Card Superior de Informações do Clube */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-yellow-300 shadow-sm relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Nome e Status */}
                  <div className="flex flex-col gap-2 min-w-0 lg:col-span-4">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      {selectedClube.nome}
                    </h2>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={selectedClube.status}
                        onChange={(e) => handleUpdateClubStatus(e.target.value as ClubeCompeticao['status'])}
                        className={`text-xs font-black px-3 py-1.5 rounded-lg border cursor-pointer outline-none ${
                          selectedClube.status === 'em_andamento'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : selectedClube.status === 'concluido'
                            ? 'bg-yellow-100 text-yellow-900 border-yellow-400'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        <option value="pendente">PENDENTE</option>
                        <option value="em_andamento">EM ANDAMENTO</option>
                        <option value="concluido">CONCLUÍDO</option>
                      </select>

                      <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-yellow-400 text-yellow-950 border border-yellow-500/40">
                        {selectedClube.competicao}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {selectedClube.nivel}
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
                        {selectedClube.escola}
                      </p>
                      <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                        {selectedClube.utec}
                      </span>
                    </div>

                    {/* Equipe Responsável: Professor e Técnico / Estagiário */}
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                        Equipe Técnica
                      </span>
                      <p className="text-xs font-black text-gray-900">
                        <strong className="text-gray-400 font-bold">Prof:</strong> {selectedClube.prof}
                      </p>
                      <p className="text-xs font-black text-emerald-800 mt-1">
                        <strong className="text-gray-400 font-bold">Técnico / Estag:</strong> {selectedClube.tecnico}
                      </p>
                    </div>

                    {/* Agenda */}
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                        Agenda dos Treinos
                      </span>
                      <p className="text-sm font-black text-gray-900 leading-tight">
                        {selectedClube.dias}
                      </p>
                      <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                        {selectedClube.horario}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Duas Colunas: Alunos na Esquerda, Cronograma de Treinos na Direita */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                {/* Coluna de Alunos */}
                <div className="xl:col-span-4 bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-xs flex flex-col min-h-[380px]">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-emerald-600 text-xl">groups</span>
                      <h3 className="font-black text-base text-gray-900">
                        Alunos Competidores ({selectedClube.alunosList?.length || 0})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAlunoModal(true)}
                      className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-lg hover:bg-emerald-500 transition flex items-center justify-center cursor-pointer shadow-xs"
                      title="Adicionar Aluno"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
                    {(!selectedClube.alunosList || selectedClube.alunosList.length === 0) ? (
                      <p className="text-xs text-gray-400 text-center py-8">
                        Nenhum aluno cadastrado nesta equipe ainda.
                      </p>
                    ) : (
                      selectedClube.alunosList.map((aluno) => (
                        <div
                          key={aluno.id}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                              aluno.genero === 'F' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              <span className="material-symbols-rounded text-base">person</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="block font-black text-xs text-gray-900 truncate">
                                  {aluno.nome}
                                </span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${
                                  aluno.genero === 'F'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {aluno.genero === 'F' ? 'Fem' : 'Masc'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="block text-[10px] font-bold text-gray-400">
                                  MAT: {aluno.matricula}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  Camisa: {aluno.tamanhoCamisa || 'M'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveAluno(aluno.id)}
                            className="text-[10px] font-black text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-md px-2 py-1 transition cursor-pointer"
                          >
                            REMOVER
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Coluna de Cronograma de Aulas & Treinos (Sem Módulos) */}
                <div className="xl:col-span-8 bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-xs flex flex-col min-h-[380px]">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-yellow-600 text-xl">event_note</span>
                      <div>
                        <h3 className="font-black text-base text-gray-900">
                          Cronograma de Aulas & Treinos ({selectedClube.encontrosList?.length || 0})
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium">
                          Registro de encontros, testes de pista, construção do robô e preparação
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowEncontroModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-rounded text-sm">add</span>
                      <span>Nova Aula / Treino</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
                    {(!selectedClube.encontrosList || selectedClube.encontrosList.length === 0) ? (
                      <p className="text-xs text-gray-400 text-center py-8">
                        Nenhum treino ou aula registrada nesta equipe.
                      </p>
                    ) : (
                      selectedClube.encontrosList.map((enc, idx) => (
                        <div
                          key={enc.id}
                          className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-[10px] font-black uppercase text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">
                                  {enc.data}
                                </span>
                                <h4 className="font-black text-xs text-gray-900">
                                  {enc.assunto}
                                </h4>
                              </div>
                              <p className="text-xs text-gray-600 font-medium">
                                {enc.detalhamento}
                              </p>
                              <span className="text-[10px] font-bold text-emerald-800 mt-1 block">
                                Presença: {enc.quantidadeAlunos} alunos
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleEncontroStatus(enc.id)}
                              className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                                enc.status === 'concluido'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-yellow-100 text-yellow-900 border-yellow-300'
                              }`}
                            >
                              {enc.status === 'concluido' ? 'CONCLUÍDO' : 'PENDENTE'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveEncontro(enc.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Remover aula"
                            >
                              <span className="material-symbols-rounded text-base">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* MODO 2: PAINEL DE CLUBES DE COMPETIÇÃO (GRID DE CARDS)       */
            /* ============================================================ */
            <>
              {/* Header da Tela - Predominantemente Amarelo e Verde */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-yellow-500/15 via-emerald-500/10 to-transparent p-5 sm:p-6 rounded-[2rem] border-2 border-yellow-400/40 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-emerald-600 text-yellow-950 flex items-center justify-center shadow-md shadow-yellow-500/20 shrink-0">
                    <span className="material-symbols-rounded text-2xl sm:text-3xl font-black">emoji_events</span>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-950 tracking-tight">
                      Clubes Competição
                    </h1>
                    <p className="text-xs sm:text-sm text-emerald-800/80 font-semibold">
                      Gestão completa dos clubes de robótica de competição (FLL, OBR, RECLINE)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingClube(null);
                    setModalOpen(true);
                  }}
                  className="btn-3d self-start md:self-center px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 border-b-[5px] border-emerald-900 active:scale-95 transition cursor-pointer shadow-md shadow-emerald-900/20"
                >
                  <span className="material-symbols-rounded text-lg">add_circle</span>
                  <span>+ NOVO CLUBE COMPETIÇÃO</span>
                </button>
              </div>

              {/* Cards de Métricas Rápidas (Amarelo e Verde) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border-2 border-yellow-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400/20 text-yellow-800 flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-xl">groups</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Clubes Ativos
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-950">
                      {totalEquipes}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-emerald-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-xl">school</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Total Alunos
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black text-emerald-950">
                        {totalCompetidores}
                      </span>
                      <span className="text-[11px] font-bold text-gray-500">
                        ({totalMeninos} M / {totalMeninas} F)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-amber-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-xl">event_available</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Aulas / Treinos
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-950">
                      {totalTreinos}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-yellow-300 shadow-xs flex items-center gap-3 bg-gradient-to-br from-yellow-50/60 to-emerald-50/40">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400 text-yellow-950 flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-rounded text-xl">verified</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 block">
                      Em Andamento
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-800">
                      {totalAtivos}
                    </span>
                  </div>
                </div>
              </div>

              {/* Área de Filtros e Pesquisa - Padronizada com Painel de Clubes */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3 w-full">
                  {/* Barra de Pesquisa */}
                  <div className="flex-1 flex items-center bg-white rounded-xl border-2 border-gray-200 px-3.5 h-[42px] shadow-xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <span className="material-symbols-rounded text-[18px] text-gray-400 mr-2 shrink-0">
                      search
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Pesquisar por clube, escola, professor, técnico ou torneio..."
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-bold text-gray-700 placeholder:text-gray-400 placeholder:font-semibold h-full"
                      aria-label="Pesquisar clubes de competição"
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

                  {/* Select de Competição: FLL, OBR, RECLINE (sem Geral) */}
                  <select
                    value={competicaoFilter}
                    onChange={(event) => setCompeticaoFilter(event.target.value)}
                    className="bg-white border-2 border-gray-200 rounded-xl px-3 h-[42px] text-xs font-bold text-gray-700 outline-none focus:border-yellow-500 cursor-pointer shadow-xs min-w-[190px]"
                    title="Filtrar por torneio"
                  >
                    <option value="all">Torneio: Todos</option>
                    <option value="FLL">FLL (FIRST Lego League)</option>
                    <option value="OBR">OBR (Olimpíada Brasileira)</option>
                    <option value="RECLINE">RECLINE (Seguidor de Linha)</option>
                  </select>

                  {/* Select de Status: Em Andamento, Concluído, Pendente */}
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="bg-white border-2 border-gray-200 rounded-xl px-3 h-[42px] text-xs font-bold text-gray-700 outline-none focus:border-yellow-500 cursor-pointer shadow-xs min-w-[170px]"
                    title="Filtrar por status do clube"
                  >
                    <option value="all">Status: Todos</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="pendente">Pendente</option>
                  </select>

                  {/* Botão de Exportar ao lado dos Selects */}
                  <button
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    className="btn-3d px-4 h-[42px] rounded-xl bg-white border-2 border-emerald-600/70 text-emerald-800 hover:bg-emerald-50 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition shrink-0"
                    title="Exportar dados por UTEC em PDF, Excel ou CSV"
                  >
                    <span className="material-symbols-rounded text-lg text-emerald-700">ios_share</span>
                    <span>Exportar</span>
                  </button>
                </div>

                {/* Chips de Filtro Rápido: FLL, OBR, RECLINE (WRO e TBR removidos!) */}
                <div className="flex flex-wrap gap-2 w-full justify-start items-center">
                  <button
                    type="button"
                    onClick={() => setQuickFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                      quickFilter === 'all'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    <span className="material-symbols-rounded text-[16px]">groups</span>
                    <span>Todos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickFilter('fll')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                      quickFilter === 'fll'
                        ? 'bg-yellow-400 text-yellow-950 border-yellow-500 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-yellow-50 hover:text-yellow-900'
                    }`}
                  >
                    <span className="material-symbols-rounded text-[16px]">stars</span>
                    <span>FLL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickFilter('obr')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                      quickFilter === 'obr'
                        ? 'bg-yellow-400 text-yellow-950 border-yellow-500 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-yellow-50 hover:text-yellow-900'
                    }`}
                  >
                    <span className="material-symbols-rounded text-[16px]">smart_toy</span>
                    <span>OBR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickFilter('recline')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                      quickFilter === 'recline'
                        ? 'bg-emerald-600 text-yellow-300 border-emerald-700 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    <span className="material-symbols-rounded text-[16px]">conversion_path</span>
                    <span>RECLINE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickFilter('em_andamento')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                      quickFilter === 'em_andamento'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    <span className="material-symbols-rounded text-[16px]">play_circle</span>
                    <span>Em Andamento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickFilter('concluido')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                      quickFilter === 'concluido'
                        ? 'bg-yellow-400 text-yellow-950 border-yellow-500 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-yellow-50 hover:text-yellow-900'
                    }`}
                  >
                    <span className="material-symbols-rounded text-[16px]">check_circle</span>
                    <span>Concluído</span>
                  </button>
                </div>
              </div>

              {/* Grid de Cards - Padrão do Painel de Clubes */}
              {filteredClubes.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-2">
                  <span className="material-symbols-rounded text-5xl text-yellow-500/60">groups</span>
                  <h3 className="text-base font-bold text-gray-700">Nenhum clube de competição encontrado</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Tente ajustar os filtros ou cadastre um novo clube de competição para sua UTEC!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClube(null);
                      setModalOpen(true);
                    }}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white font-black rounded-xl text-xs hover:bg-emerald-500 transition cursor-pointer"
                  >
                    Cadastrar Clube Agora
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredClubes.map((clube) => (
                    <div
                      key={clube.id}
                      onClick={() => setSelectedClubId(clube.id)}
                      className="bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-yellow-400 shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between gap-4 text-left cursor-pointer"
                    >
                      <div>
                        {/* Topo do Card: Nome e Selos (Competição e Nível) */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-black text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                            {clube.nome}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-yellow-950 border border-yellow-500/40 shrink-0">
                              {clube.competicao}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                              {clube.nivel === 'Nível 1 (Anos Iniciais)' ? 'Nível 1' : 'Nível 2'}
                            </span>
                          </div>
                        </div>

                        {/* Badges de Escola e UTEC */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          <span className="bg-emerald-50 text-emerald-800 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border border-emerald-200/60 inline-block truncate max-w-full">
                            {clube.escola}
                          </span>
                          <span className="bg-yellow-50 text-yellow-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border border-yellow-200 inline-block truncate max-w-full">
                            {clube.utec}
                          </span>
                        </div>

                        {/* Metadados: Professor e Técnico / Estagiário */}
                        <div className="mt-3 space-y-1 text-xs">
                          <p className="text-gray-600 font-bold truncate">
                            <strong className="text-gray-400 font-black">Prof:</strong> {clube.prof}
                          </p>
                          <p className="text-emerald-800 font-bold truncate">
                            <strong className="text-gray-400 font-black">Técnico / Estag:</strong> {clube.tecnico}
                          </p>
                        </div>

                        {/* Agenda: Dias e Horário */}
                        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-500 font-semibold truncate">
                          <span className="material-symbols-rounded text-sm text-gray-400 shrink-0">schedule</span>
                          <span className="truncate">{clube.dias} • {clube.horario}</span>
                        </div>
                      </div>

                      {/* Rodapé do Card: Alunos, Encontros e Status (Sem melhor lugar ou classificados!) */}
                      <div className="flex items-end justify-between mt-auto pt-3 border-t border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-emerald-950 font-black text-xs leading-none">
                            {clube.alunosList?.length || 0} Alunos
                          </span>
                          <span className="text-emerald-600 font-extrabold text-[11px] mt-1 uppercase tracking-tight">
                            {clube.encontrosList?.length || 0} Aulas / Encontros
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClube(clube);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            title="Editar informações do clube"
                          >
                            <span className="material-symbols-rounded text-base">edit</span>
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteModal(clube);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Excluir clube"
                            >
                              <span className="material-symbols-rounded text-base">delete</span>
                            </button>
                          )}

                          <span
                            className={`font-black text-[10px] px-2.5 py-1 rounded-lg border uppercase tracking-wider shrink-0 ${
                              clube.status === 'em_andamento'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : clube.status === 'concluido'
                                ? 'bg-yellow-100 text-yellow-900 border-yellow-300'
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            {clube.status === 'em_andamento'
                              ? 'Em Andamento'
                              : clube.status === 'concluido'
                              ? 'Concluído'
                              : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal de Cadastro / Edição de Clube de Competição */}
      <ClubeCompeticaoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingClube(null);
        }}
        onSubmit={handleSave}
        clubeToEdit={editingClube}
      />

      {/* Modal de Cadastro de Aluno no Clube */}
      <BaseModal
        open={showAlunoModal}
        onClose={() => setShowAlunoModal(false)}
        title="Cadastrar Aluno no Clube de Competição"
        size="md"
      >
        <form onSubmit={handleAddAluno} className="space-y-3.5 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nome do Aluno *
            </label>
            <input
              type="text"
              value={novoAluno.nome}
              onChange={(e) => setNovoAluno({ ...novoAluno, nome: e.target.value })}
              placeholder="Nome completo do aluno"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Matrícula
            </label>
            <input
              type="text"
              value={novoAluno.matricula}
              onChange={(e) => setNovoAluno({ ...novoAluno, matricula: e.target.value })}
              placeholder="Número de matrícula (opcional)"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Gênero do Aluno *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNovoAluno({ ...novoAluno, genero: 'M' })}
                className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  novoAluno.genero === 'M'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-rounded text-base">male</span>
                <span>Masculino (M)</span>
              </button>

              <button
                type="button"
                onClick={() => setNovoAluno({ ...novoAluno, genero: 'F' })}
                className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  novoAluno.genero === 'F'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-rounded text-base">female</span>
                <span>Feminino (F)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Tamanho de Camisa *
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {['10', '12', '14', '16', 'PP', 'P', 'M', 'G', 'GG', 'XGG'].map((tamanho) => (
                <button
                  key={tamanho}
                  type="button"
                  onClick={() => setNovoAluno({ ...novoAluno, tamanhoCamisa: tamanho })}
                  className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                    novoAluno.tamanhoCamisa === tamanho
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {tamanho}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowAlunoModal(false)}
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer shadow-xs"
            >
              Salvar Aluno
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Modal de Cadastro de Nova Aula / Treino (Sem Módulos) */}
      <BaseModal
        open={showEncontroModal}
        onClose={() => setShowEncontroModal(false)}
        title="Registrar Aula / Treino de Competição"
        size="md"
      >
        <form onSubmit={handleAddEncontro} className="space-y-3.5 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Data do Treino *
              </label>
              <input
                type="date"
                value={novoEncontro.data}
                onChange={(e) => setNovoEncontro({ ...novoEncontro, data: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Alunos Presentes
              </label>
              <input
                type="number"
                min="0"
                value={novoEncontro.quantidadeAlunos}
                onChange={(e) => setNovoEncontro({ ...novoEncontro, quantidadeAlunos: e.target.value })}
                placeholder={selectedClube ? String(selectedClube.alunosList.length) : '0'}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Assunto / Objetivo do Treino *
            </label>
            <input
              type="text"
              value={novoEncontro.assunto}
              onChange={(e) => setNovoEncontro({ ...novoEncontro, assunto: e.target.value })}
              placeholder="Ex: Calibração de sensores ópticos e percurso"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Detalhamento da Atividade
            </label>
            <textarea
              value={novoEncontro.detalhamento}
              onChange={(e) => setNovoEncontro({ ...novoEncontro, detalhamento: e.target.value })}
              rows={3}
              placeholder="Descreva o que a equipe praticou, avanços na programação, peças mecânicas ou ajustes na mesa/pista..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-yellow-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Status da Aula
            </label>
            <select
              value={novoEncontro.status}
              onChange={(e) => setNovoEncontro({ ...novoEncontro, status: e.target.value as 'pendente' | 'concluido' })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500 cursor-pointer"
            >
              <option value="concluido">CONCLUÍDO</option>
              <option value="pendente">PENDENTE</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowEncontroModal(false)}
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer shadow-xs"
            >
              Registrar Treino
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Modal de Exportação de Dados por UTEC */}
      {showExportModal && (
        <BaseModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="Exportar Dados de Clubes de Competição"
          size="md"
        >
          <div className="space-y-4 text-left">
            {/* Banner Superior com Ícone Temático */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 via-yellow-50/50 to-emerald-50 rounded-2xl border border-emerald-200/80">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-rounded text-2xl">ios_share</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-gray-900 tracking-tight">
                  Exportação de Relatório Oficial
                </h4>
                <p className="text-xs text-gray-600 font-semibold mt-0.5">
                  Dados padronizados e organizados por <strong>UTEC em ordem alfabética (A-Z)</strong>.
                </p>
              </div>
            </div>

            {/* Resumo do Escopo Filtrado */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs font-bold text-gray-700">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-emerald-600 text-lg">filter_alt</span>
                <span>Filtro aplicado: <strong className="text-gray-900">{competicaoFilter === 'all' ? 'Todos os torneios' : competicaoFilter} • {statusFilter === 'all' ? 'Todos os status' : statusFilter === 'em_andamento' ? 'Em Andamento' : statusFilter === 'concluido' ? 'Concluído' : 'Pendente'} • {quickFilter === 'all' ? 'Todos' : quickFilter}</strong></span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-black">
                {filteredClubes.length} {filteredClubes.length === 1 ? 'equipe' : 'equipes'}
              </span>
            </div>

            {/* Opções de Formato de Exportação */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Opção PDF */}
              <button
                type="button"
                disabled={isExporting !== null}
                onClick={handleExportPdf}
                className="p-4 rounded-2xl border-2 border-gray-200 hover:border-red-500 hover:bg-red-50/40 text-left flex flex-col justify-between gap-3 group transition cursor-pointer disabled:opacity-50"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-2.5 group-hover:bg-red-600 group-hover:text-white transition">
                    <span className="material-symbols-rounded text-2xl">picture_as_pdf</span>
                  </div>
                  <h5 className="font-black text-sm text-gray-900 group-hover:text-red-700 transition">
                    Documento PDF
                  </h5>
                  <p className="text-[11px] text-gray-500 font-semibold mt-1 leading-tight">
                    Diagramado em paisagem para impressão, com tabela completa e paginação.
                  </p>
                </div>
                <span className="text-xs font-black text-red-600 flex items-center gap-1">
                  {isExporting === 'pdf' ? 'Gerando...' : 'Baixar PDF'}
                  <span className="material-symbols-rounded text-sm">arrow_forward</span>
                </span>
              </button>

              {/* Opção Excel */}
              <button
                type="button"
                disabled={isExporting !== null}
                onClick={handleExportExcel}
                className="p-4 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left flex flex-col justify-between gap-3 group transition cursor-pointer disabled:opacity-50"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <span className="material-symbols-rounded text-2xl">table_view</span>
                  </div>
                  <h5 className="font-black text-sm text-gray-900 group-hover:text-emerald-800 transition">
                    Planilha Excel
                  </h5>
                  <p className="text-[11px] text-gray-500 font-semibold mt-1 leading-tight">
                    Arquivo .xlsx estruturado com colunas formatadas por UTEC e fórmulas.
                  </p>
                </div>
                <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                  {isExporting === 'excel' ? 'Gerando...' : 'Baixar Excel'}
                  <span className="material-symbols-rounded text-sm">arrow_forward</span>
                </span>
              </button>

              {/* Opção CSV */}
              <button
                type="button"
                disabled={isExporting !== null}
                onClick={handleExportCsv}
                className="p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 text-left flex flex-col justify-between gap-3 group transition cursor-pointer disabled:opacity-50"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2.5 group-hover:bg-blue-600 group-hover:text-white transition">
                    <span className="material-symbols-rounded text-2xl">description</span>
                  </div>
                  <h5 className="font-black text-sm text-gray-900 group-hover:text-blue-800 transition">
                    Arquivo CSV
                  </h5>
                  <p className="text-[11px] text-gray-500 font-semibold mt-1 leading-tight">
                    Texto delimitado por ponto e vírgula com codificação UTF-8 BOM.
                  </p>
                </div>
                <span className="text-xs font-black text-blue-700 flex items-center gap-1">
                  {isExporting === 'csv' ? 'Gerando...' : 'Baixar CSV'}
                  <span className="material-symbols-rounded text-sm">arrow_forward</span>
                </span>
              </button>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Modal de Excluir Clube de Competição Padronizado */}
      {deleteModalOpen && clubeToDelete && (
        <BaseModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setClubeToDelete(null);
          }}
          title="Excluir Clube de Competição"
          size="sm"
        >
          <div className="space-y-4 text-left">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-rounded text-xl">warning</span>
              </div>
              <div>
                <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">
                  Confirmação de Exclusão
                </h4>
                <p className="text-[11px] font-semibold text-rose-800">
                  Esta ação é irreversível e removerá permanentemente a equipe e todos os seus dados.
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <p className="text-xs font-black text-gray-900">
                {clubeToDelete.nome}
              </p>
              <p className="text-[11px] font-semibold text-gray-600">
                Escola: <strong>{clubeToDelete.escola}</strong> ({clubeToDelete.utec})
              </p>
              <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-gray-500">
                <span>{clubeToDelete.alunosList?.length || 0} competidores</span>
                <span>•</span>
                <span>{clubeToDelete.encontrosList?.length || 0} treinos</span>
                <span>•</span>
                <span className="uppercase text-amber-700 font-black">{clubeToDelete.competicao}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setClubeToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClube}
                className="btn-3d px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black border-b-[4px] border-rose-800 transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-rounded text-sm">delete</span>
                <span>Excluir Clube</span>
              </button>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
}
