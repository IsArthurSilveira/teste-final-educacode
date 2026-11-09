import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { DashboardView } from '../components/DashboardView';

export function DashboardPage({
  userName,
  allowCreateClub,
  allowAdminTools = false,
  allowUsersTools = false,
  onLogout,
  onOpenNewClubModal,
  onOpenAdminDeleteClubs,
  onOpenAdminUsers,
  clubes,
  genderStats,
  loading,
  error,
}) {
  const navigate = useNavigate();
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  async function handleExportExcel() {
    setIsExportingExcel(true);
    try {
      const { utils, writeFile } = await import('xlsx');

      // Ordenar os clubes pelo nome da UTEC de forma ascendente (A-Z)
      const sortedClubes = [...clubes].sort((a, b) => {
        const utecA = String(a.nomeUtec || a.nome_utec || a.utec || '').trim().toUpperCase();
        const utecB = String(b.nomeUtec || b.nome_utec || b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          const nomeA = String(a.nome || '').trim().toUpperCase();
          const nomeB = String(b.nome || '').trim().toUpperCase();
          return nomeA.localeCompare(nomeB, 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });

      // Indicadores Gerais Consolidados
      const totalClubes = sortedClubes.length;
      let totalAlunosGeral = 0;
      let totalAlunosM = 0;
      let totalAlunosF = 0;
      let totalEncontrosRealizados = 0;
      let sumCompletion = 0;
      const uniqueSchools = new Set();

      sortedClubes.forEach((clube) => {
        totalAlunosGeral += Number(clube.alunos || 0);
        totalAlunosM += Number(clube.alunosM || 0);
        totalAlunosF += Number(clube.alunosF || 0);
        
        const encontrosCount = Number(clube.encontrosFeitos || 0);
        totalEncontrosRealizados += encontrosCount;
        
        const percentualVal = clube.percentualConclusao !== undefined && clube.percentualConclusao !== null
          ? Number(clube.percentualConclusao)
          : Math.round((encontrosCount / 16) * 100);
        sumCompletion += Math.max(0, Math.min(100, percentualVal));
        
        if (clube.escola) {
          uniqueSchools.add(String(clube.escola).trim().toUpperCase());
        }
      });

      const totalEscolas = uniqueSchools.size;
      const overallCompletionRate = totalClubes > 0 ? Math.round(sumCompletion / totalClubes) : 0;

      const data = sortedClubes.map((clube) => {
        // Calcular percentual de conclusão de forma robusta
        const encontros = Number(clube.encontrosFeitos || 0);
        const percentualVal = clube.percentualConclusao !== undefined && clube.percentualConclusao !== null
          ? Number(clube.percentualConclusao)
          : Math.round((encontros / 16) * 100);
        const percentualFormatted = `${Math.max(0, Math.min(100, percentualVal))}%`;

        // Normalizar Categoria e Status
        const catLower = String(clube.categoria || '').toLowerCase();
        let categoriaLabel = 'Iniciais';
        if (catLower.includes('mist')) categoriaLabel = 'Mistos';
        else if (catLower.includes('fina')) categoriaLabel = 'Finais';

        const statusLower = String(clube.status || '').toLowerCase();
        let statusLabel = 'Pendente';
        if (statusLower.includes('andamento') || statusLower === 'em andamento') {
          statusLabel = 'Em andamento';
        } else if (statusLower.includes('conclui') || statusLower.includes('concluí') || statusLower === 'feito') {
          statusLabel = 'Concluído';
        }

        const nomeDaUtec = String(clube.nomeUtec || clube.nome_utec || clube.utec || '-').trim();

        return {
          'ID CLUBE': clube.id || '-',
          'NOME DO CLUBE': clube.nome || '-',
          'ESCOLA': clube.escola || '-',
          'UTEC': nomeDaUtec,
          'CATEGORIA': categoriaLabel,
          'STATUS': statusLabel.toUpperCase(),
          'QTD ALUNOS': clube.alunos || 0,
          'QTD MASCULINO (M)': clube.alunosM || 0,
          'QTD FEMININO (F)': clube.alunosF || 0,
          'ENCONTROS REALIZADOS': encontros,
          '% CONCLUSÃO (META 16)': percentualFormatted,
        };
      });

      const sheet = utils.json_to_sheet(data);

      // Adiciona linhas de resumo após o final dos dados
      const startRow = data.length + 3; // Pula duas linhas
      const summaryRows = [
        ['RESUMO GERAL DO RELATÓRIO', ''],
        ['Total de Clubes:', totalClubes],
        ['Total de Alunos:', totalAlunosGeral],
        ['Total Masculino (M):', totalAlunosM],
        ['Total Feminino (F):', totalAlunosF],
        ['Quantidade de Escolas:', totalEscolas],
        ['Total de Encontros Realizados:', totalEncontrosRealizados],
        ['Taxa Média de Conclusão:', `${overallCompletionRate}%`],
      ];

      utils.sheet_add_aoa(sheet, summaryRows, { origin: `A${startRow}` });

      // Auto-ajustar larguras das colunas
      const colWidths = {};
      // Iniciar com largura mínima correspondente ao tamanho dos cabeçalhos
      if (data.length > 0) {
        Object.keys(data[0]).forEach((key) => {
          colWidths[key] = Math.max(key.length + 3, 10);
        });
      }
      // Calcular tamanho máximo com base nos dados
      data.forEach((row) => {
        Object.keys(row).forEach((key) => {
          const valueStr = String(row[key] ?? '');
          if (valueStr.length > (colWidths[key] || 10)) {
            colWidths[key] = valueStr.length + 2;
          }
        });
      });
      sheet['!cols'] = Object.keys(colWidths).map((key) => ({ wch: colWidths[key] }));

      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, sheet, 'Lista de Clubes');
      
      const formattedDate = new Date().toISOString().slice(0, 10);
      writeFile(workbook, `painel_clubes_cetec_${formattedDate}.xlsx`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingExcel(false);
    }
  }

  async function handleExportPdf() {
    setIsExportingPdf(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF({ orientation: 'landscape' });
      const totalPagesExp = '{total_pages_count_string}';

      // Ordenar os clubes pelo nome da UTEC de forma ascendente (A-Z)
      const sortedClubes = [...clubes].sort((a, b) => {
        const utecA = String(a.nomeUtec || a.nome_utec || a.utec || '').trim().toUpperCase();
        const utecB = String(b.nomeUtec || b.nome_utec || b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          const nomeA = String(a.nome || '').trim().toUpperCase();
          const nomeB = String(b.nome || '').trim().toUpperCase();
          return nomeA.localeCompare(nomeB, 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });

      // Indicadores Gerais Consolidados
      const totalClubes = sortedClubes.length;
      let totalAlunosGeral = 0;
      let totalAlunosM = 0;
      let totalAlunosF = 0;
      let totalEncontrosRealizados = 0;
      let sumCompletion = 0;
      const uniqueSchools = new Set();

      sortedClubes.forEach((clube) => {
        totalAlunosGeral += Number(clube.alunos || 0);
        totalAlunosM += Number(clube.alunosM || 0);
        totalAlunosF += Number(clube.alunosF || 0);
        
        const encontrosCount = Number(clube.encontrosFeitos || 0);
        totalEncontrosRealizados += encontrosCount;
        
        const percentualVal = clube.percentualConclusao !== undefined && clube.percentualConclusao !== null
          ? Number(clube.percentualConclusao)
          : Math.round((encontrosCount / 16) * 100);
        sumCompletion += Math.max(0, Math.min(100, percentualVal));
        
        if (clube.escola) {
          uniqueSchools.add(String(clube.escola).trim().toUpperCase());
        }
      });

      const totalEscolas = uniqueSchools.size;
      const overallCompletionRate = totalClubes > 0 ? Math.round(sumCompletion / totalClubes) : 0;

      autoTable(doc, {
        startY: 32,
        head: [['ID', 'NOME DO CLUBE', 'ESCOLA', 'UTEC', 'CATEGORIA', 'STATUS', 'ALUNOS', 'M', 'F', 'ENCONTROS', '% CONCLUÍDO']],
        body: sortedClubes.map((clube) => {
          const encontros = Number(clube.encontrosFeitos || 0);
          const percentualVal = clube.percentualConclusao !== undefined && clube.percentualConclusao !== null
            ? Number(clube.percentualConclusao)
            : Math.round((encontros / 16) * 100);
          const percentualFormatted = `${Math.max(0, Math.min(100, percentualVal))}%`;

          const catLower = String(clube.categoria || '').toLowerCase();
          let categoriaLabel = 'Iniciais';
          if (catLower.includes('mist')) categoriaLabel = 'Mistos';
          else if (catLower.includes('fina')) categoriaLabel = 'Finais';

          const statusLower = String(clube.status || '').toLowerCase();
          let statusLabel = 'PENDENTE';
          if (statusLower.includes('andamento') || statusLower === 'em andamento') {
            statusLabel = 'EM ANDAMENTO';
          } else if (statusLower.includes('conclui') || statusLower.includes('concluí') || statusLower === 'feito') {
            statusLabel = 'CONCLUÍDO';
          }

          const nomeDaUtec = String(clube.nomeUtec || clube.nome_utec || clube.utec || '-').trim();

          return [
            clube.id || '-',
            clube.nome || '-',
            clube.escola || '-',
            nomeDaUtec,
            categoriaLabel,
            statusLabel,
            String(clube.alunos || 0),
            String(clube.alunosM || 0),
            String(clube.alunosF || 0),
            String(encontros),
            percentualFormatted,
          ];
        }),
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          font: 'helvetica',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [3, 37, 140], // Azul padrão CETEC / ID
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 14, fontStyle: 'bold' }, // ID
          1: { fontStyle: 'bold', cellWidth: 'auto' }, // NOME DO CLUBE
          2: { cellWidth: 'auto' }, // ESCOLA
          3: { cellWidth: 35 }, // UTEC
          4: { halign: 'center', cellWidth: 20 }, // CATEGORIA
          5: { halign: 'center', cellWidth: 25 }, // STATUS
          6: { halign: 'center', cellWidth: 14 }, // ALUNOS
          7: { halign: 'center', cellWidth: 10 }, // M
          8: { halign: 'center', cellWidth: 10 }, // F
          9: { halign: 'center', cellWidth: 18 }, // ENCONTROS
          10: { halign: 'center', cellWidth: 20 }, // % CONCLUÍDO
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { top: 32, bottom: 18, left: 14, right: 14 },
        didDrawPage: function (data) {
          // Retângulo Sólido de Cabeçalho Superior Azul do CETEC
          doc.setFillColor(3, 37, 140);
          doc.rect(14, 10, doc.internal.pageSize.width - 28, 15, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('PAINEL DE CONTROL DE CLUBES - RELATÓRIO GERAL', 20, 19.5);

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, doc.internal.pageSize.width - 90, 19.5);

          // Rodapé de Página
          const str = `Página ${data.pageNumber} de ` + totalPagesExp;
          doc.setFontSize(7.5);
          doc.setTextColor(110);
          doc.text(str, doc.internal.pageSize.width - 32, doc.internal.pageSize.height - 8);
          doc.text('CETEC - Gestão Estratégica de Robótica e Programação | EducaCode', 14, doc.internal.pageSize.height - 8);
        },
      });

      const finalY = doc.lastAutoTable?.finalY || 32;

      // Adiciona tabela de resumo geral no PDF
      autoTable(doc, {
        startY: finalY + 12,
        head: [['MÉTRICA / INDICADOR CONSOLIDADO', 'VALOR']],
        body: [
          ['Total de Clubes', String(totalClubes)],
          ['Total de Alunos Geral', String(totalAlunosGeral)],
          ['Alunos do Gênero Masculino (M)', String(totalAlunosM)],
          ['Alunos do Gênero Feminino (F)', String(totalAlunosF)],
          ['Quantidade de Escolas Atendidas', String(totalEscolas)],
          ['Total de Encontros Realizados', String(totalEncontrosRealizados)],
          ['Taxa Média de Conclusão', `${overallCompletionRate}%`],
        ],
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8.5, cellPadding: 3, font: 'helvetica' },
        headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' }, // Laranja CETEC
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100 },
          1: { halign: 'center', cellWidth: 40 },
        },
        theme: 'grid',
      });

      if (typeof doc.putTotalPages === 'function') {
        doc.putTotalPages(totalPagesExp);
      }

      const formattedDate = new Date().toISOString().slice(0, 10);
      doc.save(`painel_clubes_cetec_${formattedDate}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="dashboard"
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
                <span className="material-symbols-rounded text-2xl sm:text-3xl font-black">monitoring</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-cetecBlue text-white px-2 py-0.5 rounded-md">
                    CICLO 2026
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    Atualização automática
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-cetecBlue tracking-tight">
                  Visão Geral Estratégica
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold">
                  Resumo operacional dos clubes com foco em acompanhamento e cobertura territorial
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <button
                type="button"
                disabled={isExportingExcel || isExportingPdf}
                onClick={handleExportExcel}
                className="bg-white text-cetecBlue font-black py-2.5 px-4 rounded-xl border border-blue-200 hover:bg-blue-50 text-xs shadow-xs transition inline-flex items-center justify-center gap-1.5 w-full sm:w-auto disabled:opacity-50 disabled:cursor-wait cursor-pointer"
              >
                {isExportingExcel ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-cetecBlue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded text-[16px]">table_view</span>
                    Excel
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isExportingExcel || isExportingPdf}
                onClick={handleExportPdf}
                className="bg-white text-cetecBlue font-black py-2.5 px-4 rounded-xl border border-blue-200 hover:bg-blue-50 text-xs shadow-xs transition inline-flex items-center justify-center gap-1.5 w-full sm:w-auto disabled:opacity-50 disabled:cursor-wait cursor-pointer"
              >
                {isExportingPdf ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-cetecBlue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded text-[16px]">picture_as_pdf</span>
                    PDF
                  </>
                )}
              </button>
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
          </div>

          <div className="pb-5 flex-1 flex flex-col min-h-0">
            {loading && <div className="ui-state-panel ui-state-panel--loading">A sincronizar com a base de dados...</div>}
            {error && <div className="ui-state-panel ui-state-panel--empty text-red-500">{error}</div>}

            {!loading && !error && (
              <DashboardView
                clubes={clubes}
                genderStats={genderStats}
                onSelectClub={(clube) => navigate(`/clubes/${clube.id}`, { state: { from: '/dashboard' } })}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
