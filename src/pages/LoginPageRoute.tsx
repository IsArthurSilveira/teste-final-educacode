import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import iconeEducacode from '../assets/icone.png';
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
    <main className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-[#011E62] relative overflow-hidden">
      {/* Fundo Tecnológico com Circuitos Eletrônicos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        {/* Glows ambientais */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />

        {/* SVG de Circuitos Eletrônicos / PCB Traces */}
        <svg
          className="absolute inset-0 w-full h-full text-cyan-400/25 stroke-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <defs>
            <pattern id="circuit-grid" width="160" height="160" patternUnits="userSpaceOnUse">
              {/* Linhas de trilha eletrônica */}
              <path d="M 0 40 L 40 40 L 60 20 L 100 20 L 120 40 L 160 40" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 40 40 L 40 80 L 20 100 L 0 100" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 100 20 L 100 0" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 160 120 L 120 120 L 100 140 L 60 140 L 40 120 L 0 120" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 120 120 L 120 80 L 140 60 L 160 60" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 60 140 L 60 160" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 80 60 L 80 100" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />

              {/* Nós de solda / Vias eletrônicas */}
              <circle cx="40" cy="40" r="3" fill="#38bdf8" />
              <circle cx="100" cy="20" r="2.5" fill="#34d399" />
              <circle cx="120" cy="40" r="2.5" fill="#38bdf8" />
              <circle cx="40" cy="80" r="3" fill="#34d399" />
              <circle cx="120" cy="120" r="3" fill="#38bdf8" />
              <circle cx="60" cy="140" r="2.5" fill="#34d399" />
              <circle cx="120" cy="80" r="2.5" fill="#38bdf8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-grid)" />

          {/* Grandes barramentos e circuitos de destaque */}
          <g strokeWidth="2" strokeLinecap="round" opacity="0.6">
            <path d="M 50 0 L 50 180 L 120 250 L 120 500" stroke="#38bdf8" />
            <circle cx="50" cy="180" r="4.5" fill="#38bdf8" />
            <circle cx="120" cy="250" r="4.5" fill="#34d399" />

            <path d="M 0 320 L 220 320 L 260 360 L 260 700" stroke="#34d399" />
            <circle cx="220" cy="320" r="4" fill="#38bdf8" />
            <circle cx="260" cy="360" r="4.5" fill="#34d399" />

            <path d="M 1200 100 L 980 100 L 930 150 L 930 400" stroke="#38bdf8" />
            <circle cx="980" cy="100" r="4.5" fill="#38bdf8" />
            <circle cx="930" cy="150" r="4" fill="#34d399" />

            <path d="M 1100 500 L 950 500 L 900 450 L 700 450" stroke="#34d399" strokeDasharray="6 4" />
            <circle cx="950" cy="500" r="4" fill="#34d399" />
            <circle cx="900" cy="450" r="4.5" fill="#38bdf8" />
          </g>
        </svg>
      </div>

      <section className="bg-white p-6 sm:p-8 rounded-[1.6rem] sm:rounded-[2rem] shadow-2xl w-[420px] max-w-full text-center border-b-[8px] border-cetecBlueDark relative z-10">
        <div className="mb-7">
          <img
            src={iconeEducacode}
            alt="Ícone Educacode"
            className="w-28 h-28 mx-auto object-contain block drop-shadow-sm"
            style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(54%) saturate(2415%) hue-rotate(204deg) brightness(82%) contrast(106%)' }}
          />
          <h1 className="mt-2 text-3xl font-black tracking-tight text-cetecBlue">EducaCode</h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">Acesso ao ambiente de gerenciamento da Robótica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-black text-cetecBlue uppercase tracking-wider mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Digite seu e-mail"
              className="w-full px-4 sm:px-5 py-3.5 bg-white border-2 border-slate-300 rounded-2xl focus:outline-none focus:border-cetecGreen focus:ring-4 focus:ring-cetecGreen/15 font-bold text-gray-800 text-sm shadow-sm placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-cetecBlue uppercase tracking-wider mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-4 sm:px-5 py-3.5 pr-12 bg-white border-2 border-slate-300 rounded-2xl focus:outline-none focus:border-cetecGreen focus:ring-4 focus:ring-cetecGreen/15 font-bold text-gray-800 text-sm shadow-sm placeholder:text-slate-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 px-3.5 text-slate-500 hover:text-cetecBlue"
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
