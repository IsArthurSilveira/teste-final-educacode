import { BaseModal } from './ui/BaseModal';
import type { RoteiroDidatico } from '../data/defaultRoteiros';

interface RoteiroDetailModalProps {
  open: boolean;
  onClose: () => void;
  roteiro: RoteiroDidatico | null;
  onEdit?: (roteiro: RoteiroDidatico) => void;
  isAdmin?: boolean;
}

export function RoteiroDetailModal({ open, onClose, roteiro, onEdit, isAdmin }: RoteiroDetailModalProps) {
  if (!roteiro) return null;

  const isIniciais = roteiro.segmento === 'ANOS INICIAIS';

  function handlePrint() {
    window.print();
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title=""
      size="wide"
    >
      <div className="space-y-6 text-left -mt-2">
        {/* Header do Roteiro */}
        <div className="border-b border-gray-100 pb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                isIniciais
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isIniciais ? 'Anos Iniciais (1º ao 5º)' : 'Anos Finais (6º ao 9º)'}
            </span>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
              {roteiro.anoSugerido}
            </span>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                isIniciais
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <span className="material-symbols-rounded text-sm">schedule</span>
              <span>{roteiro.duracao}</span>
            </span>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
              Nível: {roteiro.nivel}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-cetecBlue tracking-tight mb-1">
            {roteiro.titulo}
          </h2>
          <p className="text-sm font-semibold text-gray-500">
            {roteiro.subtitulo}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span
                className={`material-symbols-rounded text-sm ${
                  isIniciais ? 'text-blue-600' : 'text-emerald-600'
                }`}
              >
                widgets
              </span>
              Módulo: <strong>{roteiro.modulo || roteiro.categoria}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                title="Imprimir ou Salvar PDF"
              >
                <span className="material-symbols-rounded text-base">print</span>
                <span>Imprimir Roteiro</span>
              </button>
              {isAdmin && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(roteiro)}
                  className={`px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                    isIniciais
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <span className="material-symbols-rounded text-base">edit</span>
                  <span>Editar Plano</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Habilidades BNCC */}
        {roteiro.bncc && roteiro.bncc.length > 0 && (
          <div
            className={`p-4 rounded-2xl border ${
              isIniciais
                ? 'bg-blue-50/60 border-blue-200/80'
                : 'bg-emerald-50/60 border-emerald-200/80'
            }`}
          >
            <h4
              className={`text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                isIniciais ? 'text-blue-900' : 'text-emerald-900'
              }`}
            >
              <span
                className={`material-symbols-rounded text-base ${
                  isIniciais ? 'text-blue-600' : 'text-emerald-600'
                }`}
              >
                school
              </span>
              Alinhamento com a BNCC (Base Nacional Comum Curricular):
            </h4>
            <div className="flex flex-wrap gap-2">
              {roteiro.bncc.map((codigo) => (
                <span
                  key={codigo}
                  className={`px-2.5 py-1 bg-white rounded-lg text-xs font-mono font-bold shadow-2xs border ${
                    isIniciais
                      ? 'text-blue-800 border-blue-300'
                      : 'text-emerald-800 border-emerald-300'
                  }`}
                >
                  {codigo}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Objetivos de Aprendizagem */}
        <div>
          <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1.5">
            <span
              className={`material-symbols-rounded text-base ${
                isIniciais ? 'text-blue-600' : 'text-emerald-600'
              }`}
            >
              flag
            </span>
            Objetivos Pedagógicos de Aprendizagem:
          </h4>
          <ul className="space-y-1.5">
            {roteiro.objetivos.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                <span
                  className={`w-5 h-5 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                    isIniciais
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <span className="material-symbols-rounded text-[14px]">check</span>
                </span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Materiais Necessários */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
          <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1.5">
            <span
              className={`material-symbols-rounded text-base ${
                isIniciais ? 'text-blue-600' : 'text-emerald-600'
              }`}
            >
              build
            </span>
            Materiais & Recursos Didáticos:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700">
            {roteiro.materiais.map((mat, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-100">
                <span
                  className={`material-symbols-rounded text-base shrink-0 ${
                    isIniciais ? 'text-blue-600' : 'text-emerald-600'
                  }`}
                >
                  check_circle
                </span>
                <span>{mat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Roteiro Passo a Passo da Aula */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
            <span
              className={`material-symbols-rounded text-base ${
                isIniciais ? 'text-blue-600' : 'text-emerald-600'
              }`}
            >
              timeline
            </span>
            Estrutura da Aula (Passo a Passo Metodológico):
          </h4>

          <div className="space-y-3">
            {/* 1. Aquecimento */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-2xl shadow-2xs">
              <span className="text-[11px] font-black uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block mb-1">
                1. Acolhimento & Sensibilização
              </span>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                {roteiro.etapas.aquecimento}
              </p>
            </div>

            {/* 2. Desenvolvimento */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-2xl shadow-2xs">
              <span className="text-[11px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1">
                2. Investigação & Conceitos-Chave
              </span>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                {roteiro.etapas.desenvolvimento}
              </p>
            </div>

            {/* 3. Mão na Massa */}
            <div
              className={`p-3.5 bg-white border-2 rounded-2xl shadow-2xs ${
                isIniciais
                  ? 'border-blue-200 bg-blue-50/20'
                  : 'border-emerald-200 bg-emerald-50/20'
              }`}
            >
              <span
                className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-md inline-block mb-1 ${
                  isIniciais
                    ? 'text-blue-800 bg-blue-100'
                    : 'text-emerald-800 bg-emerald-100'
                }`}
              >
                3. Atividade Maker (Mão na Massa)
              </span>
              <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-semibold">
                {roteiro.etapas.maoNaMassa}
              </p>
            </div>

            {/* 4. Desafio Extra */}
            {roteiro.etapas.desafio && (
              <div className="p-3.5 bg-white border border-gray-200 rounded-2xl shadow-2xs">
                <span className="text-[11px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mb-1">
                  4. Desafio de Aprofundamento / Missão
                </span>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                  {roteiro.etapas.desafio}
                </p>
              </div>
            )}

            {/* 5. Avaliação */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-2xl shadow-2xs">
              <span className="text-[11px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-1">
                5. Compartilhamento, Reflexão & Avaliação
              </span>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                {roteiro.etapas.avaliacao}
              </p>
            </div>
          </div>
        </div>

        {/* Link / Material Complementar */}
        {roteiro.linkMaterial && (
          <div className="pt-2">
            <a
              href={roteiro.linkMaterial}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition ${
                isIniciais
                  ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <span className="material-symbols-rounded text-base">link</span>
              <span>Acessar Material Complementar / Arquivos Externos</span>
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
