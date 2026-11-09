import { useState } from 'react';
import { BaseModal } from './ui/BaseModal';
import type { ClubeCompeticao } from '../data/defaultClubesCompeticao';

interface ClubeCompeticaoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (clube: ClubeCompeticao) => void;
  clubeToEdit?: ClubeCompeticao | null;
}

export function ClubeCompeticaoModal({
  open,
  onClose,
  onSubmit,
  clubeToEdit,
}: ClubeCompeticaoModalProps) {
  const [nome, setNome] = useState(clubeToEdit?.nome || '');
  const [escola, setEscola] = useState(clubeToEdit?.escola || '');
  const [utec, setUtec] = useState(clubeToEdit?.utec || 'UTEC Santo Amaro');
  const [competicao, setCompeticao] = useState<ClubeCompeticao['competicao']>(clubeToEdit?.competicao || 'FLL');
  const [nivel, setNivel] = useState<ClubeCompeticao['nivel']>(clubeToEdit?.nivel || 'Nível 2 (Anos Finais)');
  const [prof, setProf] = useState(clubeToEdit?.prof || '');
  const [tecnico, setTecnico] = useState(clubeToEdit?.tecnico || '');
  const [dias, setDias] = useState(clubeToEdit?.dias || 'Terças e Quintas');
  const [horario, setHorario] = useState(clubeToEdit?.horario || '14:00 às 17:00');
  const [status, setStatus] = useState<ClubeCompeticao['status']>(clubeToEdit?.status || 'em_andamento');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Informe o nome da equipe/clube de competição.');
      return;
    }
    if (!escola.trim()) {
      setError('Informe a escola da equipe.');
      return;
    }

    const payload: ClubeCompeticao = {
      id: clubeToEdit?.id || `comp-${Date.now()}`,
      nome: nome.trim(),
      escola: escola.trim(),
      utec: utec.trim(),
      competicao,
      nivel,
      prof: prof.trim() || 'Não informado',
      tecnico: tecnico.trim() || 'Não informado',
      dias: dias.trim() || 'A definir',
      horario: horario.trim() || 'A definir',
      status,
      alunosList: clubeToEdit?.alunosList || [],
      encontrosList: clubeToEdit?.encontrosList || [],
    };

    onSubmit(payload);
    onClose();
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={clubeToEdit ? 'Editar Equipe de Competição' : 'Cadastrar Equipe de Competição'}
      size="wide"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
        {/* Banner de destaque Amarelo e Verde */}
        <div className="p-3 bg-gradient-to-r from-amber-500/15 via-yellow-400/10 to-emerald-500/15 border border-yellow-400/40 rounded-xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-yellow-400 text-yellow-950 font-black flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-rounded text-lg">emoji_events</span>
          </div>
          <div className="text-xs">
            <strong className="block font-black text-emerald-950">
              Clube de Robótica para Competições
            </strong>
            <span className="text-gray-600 font-medium text-[11px]">
              Cadastre e gerencie equipes de FLL, OBR e RECLINE com professor, técnico/estagiário, nível e cronograma.
            </span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Nome da Equipe, Torneio e Nível */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nome da Equipe / Clube de Competição *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: CyberDragons FLL"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400/20"
              required
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Competição *
            </label>
            <select
              value={competicao}
              onChange={(e) => setCompeticao(e.target.value as ClubeCompeticao['competicao'])}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500 cursor-pointer"
            >
              <option value="FLL">FLL (FIRST Lego League)</option>
              <option value="OBR">OBR (Olimpíada Brasileira)</option>
              <option value="RECLINE">RECLINE (Seguidor de Linha)</option>
              <option value="Geral">Geral de Competição</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nível da Equipe *
            </label>
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value as ClubeCompeticao['nivel'])}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500 cursor-pointer"
            >
              <option value="Nível 1 (Anos Iniciais)">Nível 1 (Anos Iniciais)</option>
              <option value="Nível 2 (Anos Finais)">Nível 2 (Anos Finais)</option>
            </select>
          </div>
        </div>

        {/* Escola e UTEC */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Escola Municipal *
            </label>
            <input
              type="text"
              value={escola}
              onChange={(e) => setEscola(e.target.value)}
              placeholder="Ex: E.M. Santos Dumont"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              UTEC de Apoio
            </label>
            <select
              value={utec}
              onChange={(e) => setUtec(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500 cursor-pointer"
            >
              <option value="UTEC Santo Amaro">UTEC Santo Amaro</option>
              <option value="UTEC Boa Viagem">UTEC Boa Viagem</option>
              <option value="UTEC Casa Amarela">UTEC Casa Amarela</option>
              <option value="UTEC Cordeiro">UTEC Cordeiro</option>
              <option value="UTEC Gregório Bezerra">UTEC Gregório Bezerra</option>
              <option value="UTEC Iputinga">UTEC Iputinga</option>
              <option value="UTEC Largo do Dom">UTEC Largo do Dom</option>
              <option value="UTEC Sítio Trindade">UTEC Sítio Trindade</option>
            </select>
          </div>
        </div>

        {/* Professor Responsável e Técnico / Estagiário */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Professor Responsável
            </label>
            <input
              type="text"
              value={prof}
              onChange={(e) => setProf(e.target.value)}
              placeholder="Ex: Carlos Eduardo Santos"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Técnico / Estagiário
            </label>
            <input
              type="text"
              value={tecnico}
              onChange={(e) => setTecnico(e.target.value)}
              placeholder="Ex: Lucas Gabriel (Estagiário)"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        {/* Agenda e Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Dias de Aula / Treino
            </label>
            <input
              type="text"
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              placeholder="Ex: Terças e Quintas"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Horário
            </label>
            <input
              type="text"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              placeholder="Ex: 14:00 às 17:00"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Status do Clube
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ClubeCompeticao['status'])}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-yellow-500 cursor-pointer"
            >
              <option value="pendente">PENDENTE</option>
              <option value="em_andamento">EM ANDAMENTO</option>
              <option value="concluido">CONCLUÍDO</option>
            </select>
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black border-b-[3px] border-emerald-800 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-rounded text-base">check</span>
            <span>Salvar Equipe</span>
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
