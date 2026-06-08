import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export default function Login() {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const data = await api.login(codigo.trim().toUpperCase());
      if (data.error) {
        setErro(data.error);
      } else {
        login(data);
        navigate('/dashboard');
      }
    } catch (err) {
      setErro('Erro ao conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">PSI Eficaz</h1>
          <p className="text-white/60">Treinador Clínico IA</p>
        </div>

        <div className="card-gradient p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Acesse sua conta</h2>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-white/70 mb-2">Código de Acesso</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="PSF-2025-ALUNO1"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-500"
              required
            />

            {erro && <p className="text-red-400 text-sm mt-3">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="w-full mt-6 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {carregando ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          Código fornecido pela equipe PSI Eficaz
        </p>
      </div>
    </div>
  );
}
