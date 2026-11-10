export interface FotoGaleria {
  id: string;
  url: string;
  titulo: string;
  legenda: string;
  descricao: string;
  autor: string;
  cargoAutor?: string;
  escola?: string;
  utec?: string;
  clubeNome?: string;
  modulo?: string;
  dataEnvio: string;
  curtidas?: number;
  consentimentoConfirmado: boolean;
}

export const DEFAULT_FOTOS_GALERIA: FotoGaleria[] = [];
const GALERIA_STORAGE_KEY = 'painel_galeria_fotos_v3';
const LEGACY_GALERIA_STORAGE_KEY = 'painel_galeria_fotos_v2';

export function getStoredGaleriaFotos(): FotoGaleria[] {
  try {
    localStorage.removeItem(LEGACY_GALERIA_STORAGE_KEY);
    const raw = localStorage.getItem(GALERIA_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao carregar fotos da galeria:', err);
    return [];
  }
}

export function saveFotoGaleria(novaFoto: FotoGaleria): FotoGaleria[] {
  try {
    const existing = getStoredGaleriaFotos();
    const index = existing.findIndex((foto) => foto.id === novaFoto.id);
    const updated = index >= 0
      ? existing.map((foto, fotoIndex) => (fotoIndex === index ? novaFoto : foto))
      : [novaFoto, ...existing];
    localStorage.setItem(GALERIA_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao salvar foto na galeria:', err);
    return getStoredGaleriaFotos();
  }
}

export function deleteFotoGaleria(id: string): FotoGaleria[] {
  try {
    const updated = getStoredGaleriaFotos().filter((foto) => foto.id !== id);
    localStorage.setItem(GALERIA_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao excluir foto da galeria:', err);
    return getStoredGaleriaFotos();
  }
}

export function toggleCurtidaFoto(id: string): FotoGaleria[] {
  try {
    const updated = getStoredGaleriaFotos().map((foto) =>
      foto.id === id ? { ...foto, curtidas: (foto.curtidas || 0) + 1 } : foto
    );
    localStorage.setItem(GALERIA_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao curtir foto na galeria:', err);
    return getStoredGaleriaFotos();
  }
}
