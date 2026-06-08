/* =========================================================
   PSI Eficaz — Backend MVP
   Express + SQLite (better-sqlite3)
   ========================================================= */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- Config ---------- */
const PORT = parseInt(process.env.PORT || '8787', 10);
const API_KEY = process.env.API_KEY || '';
const MODEL = process.env.MODEL || 'openai/gpt-4o-mini';
const PROVIDER = process.env.PROVIDER || 'openrouter';
const JWT_SECRET = process.env.JWT_SECRET || 'psi-eficaz-secret-2025';

/* ---------- SQLite ---------- */
const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const db = new Database(path.join(DB_DIR, 'psi-eficaz.db'));
db.pragma('journal_mode = WAL');

/* ---------- Schema ---------- */
db.exec(`
CREATE TABLE IF NOT EXISTS alunos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT,
  nivel_atual INTEGER DEFAULT 1,
  nota_media REAL DEFAULT 0,
  tentativas_total INTEGER DEFAULT 0,
  sessoes_concluidas INTEGER DEFAULT 0,
  carga_horaria_min INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS casos_clinicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nivel INTEGER NOT NULL,
  area TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  paciente_fala TEXT NOT NULL,
  dica_pequena TEXT,
  ordem INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tentativas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aluno_id INTEGER NOT NULL,
  caso_id INTEGER NOT NULL,
  resposta_aluno TEXT NOT NULL,
  nota INTEGER DEFAULT 0,
  empatia INTEGER DEFAULT 0,
  validacao INTEGER DEFAULT 0,
  escuta INTEGER DEFAULT 0,
  clareza INTEGER DEFAULT 0,
  etica INTEGER DEFAULT 0,
  intervencao INTEGER DEFAULT 0,
  feedback TEXT,
  passou INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES alunos(id),
  FOREIGN KEY (caso_id) REFERENCES casos_clinicos(id)
);

CREATE TABLE IF NOT EXISTS niveis (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  nota_minima INTEGER NOT NULL,
  carga_horaria INTEGER DEFAULT 20
);

INSERT OR IGNORE INTO niveis (id, nome, nota_minima, carga_horaria) VALUES
(1, 'Psicoterapeuta Estruturado', 80, 20),
(2, 'Psicoterapeuta Avançado', 85, 25),
(3, 'Psicoterapeuta de Alta Performance', 90, 30),
(4, 'Especialista PSI Eficaz', 95, 35);

CREATE INDEX IF NOT EXISTS idx_tentativas_aluno ON tentativas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_tentativas_caso ON tentativas(caso_id);
CREATE INDEX IF NOT EXISTS idx_casos_nivel ON casos_clinicos(nivel);
`);

/* ---------- Seed Casos ---------- */
const countCases = db.prepare('SELECT COUNT(*) as c FROM casos_clinicos').get().c;
if (countCases === 0) {
  const insert = db.prepare(`
    INSERT INTO casos_clinicos (nivel, area, titulo, descricao, paciente_fala, dica_pequena, ordem)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const casos = [
    [1, 'Ansiedade', 'Primeiro contato',
     'João, 28 anos, procura terapia pela 1ª vez. Fala rápida, olhar desviado.',
     '"Doutora, eu não sei se isso vai dar certo. Mas eu preciso de ajuda. Não aguento mais ficar assim."',
     'A primeira intervenção é a validação, não resolução do problema.', 1],
    [1, 'Depressão', 'Acolhimento inicial',
     'Maria, 34 anos, referenciada pelo médico. Sentada, cabeça baixa, voz rouca.',
     '"Às vezes eu nem sei por que estou aqui. Nada funciona pra mim."',
     'Nomear a emoção e validar a dificuldade de vir.', 2],
    [1, 'Luto', 'Escuta na perda',
     'Carlos, 50 anos, perdeu a mãe há 6 meses. Olha para o chão, mãos nervosas.',
     '"Eu deveria estar melhor já, né? Faz tempo e eu ainda choro."',
     'Não corrija o tempo. Valide a relação e a culpa.', 3],
    [1, 'Autoestima', 'Construção de vínculo',
     'Ana, 22 anos, permissiva, sorri muito, fala sobre a mãe.',
     '"Minha mãe sempre disse que eu podia mais. Mas eu não consegui."',
     'Diferencie expectativa externa da autoavaliação.', 4],
    [1, 'Ansiedade', 'Clarificação de demanda',
     'Pedro, 40 anos, hipertenso, veio por pressão da esposa.',
     '"Ela que decidiu que eu preciso vir. Eu não vejo assim."',
     'Valide a posição dele e explore a própria percepção.', 5],
    [2, 'Depressão', 'Formulação de caso',
     'Lucia, 30 anos, terceira sessão. Melhora leve, mas relata culpa.',
     '"Eu falei para minha amiga ontem e ela disse que eu não deveria sentir isso."',
     'Explore a invalidação e a validação externa como mecanismo.', 1],
    [2, 'Ansiedade', 'Hipóteses clínicas',
     'Rafael, 27 anos, evita metrô. Evitação crescendo.',
     '"Eu sei que é irracional, mas meu coração acelera só de imaginar."',
     'Não conteste a irracionalidade. Mapeie a cadeia de evitação.', 2],
    [2, 'Luto', 'Manejo emocional',
     'Sandra, 45 anos, perdeu filho. Choros incontroláveis, trabalho afetado.',
     '"As pessoas me dizem para seguir em frente. Eu não consigo."',
     'Diferencie luto normal de luto complicado. Valide a rebeldia.', 3],
    [2, 'Autoestima', 'Conceitualização',
     'Bruno, 35 anos, terapeuta anterior abandonou. Desconfiança palpável.',
     '"A última terapeuta sumiu sem explicar. Como eu sei que você vai ficar?"',
     'Valide a experiência, não prometa. Construa aliança de forma diferente.', 4],
    [3, 'Borderline', 'Ruptura de aliança',
     'Juliana, 25 anos, diagnosticada BPD. SMS às 3h. Telefonema na sessão.',
     '"Você não se importa comigo. Se se importasse, atenderia."',
     'Mantenha o limite sem invalidar. Nomeie o teste de vínculo.', 1],
    [3, 'Casal', 'Intervenção complexa',
     'Casal há 10 anos. Ela reclama que ele não ouve. Ele se cala.',
     '"Eu falo e ele fica olhando para o celular. É como se eu não existisse."',
     'Pare o ciclo. Intervenção direta na dinâmica, não no conteúdo.', 2],
    [3, 'Adolescente', 'Timing e linguagem',
     'Mateus, 16 anos, mãe obrigou. Olhos no teto, respostas monossilábicas.',
     '"Não tem nada de errado comigo. É minha mãe que é doida."',
     'Valide a posição, explore o contrato, não force a cooperação.', 3],
    [4, 'Múltiplas queixas', 'Raciocínio clínico',
     'Fernanda, 52 anos, dor crônica, depressão, conflito com filha. Sessão 12.',
     '"Ninguém entende. Os médicos dizem que é "tudo na cabeça". Minha filha nem fala mais comigo."',
     'Identifique o tema central (invalidação crônica). Conecte as peças.', 1],
    [4, 'Comorbidades', 'Planejamento terapêutico',
     'Roberto, 38 anos, TAG + depressão + suspeita de TOC. Medicação instável.',
     '"Eu já tomei tanta coisa... às vezes eu acho que vou ficar assim para sempre."',
     'Ordene prioridades. Não trate tudo ao mesmo tempo. Escolha um ponto de entrada.', 2]
  ];
  for (const c of casos) insert.run(...c);
  console.log('[seed] Casos inseridos:', casos.length);
}

/* ---------- System Prompt com Rubrica ---------- */
const SYSTEM_PROMPT = `Você é o Treinador Clínico PSI Eficaz, um especialista em psicoterapia baseada em prática deliberada.

Sua função: avaliar rigorosamente a resposta do aluno-terapeuta a um cenário clínico, usando a RÚBRICA ABAIXO.

RÚBRICA OBRIGATÓRIA — avalie cada critério de 0 a 100:
1. EMPATIA — Demonstra compreensão genuína da experiência subjetiva do paciente?
2. VALIDAÇÃO EMOCIONAL — Nomeia e normaliza a emoção sem suavização vazia?
3. ESCUTA CLÍNICA — Respira com o paciente, não corrige nem julga?
4. CLAREZA — A intervenção é compreensível, objetiva e direta?
5. ÉTICA — Respeita a autonomia, não invade, não promete o impossível?
6. INTERVENÇÃO — A resposta é clinicamente intencional e direcionada?

FORMATO OBRIGATÓRIO DA RESPOSTA (JSON):
{
  "empatia": <0-100>,
  "validacao": <0-100>,
  "escuta": <0-100>,
  "clareza": <0-100>,
  "etica": <0-100>,
  "intervencao": <0-100>,
  "nota_final": <soma>,
  "passou": <true|false>,
  "nota_minima": <80|85|90|95>,
  "pontos_fortes": "texto breve (1-2 frases)",
  "pontos_melhorar": "texto breve (1-2 frases)",
  "alternativa_experiente": "texto da resposta modelo completa, entre aspas, em 1ª pessoa",
  "micro_ensino": "Passo 1: ... Passo 2: ... Passo 3: ...",
  "feedback": "resposta amigável ao aluno, em português brasileiro, com tom de treinador exigente mas encorajador"
}

REGRAS DE NOTA FINAL:
- Soma os 6 critérios → nota_final de 0 a 600
- Converte para escala 0-100: nota_final / 6
- A conversão é opcional; se quiser, use divisão em vez de soma. Indique qual usou.
- passou = true somente se nota_final >= nota_minima do nível

NÍVEIS E NOTAS MÍNIMAS:
- Nível 1: 80
- Nível 2: 85
- Nível 3: 90
- Nível 4: 95

INSTRUÇÃO FINAL:
Retorne APENAS o JSON válido. Sem markdown, sem explicação extra. O JSON deve ser parseável por JSON.parse().`;

/* ---------- Auth Middleware ---------- */
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  try {
    req.aluno = jwt.verify(token, JWT_SECRET);
    next();
  } catch { return res.status(401).json({ error: 'Token inválido' }); }
}

/* ---------- Routes ---------- */

/* 1. Login */
app.post('/api/login', (req, res) => {
  const { codigo } = req.body;
  if (!codigo) return res.status(400).json({ error: 'Código obrigatório' });

  let aluno = db.prepare('SELECT * FROM alunos WHERE codigo = ?').get(codigo);

  if (!aluno) {
    const result = db.prepare('INSERT INTO alunos (codigo, nome) VALUES (?, ?)').run(codigo, codigo);
    aluno = db.prepare('SELECT * FROM alunos WHERE id = ?').get(result.lastInsertRowid);
  }

  const token = jwt.sign({ id: aluno.id, codigo: aluno.codigo, nivel: aluno.nivel_atual }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, aluno: { id: aluno.id, codigo: aluno.codigo, nivel: aluno.nivel_atual, nome: aluno.nome } });
});

/* 2. Casos por nível */
app.get('/api/cases/:nivel', auth, (req, res) => {
  const nivel = parseInt(req.params.nivel, 10);
  const alunoId = req.aluno.id;

  const cases = db.prepare(`
    SELECT c.*, COALESCE(MAX(t.passou), 0) as tentou
    FROM casos_clinicos c
    LEFT JOIN tentativas t ON t.caso_id = c.id AND t.aluno_id = ?
    WHERE c.nivel = ?
    GROUP BY c.id
    ORDER BY c.ordem
  `).all(alunoId, nivel);

  res.json({ nivel, cases });
});

/* 3. Tentativa + Avaliação IA */
app.post('/api/attempt', auth, async (req, res) => {
  const alunoId = req.aluno.id;
  const { caso_id, resposta_aluno } = req.body;
  if (!caso_id || !resposta_aluno) return res.status(400).json({ error: 'Caso e resposta obrigatórios' });

  const caso = db.prepare('SELECT * FROM casos_clinicos WHERE id = ?').get(caso_id);
  if (!caso) return res.status(404).json({ error: 'Caso não encontrado' });

  const nivelRow = db.prepare('SELECT nota_minima FROM niveis WHERE id = ?').get(caso.nivel);
  const notaMinima = nivelRow.nota_minima;

  // Chama IA para avaliação com rubrica
  if (!API_KEY) return res.status(503).json({ error: 'API não configurada pelo administrador' });

  const promptCenário = `NÍVEL: ${caso.nivel}\nCENÁRIO: ${caso.descricao}\nPACIENTE: ${caso.paciente_fala}\n\nRESPOSTA DO ALUNO:\n${resposta_aluno}\n\nAvalie usando a rúbrica. Nota mínima para passar no Nível ${caso.nivel}: ${notaMinima}.`;

  try {
    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: promptCenário }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error('IA não respondeu');

    const avaliacao = JSON.parse(content);
    const notaFinal = Math.round(avaliacao.nota_final || ((avaliacao.empatia + avaliacao.validacao + avaliacao.escuta + avaliacao.clareza + avaliacao.etica + avaliacao.intervencao) / 6));
    const passou = notaFinal >= notaMinima ? 1 : 0;

    // Salva tentativa
    const result = db.prepare(`
      INSERT INTO tentativas (aluno_id, caso_id, resposta_aluno, nota, empatia, validacao, escuta, clareza, etica, intervencao, feedback, passou)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      alunoId, caso_id, resposta_aluno,
      notaFinal,
      avaliacao.empatia || 0,
      avaliacao.validacao || 0,
      avaliacao.escuta || 0,
      avaliacao.clareza || 0,
      avaliacao.etica || 0,
      avaliacao.intervencao || 0,
      avaliacao.feedback || '',
      passou
    );

    // Atualiza estatísticas do aluno
    const stats = db.prepare(`
      SELECT COUNT(*) as total, AVG(nota) as media, SUM(passou) as passaram
      FROM tentativas WHERE aluno_id = ?
    `).get(alunoId);

    db.prepare(`
      UPDATE alunos SET nota_media = ?, tentativas_total = ? WHERE id = ?
    `).run(Math.round(stats.media || 0), stats.total, alunoId);

    // Verifica se todos os casos do nível foram passados
    const totalCasos = db.prepare('SELECT COUNT(*) as c FROM casos_clinicos WHERE nivel = ?').get(caso.nivel).c;
    const casosPassados = db.prepare(`
      SELECT COUNT(DISTINCT caso_id) as c FROM tentativas
      WHERE aluno_id = ? AND passou = 1 AND caso_id IN (
        SELECT id FROM casos_clinicos WHERE nivel = ?
      )
    `).get(alunoId, caso.nivel).c;

    let liberouProximoNivel = false;
    if (passou && casosPassados >= totalCasos && req.aluno.nivel === caso.nivel && caso.nivel < 4) {
      const novaNota = db.prepare(`
        SELECT AVG(nota) as m FROM tentativas
        WHERE aluno_id = ? AND passou = 1 AND caso_id IN (
          SELECT id FROM casos_clinicos WHERE nivel = ?
        )
      `).get(alunoId, caso.nivel).m;

      if (novaNota >= notaMinima) {
        db.prepare('UPDATE alunos SET nivel_atual = ? WHERE id = ?').run(caso.nivel + 1, alunoId);
        liberouProximoNivel = true;
      }
    }

    res.json({
      avaliacao: {
        ...avaliacao,
        nota_final: notaFinal,
        passou: passou === 1,
        nota_minima: notaMinima
      },
      progresso: {
        casos_passados: casosPassados,
        total_casos: totalCasos,
        liberou_proximo_nivel: liberouProximoNivel,
        nivel_atual: liberouProximoNivel ? caso.nivel + 1 : req.aluno.nivel
      }
    });

  } catch (err) {
    console.error('[attempt] Erro IA:', err.message);
    res.status(502).json({ error: 'Erro na avaliação da IA', detail: err.message });
  }
});

/* 4. Progresso do aluno */
app.get('/api/progress', auth, (req, res) => {
  const alunoId = req.aluno.id;

  const aluno = db.prepare('SELECT * FROM alunos WHERE id = ?').get(alunoId);
  const niveis = db.prepare('SELECT * FROM niveis ORDER BY id').all();

  const progresso = niveis.map(n => {
    const totalCasos = db.prepare('SELECT COUNT(*) as c FROM casos_clinicos WHERE nivel = ?').get(n.id).c;
    const passados = db.prepare(`
      SELECT COUNT(DISTINCT caso_id) as c FROM tentativas
      WHERE aluno_id = ? AND passou = 1 AND caso_id IN (
        SELECT id FROM casos_clinicos WHERE nivel = ?
      )
    `).get(alunoId, n.id).c;

    const media = db.prepare(`
      SELECT AVG(nota) as m FROM tentativas
      WHERE aluno_id = ? AND caso_id IN (
        SELECT id FROM casos_clinicos WHERE nivel = ?
      )
    `).get(alunoId, n.id).m || 0;

    return {
      ...n,
      total_casos: totalCasos,
      passados,
      concluido: passados >= totalCasos && media >= n.nota_minima,
      media: Math.round(media)
    };
  });

  const competencias = db.prepare(`
    SELECT ROUND(AVG(empatia)) as empatia,
           ROUND(AVG(validacao)) as validacao,
           ROUND(AVG(escuta)) as escuta,
           ROUND(AVG(clareza)) as clareza,
           ROUND(AVG(etica)) as etica,
           ROUND(AVG(intervencao)) as intervencao
    FROM tentativas WHERE aluno_id = ?
  `).get(alunoId);

  res.json({ aluno, progresso, competencias: competencias || {} });
});

/* 5. Dashboard */
app.get('/api/dashboard', auth, (req, res) => {
  const alunoId = req.aluno.id;

  const aluno = db.prepare('SELECT * FROM alunos WHERE id = ?').get(alunoId);
  const competencias = db.prepare(`
    SELECT ROUND(AVG(empatia)) as empatia,
           ROUND(AVG(validacao)) as validacao,
           ROUND(AVG(escuta)) as escuta,
           ROUND(AVG(clareza)) as clareza,
           ROUND(AVG(etica)) as etica,
           ROUND(AVG(intervencao)) as intervencao
    FROM tentativas WHERE aluno_id = ?
  `).get(alunoId) || {};

  const ultimas = db.prepare(`
    SELECT t.*, c.titulo, c.area, c.nivel
    FROM tentativas t
    JOIN casos_clinicos c ON c.id = t.caso_id
    WHERE t.aluno_id = ?
    ORDER BY t.created_at DESC
    LIMIT 5
  `).all(alunoId);

  res.json({ aluno, competencias, ultimas });
});

/* 6. Certificado */
app.get('/api/certificado', auth, (req, res) => {
  const alunoId = req.aluno.id;
  const aluno = db.prepare('SELECT * FROM alunos WHERE id = ?').get(alunoId);

  const niveisConcluidos = db.prepare(`
    SELECT n.id, n.nome, n.nota_minima, COUNT(DISTINCT c.id) as total,
           COUNT(DISTINCT t.caso_id) as passados,
           ROUND(AVG(t.nota)) as media
    FROM niveis n
    JOIN casos_clinicos c ON c.nivel = n.id
    LEFT JOIN tentativas t ON t.caso_id = c.id AND t.aluno_id = ? AND t.passou = 1
    GROUP BY n.id
    HAVING passados >= total AND media >= n.nota_minima
  `).all(alunoId);

  res.json({
    aluno,
    niveis_concluidos: niveisConcluidos,
    pode_emitir: niveisConcluidos.length > 0,
    carga_horaria_total: niveisConcluidos.reduce((s, n) => s + n.carga_horaria, 0)
  });
});

/* 7. Health */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, provider: PROVIDER, model: MODEL, hasKey: !!API_KEY, gated: true });
});

/* 7. SPA fallback */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`[psi-eficaz] API rodando em http://localhost:${PORT}`);
});
