import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiPost, setSessionToken } from '../services/api';
import type { ApiBaseResponse } from '../services/api';

interface LoginPayload {
  name: string;
  access: string;
  token?: string;
  tipoUsuario?: string;
  utec?: string;
  verTodasUtecs?: boolean;
}

interface LoginPageRouteProps {
  userName: string;
  onLogin: (payload: LoginPayload) => void;
}

interface LoginResponse extends ApiBaseResponse {
  sucesso?: boolean;
  token?: string;
  nome?: string;
  acesso?: string;
  tipo_usuario?: string;
  utec?: string;
  ver_todas_utecs?: boolean;
}

export function LoginPageRoute({ userName, onLogin }: LoginPageRouteProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const data = await apiPost<LoginResponse>({ acao: 'login', email: email.trim(), senha });
      if (data?.sucesso && data?.token) {
        setSessionToken(data.token);
        onLogin({
          name: data.nome || 'Usuário',
          access: data.acesso || 'editor',
          token: data.token,
          tipoUsuario: data.tipo_usuario,
          utec: data.utec,
          verTodasUtecs: data.ver_todas_utecs,
        });
      } else {
        const errorMsg = data?.erro || '';
        if (
          !errorMsg ||
          errorMsg.toLowerCase().includes('supabase') ||
          errorMsg.toLowerCase().includes('conex') ||
          errorMsg.toLowerCase().includes('network') ||
          errorMsg.toLowerCase().includes('fetch') ||
          errorMsg.toLowerCase().includes('falha')
        ) {
          setErro('falha de conexao com supabase');
        } else {
          setErro(errorMsg);
        }
      }
    } catch {
      setErro('falha de conexao com supabase');
    } finally {
      setLoading(false);
    }
  }

  if (userName) return <Navigate to="/dashboard" replace />;

  return (
    <main className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-cetecBlue">
      <section className="bg-white p-6 sm:p-8 rounded-[1.6rem] sm:rounded-[2rem] shadow-2xl w-[420px] max-w-full text-center border-b-[8px] border-cetecBlueDark">
        <div className="w-12 h-12 mx-auto mb-3 bg-cetecBlue/5 rounded-2xl flex items-center justify-center text-cetecBlue">
          <span className="material-symbols-rounded text-3xl">smart_toy</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-cetecBlue mb-1 tracking-tight">Painel de Clubes</h1>
        <p className="text-gray-500 font-bold text-xs sm:text-sm mb-6">Acesso ao ambiente de gerenciamento CETEC</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Digite seu e-mail"
              className="w-full px-4 sm:px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-gray-700 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-4 sm:px-5 py-3.5 pr-12 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-gray-700 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 px-3.5 text-gray-400 hover:text-cetecBlue"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                <span className="material-symbols-rounded text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold text-xs">
              <p>{erro}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn-3d w-full bg-cetecGreen text-white font-black text-base py-3.5 px-4 rounded-2xl border-b-[6px] border-cetecGreenDark hover:bg-[#7ed152] transition cursor-pointer"
            disabled={loading}
          >
            {loading ? 'A CARREGAR...' : 'ENTRAR'}
          </button>
        </form>
      </section>
    </main>
  );
}
