import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export default function Dashboard() {
  const { aluno, token } = useAuth();
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDashboard(token).then(d => setData(d));
  }, [token]);

  if (!data) return <div className="min-h-screen flex items-center justify-center text-white/50">Carregando...</div>;

  const comps = [
    ['Empatia', data.competencias.empatia || 0],
    ['Validação', data.competencias.validacao || 0],
    ['Escuta', data.competencias.escuta || 0],
    ['Clareza', data.competencias.clareza || 0],
    ['Ética', data.competencias.etica || 0],
    ['Intervenção', data.competencias.intervencao || 0]
  ];

  return (
    <div className="min-h-screen bg-ink-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">PSI Eficaz</h1>
            <p className="text-white/50 text-sm">Olá, {aluno?.codigo}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/treino')} className="bg-brand-600 hover:bg-brand-500 px-4 py-2 rounded-xl text-sm font-medium">Treinar</button>
            <button onClick={() => navigate('/certificado')} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium">Certificados</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            ['Nível Atual', `Nível ${data.aluno.nivel_atual}`, 'text-brand-400'],
            ['Nota Média', `${Math.round(data.aluno.nota_media)}/100`, 'text-green-400'],
            ['Tentativas', data.aluno.tentativas_total, 'text-white'],
            ['Certificado', data.aluno.nivel_atual >= 4 ? 'Disponível' : 'Em progresso', data.aluno.nivel_atual >= 4 ? 'text-green-400' : 'text-white/50']
          ].map(([label, value, cls]) => (
            <div key={label} className="card-gradient p-5 text-center">
              <p className="text-white/50 text-sm">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${cls}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="card-gradient p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Competências Clínicas</h2>
          <div className="space-y-3">
            {comps.map(([nome, nota]) => (
              <div key={nome} className="flex items-center gap-3">
                <span className="text-sm w-32 text-white/70">{nome}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${(nota||0) >= 80 ? 'bg-green-500' : (nota||0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${nota}%` }} />
                </div>
                <span className={`text-sm font-medium w-12 text-right ${(nota||0) >= 80 ? 'text-green-400' : (nota||0) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{nota}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-gradient p-6">
          <h2 className="text-lg font-semibold mb-4">Últimas Tentativas</h2>
          {data.ultimas?.length === 0 ? (
            <p className="text-white/50">Nenhuma tentativa ainda. <button onClick={() => navigate('/treino')} className="text-brand-400 underline">Comece agora.</button></p>
          ) : (
            <div className="space-y-3">
              {data.ultimas?.map(t => (
                <div key={t.id} className={`p-4 rounded-xl border ${t.passou ? 'border-green-500/20 bg-green-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{t.titulo}</p>
                    <span className={`text-sm font-bold ${t.passou ? 'text-green-400' : 'text-orange-400'}`}>{t.nota}/100</span>
                  </div>
                  <p className="text-white/40 text-sm mt-1">{t.area} · Nível {t.nivel}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
