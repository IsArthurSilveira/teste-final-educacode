import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getStoredSupabaseConfig, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config';

export let supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export function saveSupabaseConfig(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('CUSTOM_SUPABASE_URL', url.trim());
    localStorage.setItem('CUSTOM_SUPABASE_KEY', key.trim());
  }
  supabase = createClient(url.trim(), key.trim(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export function resetSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('CUSTOM_SUPABASE_URL');
    localStorage.removeItem('CUSTOM_SUPABASE_KEY');
  }
  const config = getStoredSupabaseConfig();
  supabase = createClient(config.url, config.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export async function testSupabaseConnection(
  testUrl?: string,
  testKey?: string
): Promise<{ ok: boolean; latencyMs: number; error?: string; message: string }> {
  const config = getStoredSupabaseConfig();
  const url = testUrl ? testUrl.trim() : config.url;
  const key = testKey ? testKey.trim() : config.key;

  if (!url || !key) {
    return { ok: false, latencyMs: 0, error: 'URL ou Chave não fornecida', message: 'Preencha a URL e a Chave.' };
  }

  const start = performance.now();
  try {
    const testClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    const { error } = await testClient.from('usuarios').select('id').limit(1);
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          ok: true,
          latencyMs,
          message: 'Conectado ao Supabase com sucesso! (Tabelas ainda não criadas; execute o script SQL)',
        };
      }
      return {
        ok: false,
        latencyMs,
        error: error.message,
        message: `Erro do Supabase: ${error.message} (${error.code || 'sem código'})`,
      };
    }

    return {
      ok: true,
      latencyMs,
      message: `Conexão ativa e funcionando! Resposta em ${latencyMs}ms`,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const errorMsg = err instanceof Error ? err.message : 'Falha de rede';
    return {
      ok: false,
      latencyMs,
      error: errorMsg,
      message: 'Falha de conexão com Supabase. Verifique a URL e a Chave.',
    };
  }
}

