const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbxb9aezMHm1qOIjZ4RQdzrc-Ip3nMZ72D96HPO44H-CNvI4awPVFTGUG7R9tRvCVFjd/exec';

export const API_URL: string = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

export const DEFAULT_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://medjlrmycnssnlzhzyrm.supabase.co';

export const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_1K4DCdFf7p9JbbQqI2SF0g_Y5-647gB';

export function getStoredSupabaseConfig() {
  if (typeof window === 'undefined') {
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_PUBLISHABLE_KEY, isCustom: false };
  }
  const customUrl = localStorage.getItem('CUSTOM_SUPABASE_URL');
  const customKey = localStorage.getItem('CUSTOM_SUPABASE_KEY');
  const hasCustom = Boolean(customUrl && customUrl.trim());
  return {
    url: (hasCustom && customUrl ? customUrl.trim() : DEFAULT_SUPABASE_URL),
    key: (customKey && customKey.trim()) ? customKey.trim() : DEFAULT_SUPABASE_PUBLISHABLE_KEY,
    isCustom: hasCustom,
  };
}

const currentConfig = getStoredSupabaseConfig();
export const SUPABASE_URL: string = currentConfig.url;
export const SUPABASE_PUBLISHABLE_KEY: string = currentConfig.key;

const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
export const IS_LOCALHOST: boolean = ['127.0.0.1', 'localhost'].includes(currentHost);

