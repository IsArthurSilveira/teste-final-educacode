import { useState } from 'react';
import { BaseModal } from './ui/BaseModal';
import type { FotoGaleria } from '../data/defaultGaleria';

interface FotoDetailModalProps {
  foto: FotoGaleria | null;
  onClose: () => void;
  onCurtir?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export function FotoDetailModal({
  foto,
  onClose,
  onDelete,
  canDelete = false,
}: FotoDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!foto) return null;

  const formattedDate = new Date(foto.dataEnvio).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <BaseModal
      open={Boolean(foto)}
      onClose={() => {
        setConfirmDelete(false);
        onClose();
      }}
      title={foto.titulo}
      size="wide"
    >
      <div className="space-y-5 text-left">
        {/* Imagem Ampliada */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video sm:aspect-[16/9] max-h-[460px] flex items-center justify-center border border-slate-200">
          <img
            src={foto.url}
            alt={foto.titulo}
            className="w-full h-full object-contain sm:object-cover"
          />
          {(foto.clubeNome || foto.escola) && (
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/95 text-cetecBlue backdrop-blur-md shadow-md border border-white/40 flex items-center gap-1.5">
              <span className="material-symbols-rounded text-sm">groups</span>
              <span>{foto.clubeNome || foto.escola}</span>
            </span>
          )}
        </div>

        {/* Legenda Destacada */}
        <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl">
          <div className="flex items-center gap-1.5 text-blue-700 text-xs font-black uppercase tracking-wider mb-1">
            <span className="material-symbols-rounded text-base">format_quote</span>
            <span>Legenda</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
            {foto.legenda}
          </p>
        </div>

        {/* Informações do Clube e Registro */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cetecBlue text-white font-black flex items-center justify-center text-lg shadow-xs shrink-0">
              <span className="material-symbols-rounded">groups</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                Clube de Robótica
              </span>
              <h4 className="text-sm font-black text-gray-900 leading-tight">
                {foto.clubeNome || 'Clube de Robótica'}
              </h4>
              <p className="text-xs font-semibold text-gray-500">
                {foto.escola} {foto.utec ? `• ${foto.utec}` : ''}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
              Data de Envio
            </span>
            <p className="text-xs font-bold text-gray-700">{formattedDate}</p>
          </div>
        </div>

        {/* Descrição Detalhada da Atividade */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">
            Descrição da Atividade
          </h4>
          <div className="p-4 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
            {foto.descricao || 'Nenhuma descrição detalhada informada.'}
          </div>
        </div>

        {/* Selo de Conformidade e Proteção de Imagem */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
          <span className="material-symbols-rounded text-emerald-600 text-lg shrink-0">
            verified_user
          </span>
          <span>
            Imagem em conformidade com as diretrizes de privacidade e uso ético institucional de imagem.
          </span>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <a
              href={foto.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span className="material-symbols-rounded text-base">open_in_new</span>
              <span>Abrir Original</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {canDelete && onDelete && (
              <>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    Excluir Foto
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-xl border border-red-200">
                    <span className="text-xs text-red-700 font-bold px-1">Confirmar?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(foto.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-black hover:bg-red-700 cursor-pointer"
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 rounded-lg bg-white text-gray-600 text-xs font-bold hover:bg-gray-100 cursor-pointer"
                    >
                      Não
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
