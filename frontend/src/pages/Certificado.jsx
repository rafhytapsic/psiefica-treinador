import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export default function Certificado() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getCertificado(token).then(d => setData(d));
  }, [token]);

  if (!data) return <div className="min-h-screen flex items-center justify-center text-white/50">Carregando...</div>;

  return (
    <div className="min-h-screen bg-ink-900 text-white px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Certificação PSI Eficaz</h1>
        {data.pode_emitir ? (
          <div className="card-gradient p-8 text-center">
            <p className="text-green-400 text-lg font-semibold mb-4">Certificado Disponível</p>
            <p className="text-white/70 mb-4">
              Você completou {data.niveis_concluidos.length} nível{data.niveis_concluidos.length > 1 ? 's' : ''}:{' '}
              {data.niveis_concluidos.map(n => n.nome).join(', ')}
            </p>
            <p className="text-white/50 mb-6">Carga horária total: {data.carga_horaria_total} horas</p>
            <button className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-8 rounded-xl">
              Baixar Certificado (PDF)
            </button>
          </div>
        ) : (
          <div className="card-gradient p-8 text-center">
            <p className="text-white/50 mb-4">Complete todos os níveis para emitir seu certificado.</p>
            <p className="text-white/30 text-sm">Níveis concluídos: {data.niveis_concluidos?.length || 0}/4</p>
          </div>
        )}
      </div>
    </div>
  );
}
