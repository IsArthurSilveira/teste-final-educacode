import { useEffect, useState } from 'react';
import { BaseModal } from './ui/BaseModal';
import type { RoteiroDidatico } from '../data/defaultRoteiros';
import { MODULOS_ANOS_INICIAIS, MODULOS_ANOS_FINAIS } from '../data/defaultRoteiros';

interface RoteiroFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (roteiro: RoteiroDidatico) => Promise<void>;
  initialValues?: RoteiroDidatico | null;
  saving?: boolean;
  error?: string;
}

export function RoteiroFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  saving = false,
  error = '',
}: RoteiroFormModalProps) {
  const [segmento, setSegmento] = useState<'ANOS INICIAIS' | 'ANOS FINAIS'>('ANOS INICIAIS');
  const [modulo, setModulo] = useState<string>('Scratch Jr');
  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [anoSugerido, setAnoSugerido] = useState('1º e 2º Ano');
  const [categoria, setCategoria] = useState('');
  const [duracao, setDuracao] = useState('2 Encontros (4 horas/aula)');
  const [nivel, setNivel] = useState<'Iniciante' | 'Intermediário' | 'Avançado'>('Iniciante');
  const [bnccText, setBnccText] = useState('');
  const [objetivosText, setObjetivosText] = useState('');
  const [materiaisText, setMateriaisText] = useState('');
  const [aquecimento, setAquecimento] = useState('');
  const [desenvolvimento, setDesenvolvimento] = useState('');
  const [maoNaMassa, setMaoNaMassa] = useState('');
  const [desafio, setDesafio] = useState('');
  const [avaliacao, setAvaliacao] = useState('');
  const [linkMaterial, setLinkMaterial] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (initialValues) {
      setSegmento(initialValues.segmento);
      setModulo(initialValues.modulo || initialValues.categoria || (initialValues.segmento === 'ANOS INICIAIS' ? 'Scratch Jr' : 'Scratch'));
      setTitulo(initialValues.titulo);
      setSubtitulo(initialValues.subtitulo);
      setAnoSugerido(
        initialValues.anoSugerido === 'Anos Finais' || initialValues.segmento === 'ANOS FINAIS'
          ? 'Anos Finais'
          : 'Anos Iniciais'
      );
      setCategoria(initialValues.categoria || initialValues.modulo || '');
      setDuracao(initialValues.duracao);
      setNivel(initialValues.nivel);
      setBnccText((initialValues.bncc || []).join(', '));
      setObjetivosText((initialValues.objetivos || []).join('\n'));
      setMateriaisText((initialValues.materiais || []).join('\n'));
      setAquecimento(initialValues.etapas?.aquecimento || '');
      setDesenvolvimento(initialValues.etapas?.desenvolvimento || '');
      setMaoNaMassa(initialValues.etapas?.maoNaMassa || '');
      setDesafio(initialValues.etapas?.desafio || '');
      setAvaliacao(initialValues.etapas?.avaliacao || '');
      setLinkMaterial(initialValues.linkMaterial || '');
    } else {
      setSegmento('ANOS INICIAIS');
      setModulo('Scratch Jr');
      setTitulo('');
      setSubtitulo('');
      setAnoSugerido('Anos Iniciais');
      setCategoria('Scratch Jr');
      setDuracao('2 Encontros (4 horas/aula)');
      setNivel('Iniciante');
      setBnccText('');
      setObjetivosText('');
      setMateriaisText('');
      setAquecimento('');
      setDesenvolvimento('');
      setMaoNaMassa('');
      setDesafio('');
      setAvaliacao('');
      setLinkMaterial('');
    }
    setLocalError('');
  }, [initialValues, open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError('');

    if (!titulo.trim()) {
      setLocalError('O título do plano de aula é obrigatório.');
      return;
    }
    if (!subtitulo.trim()) {
      setLocalError('O resumo ou tema do plano de aula é obrigatório.');
      return;
    }

    const bncc = bnccText
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const objetivos = objetivosText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const materiais = materiaisText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: RoteiroDidatico = {
      id: initialValues?.id || `rot-custom-${Date.now()}`,
      segmento,
      modulo: modulo.trim(),
      categoria: modulo.trim(),
      titulo: titulo.trim(),
      subtitulo: subtitulo.trim(),
      anoSugerido: anoSugerido.trim(),
      duracao: duracao.trim(),
      nivel,
      bncc: bncc.length > 0 ? bncc : ['EF01MA09'],
      objetivos: objetivos.length > 0 ? objetivos : ['Compreender os princípios básicos do desafio proposto.'],
      materiais: materiais.length > 0 ? materiais : ['Kit de robótica educacional e materiais de apoio.'],
      etapas: {
        aquecimento: aquecimento.trim() || 'Roda de conversa introdutória e contextualização do problema.',
        desenvolvimento: desenvolvimento.trim() || 'Apresentação dos conceitos científicos e instrução guiada.',
        maoNaMassa: maoNaMassa.trim() || 'Construção prática do protótipo e testes em duplas.',
        desafio: desafio.trim() || 'Desafio de aprimoramento para equipes que finalizarem antes.',
        avaliacao: avaliacao.trim() || 'Apresentação coletiva dos resultados e reflexão.',
      },
      linkMaterial: linkMaterial.trim(),
      autor: initialValues?.autor || 'Administrador CETEC',
      createdAt: initialValues?.createdAt || new Date().toISOString(),
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setLocalError(err?.message || 'Erro ao salvar plano de aula.');
    }
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={initialValues ? 'Editar Plano de Aula' : 'Novo Plano de Aula / Roteiro Didático'}
      size="wide"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Título e Subtítulo */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Título do Roteiro *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Robô Seguidor de Linha com Sensores Ópticos"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Tema / Subtítulo Pedagógico *
            </label>
            <input
              type="text"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Ex: Eletrônica aplicada, reflexão de luz infravermelha e controle de motores DC"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Linha de Metadados: Ano Escolar, Módulo, Duração, Nível */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Ano Escolar *
            </label>
            <select
              value={anoSugerido === 'Anos Finais' || segmento === 'ANOS FINAIS' ? 'Anos Finais' : 'Anos Iniciais'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Anos Finais') {
                  setSegmento('ANOS FINAIS');
                  setAnoSugerido('Anos Finais');
                  if (!MODULOS_ANOS_FINAIS.includes(modulo)) {
                    setModulo('Scratch');
                  }
                } else {
                  setSegmento('ANOS INICIAIS');
                  setAnoSugerido('Anos Iniciais');
                  if (!MODULOS_ANOS_INICIAIS.includes(modulo)) {
                    setModulo('Scratch Jr');
                  }
                }
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Anos Iniciais">Anos Iniciais</option>
              <option value="Anos Finais">Anos Finais</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Módulo do Plano *
            </label>
            <select
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500"
            >
              {segmento === 'ANOS INICIAIS'
                ? MODULOS_ANOS_INICIAIS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                : MODULOS_ANOS_FINAIS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Duração Estimada
            </label>
            <input
              type="text"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              placeholder="Ex: 2 Encontros (4h)"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Nível
            </label>
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500"
            >
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>
          </div>
        </div>

        {/* Habilidades BNCC */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
            Códigos BNCC (separados por vírgula)
          </label>
          <input
            type="text"
            value={bnccText}
            onChange={(e) => setBnccText(e.target.value)}
            placeholder="Ex: EF03CI01, EF04CI04, EF05MA18"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-cetecOrange"
          />
        </div>

        {/* Objetivos e Materiais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Objetivos de Aprendizagem (um por linha)
            </label>
            <textarea
              rows={3}
              value={objetivosText}
              onChange={(e) => setObjetivosText(e.target.value)}
              placeholder="Compreender o princípio dos sensores infravermelhos&#10;Programar o algoritmo de desvio de linha"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-cetecOrange"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Materiais & Recursos (um por linha)
            </label>
            <textarea
              rows={3}
              value={materiaisText}
              onChange={(e) => setMateriaisText(e.target.value)}
              placeholder="Chassi de acrílico com 2 motores&#10;Placa microcontroladora&#10;2 Sensores TCRT5000"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-cetecOrange"
            />
          </div>
        </div>

        {/* Etapas da Aula */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-xs font-black uppercase text-slate-700 tracking-wider">
            Passo a Passo Metodológico da Aula:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                1. Acolhimento & Sensibilização
              </label>
              <textarea
                rows={2}
                value={aquecimento}
                onChange={(e) => setAquecimento(e.target.value)}
                placeholder="Como iniciar a aula e despertar o interesse dos estudantes..."
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                2. Investigação & Conceitos
              </label>
              <textarea
                rows={2}
                value={desenvolvimento}
                onChange={(e) => setDesenvolvimento(e.target.value)}
                placeholder="Conceitos científicos e demonstração de componentes..."
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                3. Atividade Mão na Massa (Maker) *
              </label>
              <textarea
                rows={2}
                value={maoNaMassa}
                onChange={(e) => setMaoNaMassa(e.target.value)}
                placeholder="Montagem, programação em blocos e testes em pista..."
                className="w-full p-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                4. Desafio Extra / Extensão
              </label>
              <textarea
                rows={2}
                value={desafio}
                onChange={(e) => setDesafio(e.target.value)}
                placeholder="Desafio complementar para grupos mais rápidos..."
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              5. Compartilhamento, Reflexão & Avaliação Formativa
            </label>
            <textarea
              rows={2}
              value={avaliacao}
              onChange={(e) => setAvaliacao(e.target.value)}
              placeholder="Roda de encerramento, registro no diário de bordo e autoavaliação..."
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Link complementar */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
            Link para Arquivo / Simulador / PDF (Opcional)
          </label>
          <input
            type="url"
            value={linkMaterial}
            onChange={(e) => setLinkMaterial(e.target.value)}
            placeholder="https://drive.google.com/... ou https://scratch.mit.edu/..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-cetecOrange"
          />
        </div>

        {(localError || error) && (
          <p className="text-red-600 font-bold text-xs p-2.5 bg-red-50 border border-red-200 rounded-xl">
            {localError || error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-3d px-6 py-2.5 bg-cetecOrange text-white font-black rounded-xl border-b-[4px] border-[#c55411] hover:bg-[#ff7e33] text-xs sm:text-sm transition cursor-pointer"
            disabled={saving}
          >
            {saving ? 'A SALVAR...' : initialValues ? 'SALVAR ALTERAÇÕES' : 'CRIAR PLANO DE AULA'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
