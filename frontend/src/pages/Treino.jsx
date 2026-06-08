import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export default function Treino() {
  const { token } = useAuth();
  const [nivel, setNivel] = useState(1);
  const [casos, setCasos] = useState([]);
  const [casoAtual, setCasoAtual] = useState(null);
  const [resposta, setResposta] = useState('');
  const [avaliacao, setAvaliacao] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => { carregarCasos(); carregarProgresso(); }, [nivel]);

  const carregarCasos = async () => {
    const data = await api.getCases(nivel, token);
    setCasos(data.cases || []);
    setCasoAtual(null);
    setAvaliacao(null);
    setResposta('');
  };

  const carregarProgresso = async () => {
    const data = await api.getProgress(token);
    setProgresso(data);
  };

  const enviarResposta = async (e) => {
    e.preventDefault();
    if (!resposta.trim() || !casoAtual) return;
    setCarregando(true);
    const data = await api.submitAttempt(casoAtual.id, resposta, token);
    if (data.avaliacao) {
      setAvaliacao(data);
      carregarProgresso();
    }
    setCarregando(false);
  };

  const selecionarCaso = (c) => {
    setCasoAtual(c);
    setAvaliacao(null);
    setResposta('');
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const proximoCaso = () => {
    const idx = casos.findIndex(c => c.id === casoAtual?.id);
    if (idx >= 0 && idx < casos.length - 1) {
      selecionarCaso(casos[idx + 1]);
    } else {
      setCasoAtual(null);
      setAvaliacao(null);
    }
  };

  const niveisTexto = ['', 'Psicoterapeuta Estruturado', 'Psicoterapeuta Avançado', 'Psicoterapeuta de Alta Performance', 'Especialista PSI Eficaz'];

  return (
    <div className="min-h-screen bg-ink-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">PSI Eficaz · Treino</h1>
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setNivel(n)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  nivel === n
                    ? 'bg-brand-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Nível {n}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">{niveisTexto[nivel]}</h2>
          <p className="text-white/50 text-sm">
            Nota mínima: {nivel === 1 ? 80 : nivel === 2 ? 85 : nivel === 3 ? 90 : 95}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de casos */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider">Casos</h3>
            {casos.map(c => (
              <button
                key={c.id}
                onClick={() => selecionarCaso(c)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  casoAtual?.id === c.id
                    ? 'border-brand-500 bg-white/10'
                    : c.tentou
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.titulo}</span>
                  {c.tentou ? (
                    <span className="text-green-400 text-xs">CONCLUÍDO</span>
                  ) : (
                    <span className="text-white/30 text-xs">PENDENTE</span>
                  )}
                </div>
                <p className="text-white/40 text-sm mt-1">{c.area}</p>
              </button>
            ))}
          </div>

          {/* Área de treino */}
          <div className="lg:col-span-2 space-y-6">
            {casoAtual && !avaliacao && (
              <div className="card-gradient p-6">
                <span className="text-xs font-medium text-brand-400 uppercase tracking-wider">Cenário Clínico</span>
                <h3 className="text-lg font-semibold mt-2">{casoAtual.titulo}</h3>
                <p className="text-white/70 mt-2 leading-relaxed">{casoAtual.descricao}</p>

                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-white/50 text-sm mb-2">Fala do paciente:</p>
                  <p className="text-lg font-medium italic text-white/90">{casoAtual.paciente_fala}</p>
                </div>

                <form onSubmit={enviarResposta} className="mt-6">
                  <label className="block text-sm font-medium mb-2 text-white/70">
                    Sua intervenção clínica:
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    placeholder="O que você diria neste momento? Escreva como se estivesse na sessão..."
                    rows={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-500 resize-y"
                    required
                  />
                  <button
                    type="submit"
                    disabled={carregando}
                    className="mt-4 w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {carregando ? 'Avaliando...' : 'Enviar para avaliação'}
                  </button>
                </form>
              </div>
            )}

            {/* Avaliação */}
            {avaliacao && (
              <div className="card-gradient p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">
                    {avaliacao.avaliacao.passou ? '✅ Aprovado!' : '❌ Precisa melhorar'}
                  </h3>
                  <div className={`text-3xl font-bold ${avaliacao.avaliacao.passou ? 'text-green-400' : 'text-orange-400'}`}>
                    {avaliacao.avaliacao.nota_final}/100
                  </div>
                </div>

                {/* Rubrica */}
                <div className="space-y-3 mb-6">
                  {[
                    ['Empatia', avaliacao.avaliacao.empatia],
                    ['Validação Emocional', avaliacao.avaliacao.validacao],
                    ['Escuta Clínica', avaliacao.avaliacao.escuta],
                    ['Clareza', avaliacao.avaliacao.clareza],
                    ['Ética', avaliacao.avaliacao.etica],
                    ['Intervenção', avaliacao.avaliacao.intervencao]
                  ].map(([nome, nota]) => (
                    <div key={nome} className="flex items-center gap-3">
                      <span className="text-sm w-36 text-white/70">{nome}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${nota >= 80 ? 'bg-green-500' : nota >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${nota}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium w-12 text-right ${nota >= 80 ? 'text-green-400' : nota >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {nota}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-1">Pontos Fortes</h4>
                    <p className="text-white/70">{avaliacao.avaliacao.pontos_fortes}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-orange-400 mb-1">Pontos a Melhorar</h4>
                    <p className="text-white/70">{avaliacao.avaliacao.pontos_melhorar}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-brand-400 mb-1">Resposta do Terapeuta Experiente</h4>
                    <p className="text-white/70 italic bg-white/5 p-3 rounded-xl border border-white/10">
                      {avaliacao.avaliacao.alternativa_experiente}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">Micro-ensino</h4>
                    <p className="text-white/70 whitespace-pre-line">{avaliacao.avaliacao.micro_ensino}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">Feedback</h4>
                    <p className="text-white/70">{avaliacao.avaliacao.feedback}</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  {avaliacao.avaliacao.passou ? (
                    <button
                      onClick={proximoCaso}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      Próximo Caso
                    </button>
                  ) : (
                    <button
                      onClick={() => { setAvaliacao(null); setResposta(''); }}
                      className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  )}
                </div>
              </div>
            )}

            {!casoAtual && !avaliacao && (
              <div className="card-gradient p-8 text-center">
                <p className="text-white/50">Selecione um caso à esquerda para treinar.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
