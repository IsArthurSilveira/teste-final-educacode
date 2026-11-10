import { useMemo, useState } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { BaseModal } from '../components/ui/BaseModal';
import { ProjetoFicFecomModal } from '../components/ProjetoFicFecomModal';
import {
  deleteProjetoFicFecom,
  getStoredProjetosFicFecom,
  saveProjetoFicFecom,
} from '../data/defaultProjetosFicFecom';
import type { ProjetoFicFecom } from '../data/defaultProjetosFicFecom';
import { isAnyAdmin } from '../utils/permissions';

interface ProjetosFicFecomPageProps {
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
  utecOptions?: Array<{ value: string; label: string }>;
}

export function ProjetosFicFecomPage({
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
  utecOptions = [],
}: ProjetosFicFecomPageProps) {
  const [projetos, setProjetos] = useState<ProjetoFicFecom[]>(() => getStoredProjetosFicFecom());
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [modalidadeFilter, setModalidadeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recursoFilter, setRecursoFilter] = useState('all');

  // Modais e edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<ProjetoFicFecom | null>(null);
  const [selectedProjetoId, setSelectedProjetoId] = useState<string | null>(null);

  // Modal de Exclusão Padronizado
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projetoToDelete, setProjetoToDelete] = useState<ProjetoFicFecom | null>(null);

  // Modal de Exportação
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'excel' | 'csv' | null>(null);

  const selectedProjeto = useMemo(() => {
    if (!selectedProjetoId) return null;
    return projetos.find((p) => p.id === selectedProjetoId) || null;
  }, [projetos, selectedProjetoId]);

  const normalizedSearch = search.trim().toLowerCase();

  // Filtragem e ordenação por UTEC (A-Z)
  const filteredProjetos = useMemo(() => {
    return projetos
      .filter((proj) => {
        // Filtro rápido de chips
        if (quickFilter !== 'all') {
          const qf = quickFilter.toLowerCase();
          const mod = proj.modalidade.toLowerCase();
          const st = (proj.status || '').toLowerCase();
          const matchChip =
            mod === qf ||
            st === qf ||
            (qf === 'em_andamento' && st.includes('andamento')) ||
            (qf === 'concluido' && st.includes('conclu'));
          if (!matchChip) return false;
        }

        // Filtro de modalidade
        if (modalidadeFilter !== 'all' && proj.modalidade !== modalidadeFilter) {
          return false;
        }

        // Filtro de status
        if (statusFilter !== 'all') {
          const st = (proj.status || '').toLowerCase();
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

        // Filtro de recurso de robótica
        if (recursoFilter !== 'all') {
          const hasRecurso = proj.recursosRobotica?.some(
            (r) => r.toLowerCase().includes(recursoFilter.toLowerCase())
          );
          if (!hasRecurso) return false;
        }

        // Busca por texto
        if (!normalizedSearch) return true;
        const integrantesNomes = proj.integrantesList?.map((i) => i.nome).join(' ').toLowerCase() || '';
        return (
          proj.titulo.toLowerCase().includes(normalizedSearch) ||
          proj.escola.toLowerCase().includes(normalizedSearch) ||
          proj.utec.toLowerCase().includes(normalizedSearch) ||
          (proj.professor && proj.professor.toLowerCase().includes(normalizedSearch)) ||
          proj.modalidade.toLowerCase().includes(normalizedSearch) ||
          proj.propositoColetivo.toLowerCase().includes(normalizedSearch) ||
          proj.conteudosEscolares.toLowerCase().includes(normalizedSearch) ||
          integrantesNomes.includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        const utecA = String(a.utec || '').trim().toUpperCase();
        const utecB = String(b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          return String(a.titulo || '').localeCompare(String(b.titulo || ''), 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });
  }, [projetos, normalizedSearch, quickFilter, modalidadeFilter, statusFilter, recursoFilter]);

  // Indicadores rápidos DINÂMICOS baseados nos filtros
  const totalProjetos = filteredProjetos.length;
  const totalFIC = filteredProjetos.filter((p) => p.modalidade === 'FIC').length;
  const totalFECOM = filteredProjetos.filter((p) => p.modalidade === 'FECOM').length;
  const totalAlunos = filteredProjetos.reduce((acc, p) => acc + (p.integrantesList?.length || 0), 0);
  const totalAtivos = filteredProjetos.filter((p) => p.status === 'em_andamento').length;

  function handleSave(projeto: ProjetoFicFecom) {
    const updated = saveProjetoFicFecom(projeto);
    setProjetos(updated);
    setEditingProjeto(null);
  }

  function handleOpenDeleteModal(projeto: ProjetoFicFecom) {
    setProjetoToDelete(projeto);
    setDeleteModalOpen(true);
  }

  function handleConfirmDeleteProjeto() {
    if (!projetoToDelete) return;
    const updated = deleteProjetoFicFecom(projetoToDelete.id);
    setProjetos(updated);
    if (selectedProjetoId === projetoToDelete.id) {
      setSelectedProjetoId(null);
    }
    setDeleteModalOpen(false);
    setProjetoToDelete(null);
  }

  function handleUpdateProjectStatus(nextStatus: ProjetoFicFecom['status']) {
    if (!selectedProjeto) return;
    const updated: ProjetoFicFecom = {
      ...selectedProjeto,
      status: nextStatus,
    };
    handleSave(updated);
  }

  // Exportar Excel (.xlsx) padronizado por UTEC (A-Z)
  async function handleExportExcel() {
    setIsExporting('excel');
    try {
      const { utils, writeFile } = await import('xlsx');

      const sorted = [...filteredProjetos].sort((a, b) => {
        const utecA = String(a.utec || '').trim().toUpperCase();
        const utecB = String(b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          return String(a.titulo || '').localeCompare(String(b.titulo || ''), 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });

      const rows = sorted.map((p) => {
        const integrantesStr = p.integrantesList?.map((i) => `${i.nome} (${i.anoEscolar})`).join(', ') || '-';
        const recursosStr = p.recursosRobotica?.join(', ') || '-';
        return {
          'UTEC': p.utec || 'Não informada',
          'ESCOLA': p.escola,
          'TÍTULO DO PROJETO': p.titulo,
          'MODALIDADE': p.modalidade,
          'STATUS': p.status === 'em_andamento' ? 'EM ANDAMENTO' : p.status === 'concluido' ? 'CONCLUÍDO' : 'PENDENTE',
          'PROFESSOR(A)': p.professor || '-',
          'TÉCNICO / ESTAGIÁRIO': p.estagiario || '-',
          'QTD INTEGRANTES': p.integrantesList?.length || 0,
          'INTEGRANTES': integrantesStr,
          'RECURSOS DE ROBÓTICA': recursosStr,
          'JUSTIFICATIVA': p.justificativaTematica,
          'PROPÓSITO COLETIVO': p.propositoColetivo,
          'CONTEÚDOS ESCOLARES': p.conteudosEscolares,
          'COMPETÊNCIAS BNCC': p.competenciasBncc,
          'HABILIDADES BNCC': p.habilidadesBncc,
        };
      });

      const worksheet = utils.json_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 18 },
        { wch: 28 },
        { wch: 35 },
        { wch: 14 },
        { wch: 16 },
        { wch: 22 },
        { wch: 22 },
        { wch: 16 },
        { wch: 40 },
        { wch: 25 },
        { wch: 45 },
        { wch: 45 },
        { wch: 35 },
        { wch: 35 },
        { wch: 35 },
      ];

      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Projetos FIC & FECOM');
      const dateStr = new Date().toISOString().split('T')[0];
      writeFile(workbook, `projetos_fic_fecom_por_utec_${dateStr}.xlsx`);
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

      const sorted = [...filteredProjetos].sort((a, b) => {
        const utecA = String(a.utec || '').trim().toUpperCase();
        const utecB = String(b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          return String(a.titulo || '').localeCompare(String(b.titulo || ''), 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });

      const now = new Date();
      const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Cabeçalho institucional
      doc.setFillColor(1, 30, 98); // cetecBlue
      doc.rect(0, 0, 297, 20, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('RELATÓRIO DE PROJETOS FIC & FECOM - ROBÓTICA', 14, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(220, 235, 255);
      doc.text(`Gerado em: ${dateFormatted} | Organizado por UTEC (Ordem Alfabética A-Z) | Total: ${sorted.length} projetos`, 14, 26);

      const tableRows = sorted.map((p) => {
        const statusText = p.status === 'em_andamento' ? 'Em Andamento' : p.status === 'concluido' ? 'Concluído' : 'Pendente';
        const integrantesResumo = p.integrantesList?.map((i) => i.nome).slice(0, 2).join(', ') + (p.integrantesList && p.integrantesList.length > 2 ? ` (+${p.integrantesList.length - 2})` : '');
        return [
          p.utec || 'UTEC',
          p.escola || '-',
          p.titulo || '-',
          p.modalidade,
          statusText,
          p.professor || '-',
          String(p.integrantesList?.length || 0),
          integrantesResumo || '-',
          p.recursosRobotica?.join(', ') || '-',
          p.conteudosEscolares?.slice(0, 45) + (p.conteudosEscolares && p.conteudosEscolares.length > 45 ? '...' : ''),
        ];
      });

      autoTable(doc, {
        startY: 30,
        head: [['UTEC', 'ESCOLA', 'PROJETO', 'MODALIDADE', 'STATUS', 'PROFESSOR', 'ALUNOS', 'INTEGRANTES', 'RECURSOS', 'CONTEÚDOS ESCOLARES']],
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
          0: { fontStyle: 'bold', textColor: [1, 30, 98], cellWidth: 24 },
          1: { cellWidth: 32 },
          2: { fontStyle: 'bold', cellWidth: 42 },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'center', cellWidth: 22 },
          5: { cellWidth: 25 },
          6: { halign: 'center', cellWidth: 14 },
          7: { cellWidth: 35 },
          8: { cellWidth: 30 },
          9: { cellWidth: 35 },
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
      doc.save(`projetos_fic_fecom_por_utec_${dateStr}.pdf`);
      setShowExportModal(false);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
    } finally {
      setIsExporting(null);
    }
  }

  // Exportar CSV
  function handleExportCsv() {
    setIsExporting('csv');
    try {
      const sorted = [...filteredProjetos].sort((a, b) => {
        const utecA = String(a.utec || '').trim().toUpperCase();
        const utecB = String(b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          return String(a.titulo || '').localeCompare(String(b.titulo || ''), 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });

      const headers = ['UTEC', 'ESCOLA', 'TÍTULO DO PROJETO', 'MODALIDADE', 'STATUS', 'PROFESSOR', 'QTD INTEGRANTES', 'RECURSOS ROBÓTICA', 'JUSTIFICATIVA', 'PROPÓSITO'];
      const escapeCsv = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;

      const lines = [
        headers.join(';'),
        ...sorted.map((p) => {
          const statusText = p.status === 'em_andamento' ? 'EM ANDAMENTO' : p.status === 'concluido' ? 'CONCLUÍDO' : 'PENDENTE';
          return [
            escapeCsv(p.utec || 'UTEC'),
            escapeCsv(p.escola),
            escapeCsv(p.titulo),
            escapeCsv(p.modalidade),
            escapeCsv(statusText),
            escapeCsv(p.professor),
            escapeCsv(p.integrantesList?.length || 0),
            escapeCsv(p.recursosRobotica?.join(', ')),
            escapeCsv(p.justificativaTematica),
            escapeCsv(p.propositoColetivo),
          ].join(';');
        }),
      ];

      const csvContent = '\uFEFF' + lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `projetos_fic_fecom_por_utec_${dateStr}.csv`);
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

  const isAdmin = isAnyAdmin(userRole);

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="projetos-fic-fecom"
        userName={userName}
        allowUsersTools={allowUsersTools}
        onLogout={onLogout}
        onOpenDashboard={onOpenDashboard}
        onOpenClubs={onOpenClubs}
        onOpenAdminUsers={onOpenAdminUsers}
        onOpenRoteiros={onOpenRoteiros}
        onOpenGaleria={onOpenGaleria}
        onOpenClubesCompeticao={onOpenClubesCompeticao || (() => {})}
        onOpenProjetosFicFecom={onOpenProjetosFicFecom || (() => {})}
        onOpenDatabaseControl={onOpenDatabaseControl}
      />

      <main className="app-main-pane dashboard-main-modern flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-y-auto relative bg-white lg:h-screen">
        <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full relative z-10 bg-white">
          {/* ============================================================ */}
          {/* MODO 1: DETALHE DO PROJETO SELECIONADO */}
          {/* ============================================================ */}
          {selectedProjeto ? (
            <div className="flex flex-col space-y-4 animate-[fadeIn_0.3s_ease-in-out]">
              {/* Botões de Ação Topo */}
              <div className="flex justify-between items-center pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedProjetoId(null)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <span className="material-symbols-rounded text-sm">arrow_back</span>
                  <span>Voltar aos Projetos</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProjeto(selectedProjeto);
                      setModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <span className="material-symbols-rounded text-sm">edit</span>
                    <span>Editar Informações</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(selectedProjeto)}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      title="Excluir este projeto"
                    >
                      <span className="material-symbols-rounded text-sm">delete</span>
                      <span>Excluir</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedProjetoId(null)}
                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition shadow-xs font-black text-xs flex items-center justify-center cursor-pointer"
                    type="button"
                    aria-label="Fechar detalhes"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Card Superior com Informações do Projeto */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-blue-200 shadow-sm relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Nome e Status - Padronizado igual a Clubes de Competição e Clubes Regulares */}
                  <div className="flex flex-col gap-2 min-w-0 lg:col-span-4">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
                      {selectedProjeto.titulo}
                    </h2>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={selectedProjeto.status}
                        onChange={(e) => handleUpdateProjectStatus(e.target.value as any)}
                        className={`text-xs font-black px-3 py-1.5 rounded-lg border cursor-pointer outline-none transition ${
                          selectedProjeto.status === 'em_andamento'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : selectedProjeto.status === 'concluido'
                            ? 'bg-yellow-100 text-yellow-900 border-yellow-400'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        <option value="pendente">PENDENTE</option>
                        <option value="em_andamento">EM ANDAMENTO</option>
                        <option value="concluido">CONCLUÍDO</option>
                      </select>

                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                        selectedProjeto.modalidade === 'FIC'
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {selectedProjeto.modalidade}
                      </span>

                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-cetecBlue border border-blue-200">
                        Mostra Científica
                      </span>
                    </div>
                  </div>

                  {/* Informações detalhadas */}
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-6">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                        1. Localização
                      </span>
                      <p className="text-sm font-black text-gray-900 leading-tight">
                        {selectedProjeto.escola}
                      </p>
                      <span className="text-xs font-bold text-cetecBlue block mt-0.5">
                        {selectedProjeto.utec}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                        Equipe Orientadora
                      </span>
                      <p className="text-xs font-black text-gray-900">
                        <strong className="text-gray-400 font-bold">Prof:</strong> {selectedProjeto.professor || 'Não informado'}
                      </p>
                      {selectedProjeto.estagiario && (
                        <p className="text-xs font-black text-emerald-800 mt-0.5">
                          <strong className="text-gray-400 font-bold">Estagiário:</strong> {selectedProjeto.estagiario}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                        9. Recursos Usados
                      </span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {selectedProjeto.recursosRobotica?.map((rec) => (
                          <span key={rec} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black">
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Compacto com Distribuição Equilibrada e Alinhada */}
              <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-2 gap-4 items-stretch">
                {/* Coluna Esquerda: Integrantes + BNCC (lg:col-span-5 lg:row-span-2 - Tamanhos de Referência) */}
                <div className="lg:col-span-5 lg:row-span-2 grid grid-rows-subgrid gap-4">
                  {/* Card 1: Integrantes da Equipe (REFERÊNCIA DE ALTURA LINHA 1) */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-gray-200 shadow-xs flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-rounded text-cetecBlue text-xl">groups</span>
                          <h3 className="font-black text-sm sm:text-base text-gray-900">
                            2. Integrantes da Equipe ({selectedProjeto.integrantesList?.length || 0})
                          </h3>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-500 mb-2 font-medium">
                        Alunos representantes no dia da mostra científica:
                      </p>
                    </div>

                    <div className="overflow-y-auto space-y-1.5 pr-1 h-[190px] max-h-[190px]">
                      {(!selectedProjeto.integrantesList || selectedProjeto.integrantesList.length === 0) ? (
                        <p className="text-xs text-gray-400 text-center py-6">
                          Nenhum integrante cadastrado neste projeto.
                        </p>
                      ) : (
                        selectedProjeto.integrantesList.map((aluno, index) => (
                          <div
                            key={aluno.id || `aluno-${index}`}
                            className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs hover:border-gray-300 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                                  aluno.genero === 'F' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                <span className="material-symbols-rounded text-sm">
                                  {aluno.genero === 'F' ? 'female' : 'person'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <span className="block font-black text-xs text-gray-900 truncate">
                                  {aluno.nome}
                                </span>
                                <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                  {aluno.matricula && (
                                    <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-1.5 py-0.2 rounded">
                                      Mat: {aluno.matricula}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-1.5 py-0.2 rounded">
                                    {aluno.anoEscolar}
                                  </span>
                                  <span
                                    className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                      aluno.genero === 'F'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}
                                  >
                                    {aluno.genero === 'F' ? 'Fem' : 'Masc'}
                                  </span>
                                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    <span className="material-symbols-rounded text-[11px]">apparel</span>
                                    {aluno.tamanhoCamisa || 'M'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Card 2: Dimensão Pedagógica & BNCC (REFERÊNCIA DE ALTURA LINHA 2) */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-amber-300 shadow-xs flex flex-col justify-between h-full bg-gradient-to-br from-amber-50/30 via-white to-white">
                    <div>
                      <div className="flex items-center gap-2 pb-2 border-b border-amber-100 mb-2.5">
                        <span className="material-symbols-rounded text-amber-700 text-lg">school</span>
                        <div>
                          <h3 className="font-black text-sm sm:text-base text-gray-900">
                            Dimensão Pedagógica & Alinhamento à BNCC
                          </h3>
                          <p className="text-[10px] text-gray-500 font-medium">
                            Conteúdos curriculares, competências e habilidades da computação
                          </p>
                        </div>
                      </div>

                      <div className="mb-2.5">
                        <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block mb-1">
                          Conteúdos Escolares Presentes:
                        </span>
                        <p className="text-xs text-gray-800 leading-relaxed font-semibold bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs max-h-[70px] overflow-y-auto">
                          {selectedProjeto.conteudosEscolares || 'Não informado.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block mb-1">
                          Competências BNCC:
                        </span>
                        <p className="text-xs text-gray-800 leading-relaxed font-semibold bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs max-h-[95px] overflow-y-auto">
                          {selectedProjeto.competenciasBncc || 'Não informado.'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider block mb-1">
                          Habilidades BNCC:
                        </span>
                        <p className="text-xs text-gray-800 leading-relaxed font-semibold bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs max-h-[95px] overflow-y-auto">
                          {selectedProjeto.habilidadesBncc || 'Não informado.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Concepção + Processo (lg:col-span-7 lg:row-span-2 - Alinhados às referências) */}
                <div className="lg:col-span-7 lg:row-span-2 grid grid-rows-subgrid gap-4">
                  {/* Card 1: Concepção, Temática e Propósito (ALINHADO COM INTEGRANTES) */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-gray-200 shadow-xs flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-2">
                        <span className="material-symbols-rounded text-cetecBlue text-lg">psychology</span>
                        <h3 className="font-black text-sm sm:text-base text-gray-900">
                          Concepção do Projeto & O P de Propósito
                        </h3>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider block mb-1">
                          4. Justificativa dos Motivos & Escolha da Temática:
                        </span>
                        <p className="text-xs text-gray-700 leading-relaxed font-semibold bg-gray-50 p-2.5 sm:p-3 rounded-xl border border-gray-200 max-h-[85px] overflow-y-auto">
                          {selectedProjeto.justificativaTematica || 'Não informado.'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block mb-1">
                          7. O P de Propósito (Relevância Social, Cultural ou Ambiental):
                        </span>
                        <p className="text-xs text-emerald-950 leading-relaxed font-semibold bg-emerald-50/60 p-2.5 sm:p-3 rounded-xl border border-emerald-200/70 max-h-[85px] overflow-y-auto">
                          {selectedProjeto.propositoColetivo || 'Não informado.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Processo de Construção e Pensar Brincando (ALINHADO COM DIMENSÃO PEDAGÓGICA) */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-gray-200 shadow-xs flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-2">
                        <span className="material-symbols-rounded text-cetecBlue text-lg">construction</span>
                        <h3 className="font-black text-sm sm:text-base text-gray-900">
                          Processo de Construção & Pensar Brincando
                        </h3>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider block mb-1">
                          5. Processo de Construção e Participação da Equipe:
                        </span>
                        <p className="text-xs text-gray-700 leading-relaxed font-semibold bg-gray-50 p-2.5 sm:p-3 rounded-xl border border-gray-200 max-h-[90px] overflow-y-auto">
                          {selectedProjeto.processoConstrucao || 'Não informado.'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-cetecBlue tracking-wider block mb-1">
                          6. O Pensar Brincando com Linguagem de Programação:
                        </span>
                        <p className="text-xs text-blue-950 leading-relaxed font-semibold bg-blue-50/60 p-2.5 sm:p-3 rounded-xl border border-blue-200/70 max-h-[90px] overflow-y-auto">
                          {selectedProjeto.pensarBrincando || 'Não informado.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* MODO 2: LISTAGEM GERAL DE PROJETOS FIC & FECOM */
            /* ============================================================ */
            <>
              {/* Header Padronizado */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-emerald-500/5 to-transparent p-5 sm:p-6 rounded-[2rem] border-2 border-blue-200/60 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cetecBlue to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
                    <span className="material-symbols-rounded text-2xl sm:text-3xl font-black">science</span>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-cetecBlue tracking-tight">
                      Projetos FIC & FECOM
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 font-semibold">
                      Projetos escolares de robótica, pensamento computacional e mostras científicas
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingProjeto(null);
                    setModalOpen(true);
                  }}
                  className="btn-3d self-start md:self-center px-5 py-3 rounded-2xl bg-cetecGreen text-white font-black text-xs sm:text-sm flex items-center gap-2 border-b-[5px] border-cetecGreenDark hover:bg-[#7ed152] active:scale-95 transition cursor-pointer shadow-md shadow-emerald-900/20"
                >
                  <span className="material-symbols-rounded text-lg">add_circle</span>
                  <span>+ NOVO PROJETO</span>
                </button>
              </div>

              {/* 4 Cards de Métricas Rápidas Dinâmicas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border-2 border-blue-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-cetecBlue flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-xl">folder_special</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Total de Projetos
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black text-cetecBlue">
                        {totalProjetos}
                      </span>
                      <span className="text-[11px] font-bold text-gray-500">
                        ({totalFIC} FIC / {totalFECOM} FECOM)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-emerald-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-cetecGreenDark flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-xl">groups</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Alunos Integrantes
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-gray-900">
                      {totalAlunos}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-amber-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-xl">smart_toy</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Mostra Científica
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-950">
                      FIC / FECOM
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

              {/* Área de Filtros e Pesquisa */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3 w-full">
                  {/* Barra de Pesquisa */}
                  <div className="flex-1 flex items-center bg-white rounded-xl border-2 border-gray-200 px-3.5 h-[42px] shadow-xs focus-within:border-cetecGreen focus-within:ring-2 focus-within:ring-cetecGreen/20 transition-all">
                    <span className="material-symbols-rounded text-[18px] text-gray-400 mr-2 shrink-0">
                      search
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Pesquisar por projeto, escola, UTEC, temática ou integrante..."
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-bold text-gray-700 placeholder:text-gray-400 placeholder:font-semibold h-full"
                      aria-label="Pesquisar projetos"
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

                  {/* Select de Modalidade: FIC / FECOM */}
                  <select
                    value={modalidadeFilter}
                    onChange={(event) => setModalidadeFilter(event.target.value)}
                    className="bg-white border-2 border-gray-200 rounded-xl px-3 h-[42px] text-xs font-bold text-gray-700 outline-none focus:border-cetecGreen cursor-pointer shadow-xs min-w-[170px]"
                    title="Filtrar por modalidade"
                  >
                    <option value="all">Modalidade: Todas</option>
                    <option value="FIC">FIC</option>
                    <option value="FECOM">FECOM</option>
                  </select>

                  {/* Select de Status */}
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="bg-white border-2 border-gray-200 rounded-xl px-3 h-[42px] text-xs font-bold text-gray-700 outline-none focus:border-cetecGreen cursor-pointer shadow-xs min-w-[160px]"
                    title="Filtrar por status"
                  >
                    <option value="all">Status: Todos</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="pendente">Pendente</option>
                  </select>

                  {/* Select de Recurso de Robótica */}
                  <select
                    value={recursoFilter}
                    onChange={(event) => setRecursoFilter(event.target.value)}
                    className="bg-white border-2 border-gray-200 rounded-xl px-3 h-[42px] text-xs font-bold text-gray-700 outline-none focus:border-cetecGreen cursor-pointer shadow-xs min-w-[170px]"
                    title="Filtrar por recurso de robótica"
                  >
                    <option value="all">Recursos: Todos</option>
                    <option value="NAO">Humanóide NAO</option>
                    <option value="EV3">LEGO EV3</option>
                    <option value="WeDo">LEGO WeDo</option>
                    <option value="Arduino">Arduino / Maker</option>
                  </select>

                  {/* Botão de Exportar */}
                  <button
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    className="btn-3d px-4 h-[42px] rounded-xl bg-white border-2 border-emerald-600/70 text-emerald-800 hover:bg-emerald-50 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition shrink-0"
                    title="Exportar projetos por UTEC em PDF, Excel ou CSV"
                  >
                    <span className="material-symbols-rounded text-lg text-emerald-700">ios_share</span>
                    <span>Exportar</span>
                  </button>
                </div>

                {/* Chips de Filtro Rápido */}
                <div className="flex flex-wrap gap-2 w-full justify-start items-center">
                  <button
                    type="button"
                    onClick={() => setQuickFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                      quickFilter === 'all'
                        ? 'bg-cetecBlue text-white border-cetecBlue shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-cetecBlue'
                    }`}
                  >
                    <span className="material-symbols-rounded text-[16px]">groups</span>
                    <span>Todos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickFilter('fic')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                      quickFilter === 'fic'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-900'
                    }`}
                  >
                    <span className="material-symbols-rounded text-[16px]">science</span>
                    <span>FIC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickFilter('fecom')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                      quickFilter === 'fecom'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-amber-50 hover:text-amber-900'
                    }`}
                  >
                    <span className="material-symbols-rounded text-[16px]">lightbulb</span>
                    <span>FECOM</span>
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

              {/* Grid de Cards dos Projetos */}
              {filteredProjetos.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-2">
                  <span className="material-symbols-rounded text-5xl text-blue-500/60">science</span>
                  <h3 className="text-base font-bold text-gray-700">Nenhum projeto encontrado</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Tente ajustar os filtros ou submeta um novo projeto FIC ou FECOM para sua escola!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProjeto(null);
                      setModalOpen(true);
                    }}
                    className="mt-3 px-4 py-2 bg-cetecGreen text-white font-black rounded-xl text-xs hover:bg-[#7ed152] transition cursor-pointer shadow-xs"
                  >
                    Cadastrar Projeto Agora
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredProjetos.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProjetoId(proj.id)}
                      className="bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-cetecGreen shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between gap-4 text-left cursor-pointer"
                    >
                      <div>
                        {/* Topo do Card: Modalidade e Status */}
                        <div className="flex items-start justify-between gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            proj.modalidade === 'FIC'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {proj.modalidade}
                          </span>

                          <span
                            className={`font-black text-[10px] px-2 py-0.5 rounded-lg border uppercase tracking-wider shrink-0 ${
                              proj.status === 'em_andamento'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : proj.status === 'concluido'
                                ? 'bg-yellow-100 text-yellow-900 border-yellow-300'
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            {proj.status === 'em_andamento'
                              ? 'Em Andamento'
                              : proj.status === 'concluido'
                              ? 'Concluído'
                              : 'Pendente'}
                          </span>
                        </div>

                        {/* Título do Projeto */}
                        <h3 className="text-base font-black text-gray-900 group-hover:text-cetecBlue transition-colors line-clamp-2 mt-2">
                          {proj.titulo}
                        </h3>

                        {/* Badges de Escola e UTEC */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          <span className="bg-indigo-50/70 text-indigo-800 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border border-indigo-100 inline-block truncate max-w-full">
                            {proj.escola}
                          </span>
                          <span className="bg-emerald-50 text-emerald-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border border-emerald-200 inline-block truncate max-w-full">
                            {proj.utec}
                          </span>
                        </div>

                        {/* Justificativa / Propósito Snippet */}
                        {proj.propositoColetivo && (
                          <p className="mt-2.5 text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                            {proj.propositoColetivo}
                          </p>
                        )}

                        {/* Recursos de Robótica */}
                        {proj.recursosRobotica && proj.recursosRobotica.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3 pt-2.5 border-t border-gray-100">
                            {proj.recursosRobotica.map((rec) => (
                              <span key={rec} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold">
                                {rec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Rodapé do Card: Integrantes e Ações */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                        <span className="text-cetecBlue font-black text-xs leading-none">
                          {proj.integrantesList?.length || 0} Integrantes
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProjeto(proj);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-cetecGreen hover:bg-emerald-50 transition cursor-pointer"
                            title="Editar projeto"
                          >
                            <span className="material-symbols-rounded text-base">edit</span>
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteModal(proj);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Excluir projeto"
                            >
                              <span className="material-symbols-rounded text-base">delete</span>
                            </button>
                          )}
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

      {/* Modal de Cadastro / Edição de Projeto */}
      <ProjetoFicFecomModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProjeto(null);
        }}
        onSubmit={handleSave}
        projetoToEdit={editingProjeto}
        utecOptions={utecOptions}
      />

      {/* Modal de Exportação Padronizado por UTEC */}
      {showExportModal && (
        <BaseModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="Exportar Relatório de Projetos FIC & FECOM"
          size="md"
        >
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 via-emerald-50/50 to-blue-50 rounded-2xl border border-blue-200/80">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cetecBlue to-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
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

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs font-bold text-gray-700">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-emerald-600 text-lg">filter_alt</span>
                <span>Filtro aplicado: <strong className="text-gray-900">{modalidadeFilter === 'all' ? 'Todas modalidades' : modalidadeFilter} • {statusFilter === 'all' ? 'Todos status' : statusFilter} • {quickFilter === 'all' ? 'Todos' : quickFilter}</strong></span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-black">
                {filteredProjetos.length} {filteredProjetos.length === 1 ? 'projeto' : 'projetos'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* PDF */}
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

              {/* Excel */}
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
                    Arquivo .xlsx estruturado com colunas formatadas por UTEC e conteúdos BNCC.
                  </p>
                </div>
                <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                  {isExporting === 'excel' ? 'Gerando...' : 'Baixar Excel'}
                  <span className="material-symbols-rounded text-sm">arrow_forward</span>
                </span>
              </button>

              {/* CSV */}
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

      {/* Modal de Excluir Projeto FIC & FECOM Padronizado */}
      {deleteModalOpen && projetoToDelete && (
        <BaseModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setProjetoToDelete(null);
          }}
          title="Excluir Projeto"
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
                  Esta ação é irreversível e removerá permanentemente o projeto e todos os seus dados.
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <p className="text-xs font-black text-gray-900">
                {projetoToDelete.titulo}
              </p>
              <p className="text-[11px] font-semibold text-gray-600">
                Escola: <strong>{projetoToDelete.escola}</strong> ({projetoToDelete.utec})
              </p>
              <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-gray-500">
                <span>{projetoToDelete.integrantesList?.length || 0} integrantes</span>
                <span>•</span>
                <span className="uppercase text-blue-700 font-black">{projetoToDelete.modalidade}</span>
                <span>•</span>
                <span className="capitalize">{projetoToDelete.status === 'em_andamento' ? 'Em andamento' : projetoToDelete.status === 'concluido' ? 'Concluído' : 'Pendente'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setProjetoToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProjeto}
                className="btn-3d px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black border-b-[4px] border-rose-800 transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-rounded text-sm">delete</span>
                <span>Excluir Projeto</span>
              </button>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
}
