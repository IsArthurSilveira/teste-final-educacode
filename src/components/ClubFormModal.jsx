import { useEffect, useState } from 'react';
import { BaseModal } from './ui/BaseModal';
import { FormSelect } from './ui/FormSelect';
import { FormTextInput } from './ui/FormTextInput';
import { ModalActionRow } from './ui/ModalActionRow';
import { toUpperText } from '../utils/clubes';

const EMPTY_FORM = {
  nome: '',
  escola: '',
  utec: '',
  prof: '',
  estag: '',
  dias: '',
  horario: '',
  categoria: 'Clubes Iniciais',
};

export function ClubFormModal({
  open,
  title,
  initialValues = null,
  lockedUtec = '',
  showUtecPlaceholder = false,
  utecOptions = [],
  onClose,
  onSubmit,
  saving = false,
  error = '',
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      setForm({
        nome: initialValues.nome || '',
        escola: initialValues.escola || '',
        utec: initialValues.utec || '',
        prof: initialValues.prof || '',
        estag: initialValues.estag || '',
        dias: initialValues.dias || '',
        horario: initialValues.horario || '',
        categoria: initialValues.categoria || 'Clubes Iniciais',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, initialValues]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      nome: toUpperText(form.nome, ''),
      escola: toUpperText(form.escola, ''),
      utec: String(form.utec || ''),
      prof: toUpperText(form.prof, ''),
      estag: toUpperText(form.estag, ''),
      dias: toUpperText(form.dias, ''),
      horario: toUpperText(form.horario, ''),
      categoria: toUpperText(form.categoria, 'Clubes Iniciais'),
    };

    await onSubmit(payload);
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      sizeClass="ui-modal-card"
      contentAs="form"
      contentProps={{ onSubmit: handleSubmit }}
      bodyClass="ui-modal-body space-y-4"
    >
      {/* Banner de destaque padronizado */}
      <div className="p-3 bg-gradient-to-r from-blue-600/10 via-emerald-500/10 to-transparent border border-blue-200/60 rounded-xl flex items-center gap-2.5 text-left">
        <div className="w-8 h-8 rounded-lg bg-cetecBlue text-white font-black flex items-center justify-center shrink-0 shadow-xs">
          <span className="material-symbols-rounded text-lg">groups</span>
        </div>
        <div className="text-xs">
          <strong className="block font-black text-cetecBlue">
            Clube de Robótica & Programação
          </strong>
          <span className="text-gray-600 font-medium text-[11px]">
            Cadastre e gerencie turmas de Anos Iniciais, Finais e Mistos com professor, estagiário e horários.
          </span>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold text-left">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-left">
        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Nome do Clube *
          </label>
          <input
            type="text"
            placeholder="Ex: UTEC GREGORIO 01"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen focus:ring-2 focus:ring-cetecGreen/20"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Escola Municipal *
          </label>
          <input
            type="text"
            placeholder="Ex: E.M. João Cabral"
            value={form.escola}
            onChange={(e) => setForm({ ...form, escola: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen focus:ring-2 focus:ring-cetecGreen/20"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            UTEC de Apoio *
          </label>
          <select
            value={form.utec}
            onChange={(e) => setForm({ ...form, utec: e.target.value })}
            disabled={Boolean(lockedUtec)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen cursor-pointer disabled:opacity-60"
            required
          >
            {showUtecPlaceholder && (
              <option value="" disabled>Selecione uma UTEC</option>
            )}
            {utecOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Professor Responsável *
          </label>
          <input
            type="text"
            placeholder="Ex: Maria Silva"
            value={form.prof}
            onChange={(e) => setForm({ ...form, prof: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen focus:ring-2 focus:ring-cetecGreen/20"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Estagiário Responsável *
          </label>
          <input
            type="text"
            placeholder="Ex: Arthur Silveira"
            value={form.estag}
            onChange={(e) => setForm({ ...form, estag: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen focus:ring-2 focus:ring-cetecGreen/20"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Dias dos Encontros *
          </label>
          <input
            type="text"
            placeholder="Ex: Quinta e Sexta"
            value={form.dias}
            onChange={(e) => setForm({ ...form, dias: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen focus:ring-2 focus:ring-cetecGreen/20"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Horário *
          </label>
          <input
            type="text"
            placeholder="Ex: 14:30 às 16:00"
            value={form.horario}
            onChange={(e) => setForm({ ...form, horario: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen focus:ring-2 focus:ring-cetecGreen/20"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Categoria *
          </label>
          <select
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-cetecGreen cursor-pointer"
          >
            <option value="Clubes Iniciais">Clubes Iniciais</option>
            <option value="Clubes Mistos">Clubes Mistos</option>
            <option value="Clubes Finais">Clubes Finais</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-3d px-5 py-2.5 rounded-xl bg-cetecGreen hover:bg-[#7ed152] text-white text-xs font-black border-b-[4px] border-cetecGreenDark transition cursor-pointer shadow-xs disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Clube'}
        </button>
      </div>
    </BaseModal>
  );
}
