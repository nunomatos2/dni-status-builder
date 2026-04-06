import { useState } from 'react';

const ACCESS_PASSWORD = 'DNI-Presi';
const SESSION_KEY = 'dni-authenticated';

interface LoginGateProps {
  children: React.ReactNode;
}

export default function LoginGate({ children }: LoginGateProps) {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ACCESS_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthenticated(true);
    } else {
      setError(true);
    }
  };

  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-primary-container font-black text-2xl tracking-tighter leading-none mb-1">
            DNI Status Builder
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-widest text-secondary">
            Direção Digital, Novos Canais e Inovação
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-lowest p-8" style={{ borderLeft: '4px solid #b5000b' }}>
          <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-3">
            Password de Acesso
          </label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            placeholder="Introduza a password"
            autoFocus
            className="w-full bg-transparent border-b-2 border-outline-variant/30 focus:border-primary px-1 py-2 text-sm outline-none transition-colors placeholder:text-zinc-300 mb-5"
          />
          {error && (
            <p className="text-error text-sm mb-4">Password incorreta.</p>
          )}
          <button
            type="submit"
            disabled={!password}
            className="w-full bg-linear-to-r from-primary-container to-primary text-on-primary py-3 text-[12px] font-bold uppercase tracking-widest rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
