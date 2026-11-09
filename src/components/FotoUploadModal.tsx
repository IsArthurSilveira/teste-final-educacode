import { useMemo, useState } from 'react';
import { BaseModal } from './ui/BaseModal';
import type { FotoGaleria } from '../data/defaultGaleria';

export interface ClubeOption {
  id?: string;
  nome: string;
  escola?: string;
  utec?: string;
  nomeUtec?: string;
}

interface FotoUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (foto: FotoGaleria) => void;
  currentUser: string;
  clubes?: ClubeOption[];
}

const DEFAULT_FALLBACK_CLUBES: ClubeOption[] = [
  { id: 'c1', nome: 'Clube de Robótica Santos Dumont', escola: 'Escola Municipal Santos Dumont', utec: 'UTEC Santo Amaro' },
  { id: 'c2', nome: 'Clube Maker Dom Bosco', escola: 'Escola Dom Bosco', utec: 'UTEC Boa Viagem' },
  { id: 'c3', nome: 'Clube Futuro Maker', escola: 'Escola Paulo Freire', utec: 'UTEC Casa Amarela' },
  { id: 'c4', nome: 'Clube Tech Tiradentes', escola: 'Escola Tiradentes', utec: 'UTEC Cordeiro' },
  { id: 'c5', nome: 'Clube Pequenos Inventores', escola: 'Escola Cecília Meireles', utec: 'UTEC Santo Amaro' },
  { id: 'c6', nome: 'Clube Python & Robótica', escola: 'Escola Gilberto Freyre', utec: 'UTEC Boa Viagem' },
];

export function FotoUploadModal({
  open,
  onClose,
  onSubmit,
  currentUser,
  clubes = [],
}: FotoUploadModalProps) {
  const availableClubes = useMemo(() => {
    if (clubes && clubes.length > 0) {
      return clubes.filter((c) => Boolean(c.nome && c.nome.trim()));
    }
    return DEFAULT_FALLBACK_CLUBES;
  }, [clubes]);

  const [previewUrl, setPreviewUrl] = useState('');
  const [titulo, setTitulo] = useState('');
  const [legenda, setLegenda] = useState('');
  const [descricao, setDescricao] = useState('');
  const [selectedClubeId, setSelectedClubeId] = useState('');
  const [clubeNome, setClubeNome] = useState('');
  const [escola, setEscola] = useState('');
  const [utec, setUtec] = useState('');
  const [consentimento, setConsentimento] = useState(false);
  const [error, setError] = useState('');

  function handleSelectClube(identifier: string) {
    setSelectedClubeId(identifier);
    const found = availableClubes.find((c) => (c.id && c.id === identifier) || c.nome === identifier);
    if (found) {
      setClubeNome(found.nome);
      setEscola(found.escola || '');
      setUtec(found.nomeUtec || found.utec || '');
    } else {
      setClubeNome('');
      setEscola('');
      setUtec('');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('A imagem selecionada deve ter no máximo 8MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const finalImage = previewUrl.trim();
    if (!finalImage) {
      setError('Por favor selecione um arquivo de imagem.');
      return;
    }
    if (!titulo.trim()) {
      setError('Informe um título para a foto.');
      return;
    }
    if (!legenda.trim()) {
      setError('Informe uma legenda curta para a foto.');
      return;
    }
    if (!clubeNome.trim()) {
      setError('Por favor selecione um clube do banco de dados.');
      return;
    }
    if (!consentimento) {
      setError('É obrigatório confirmar a conformidade com as diretrizes de privacidade e imagem.');
      return;
    }

    const novaFoto: FotoGaleria = {
      id: `foto-${Date.now()}`,
      url: finalImage,
      titulo: titulo.trim(),
      legenda: legenda.trim(),
      descricao: descricao.trim() || legenda.trim(),
      autor: currentUser.trim() || 'Educador Maker',
      cargoAutor: 'Educador Maker',
      escola: escola.trim(),
      utec: utec.trim(),
      clubeNome: clubeNome.trim() || escola.trim() || 'Clube de Robótica',
      dataEnvio: new Date().toISOString(),
      curtidas: 1,
      consentimentoConfirmado: true,
    };

    onSubmit(novaFoto);
    // Reset form
    setPreviewUrl('');
    setTitulo('');
    setLegenda('');
    setDescricao('');
    setSelectedClubeId('');
    setClubeNome('');
    setEscola('');
    setUtec('');
    setConsentimento(false);
    onClose();
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Enviar Foto para a Galeria"
      size="wide"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-left">
        {/* Banner de Privacidade Compacto */}
        <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs text-amber-900">
          <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded text-sm">shield</span>
          </span>
          <p className="text-[11px] leading-tight text-amber-900 font-medium">
            <strong className="font-bold text-amber-950">Lembrete:</strong> Fotos de menores de 18 anos exigem consentimento dos responsáveis. Priorize fotos dos protótipos e robôs.
          </p>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Upload da Imagem com Prévia Compacta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Upload do Arquivo *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-cetecBlue file:text-white hover:file:bg-blue-800 file:cursor-pointer cursor-pointer border border-dashed border-gray-300 rounded-lg p-1.5 bg-white"
            />
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              PNG, JPG ou WEBP (máx. 8MB)
            </p>
          </div>

          <div className="border border-dashed border-gray-300 rounded-lg bg-white flex items-center justify-center overflow-hidden h-20">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Prévia"
                className="w-full h-full object-cover"
                onError={() => setError('Não foi possível carregar a prévia da imagem.')}
              />
            ) : (
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
                <span className="material-symbols-rounded text-base">add_photo_alternate</span>
                <span>Prévia da Foto</span>
              </div>
            )}
          </div>
        </div>

        {/* Título e Legenda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Título da Foto / Projeto *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Seguidor de Linha em Ação"
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Legenda Resumida *
            </label>
            <input
              type="text"
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              placeholder="Ex: Teste com sensores no percurso"
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Descrição Detalhada Compacta */}
        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Descrição Completa da Atividade
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            placeholder="Descreva o que foi construído e conceitos explorados pela equipe..."
            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Metadados: Clube, Escola, UTEC */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Clube *
            </label>
            <select
              value={selectedClubeId}
              onChange={(e) => handleSelectClube(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              required
            >
              <option value="">Selecione o Clube...</option>
              {availableClubes.map((c) => (
                <option key={c.id || c.nome} value={c.id || c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Escola (Automático)
            </label>
            <input
              type="text"
              value={escola}
              readOnly
              placeholder="Preenchido pelo clube"
              className="w-full px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              UTEC (Automático)
            </label>
            <input
              type="text"
              value={utec}
              readOnly
              placeholder="Preenchido pelo clube"
              className="w-full px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Checkbox de Consentimento Obrigatório */}
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <label className="flex items-start gap-2 cursor-pointer text-[11px] font-semibold text-slate-800 leading-tight">
            <input
              type="checkbox"
              checked={consentimento}
              onChange={(e) => setConsentimento(e.target.checked)}
              className="mt-0.5 rounded text-cetecBlue focus:ring-blue-500 cursor-pointer"
              required
            />
            <span>
              Declaro que esta publicação está em conformidade com as diretrizes de privacidade e imagem institucional (possui termo de consentimento dos responsáveis ou o registro é focado nos projetos e protótipos).
            </span>
          </label>
        </div>

        {/* Botões do Formulário */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-cetecBlue text-white text-xs font-black hover:bg-blue-800 transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-rounded text-base">cloud_upload</span>
            <span>Publicar Foto</span>
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
