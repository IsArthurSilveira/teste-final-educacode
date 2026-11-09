import { useEffect, useState } from 'react';
import { BaseModal } from './BaseModal';
import { FormTextInput } from './FormTextInput';
import { ModalActionRow } from './ModalActionRow';

export function ConfirmPasswordModal({
  open,
  title,
  message,
  passwordLabel = 'Senha',
  passwordPlaceholder = 'Digite sua senha',
  confirmLabel = 'Confirmar',
  saving = false,
  error = '',
  onClose,
  onConfirm,
}) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) setPassword('');
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    await onConfirm(password);
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      sizeClass="ui-modal-card ui-modal-card--sm"
      contentAs="form"
      contentProps={{ onSubmit: handleSubmit }}
      bodyClass="ui-modal-body space-y-4 text-left"
    >
      <div className="p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-red-500 text-white font-black flex items-center justify-center shrink-0 shadow-xs">
          <span className="material-symbols-rounded text-lg">lock</span>
        </div>
        <div className="text-xs">
          <strong className="block font-black text-red-900">
            Confirmação de Segurança
          </strong>
          <span className="text-red-700 font-medium text-[11px]">
            {message || 'Esta ação é irreversível. Digite sua senha para confirmar a exclusão.'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold">
          {error}
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
          {passwordLabel} *
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={passwordPlaceholder}
          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
          required
        />
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
          className="btn-3d px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black border-b-[4px] border-red-800 transition cursor-pointer shadow-xs disabled:opacity-50"
        >
          {saving ? 'PROCESSANDO...' : confirmLabel}
        </button>
      </div>
    </BaseModal>
  );
}