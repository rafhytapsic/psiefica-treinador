/* =========================================================
   PSI Eficaz - Backend Proxy (zero-dependency)
   Node 18+ required (uses built-in fetch).

   Responsibilities:
   - Hide the API key (server-side only)
   - Hide the system prompt (server-side only)
   - Validate optional student access codes
   - Per-IP and per-code rate limiting
   - Forward chat completions to OpenAI / OpenRouter
   ========================================================= */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

/* ---------- Tiny .env loader (zero deps) ---------- */
(function loadEnv(){
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
})();

/* ---------- Config (from environment) ---------- */
const PORT          = parseInt(process.env.PORT || '8787', 10);
const PROVIDER      = (process.env.PROVIDER || 'openai').toLowerCase(); // openai | openrouter
const MODEL         = process.env.MODEL || (PROVIDER === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini');
const API_KEY       = process.env.API_KEY || '';
const ACCESS_CODES  = (process.env.ACCESS_CODES || '')
  .split(',').map(s => s.trim()).filter(Boolean);
const ALLOW_ORIGIN  = process.env.ALLOW_ORIGIN || '*';
const RATE_LIMIT    = parseInt(process.env.RATE_LIMIT || '40', 10);    // requests
const RATE_WINDOW_S = parseInt(process.env.RATE_WINDOW_S || '60', 10); // seconds
const MAX_TOKENS    = parseInt(process.env.MAX_TOKENS || '900', 10);
const TEMPERATURE   = parseFloat(process.env.TEMPERATURE || '0.6');
const PUBLIC_DIR    = process.env.PUBLIC_DIR || path.join(__dirname, '..'); // serve the HTML next to /server

if (!API_KEY) {
  console.warn('[psiefica] WARNING: API_KEY is not set. /api/chat will fail until you set it.');
}

/* ---------- System prompt (the brain of the trainer) ---------- */
const SYSTEM_PROMPT = `Você é o Treinador Clínico PSI Eficaz, um especialista em psicoterapia baseada em prática deliberada.

Seu objetivo é desenvolver habilidades terapêuticas de psicoterapeutas por meio de treino ativo, simulação de sessão e correção técnica rigorosa.

PRINCÍPIOS:
- Foco em performance clínica, não apenas teoria.
- Respostas diretas, específicas e aplicáveis.
- Correção precisa, sem suavizar erros.
- Estímulo ao raciocínio clínico.
- O aluno SÓ avança quando demonstrar domínio. Não passe a mão na cabeça.

COMPORTAMENTO:
- Evite respostas genéricas.
- Evite excesso de teoria.
- Priorize treino prático.
- Seja exigente com a qualidade da resposta.
- Adapte a dificuldade conforme o desempenho do usuário (suba a régua quando ele acertar; reforce os fundamentos quando ele errar).

ESTRUTURA DE NÍVEIS:
NÍVEL 1 — FUNDAMENTOS: validação, escuta ativa, clareza e identificação da emoção central.
NÍVEL 2 — DIRECIONAMENTO: perguntas estratégicas, condução da sessão, evitar passividade.
NÍVEL 3 — TÉCNICA: reestruturação cognitiva, psicoeducação breve, exposição e experimentos comportamentais.
NÍVEL 4 — PROFUNDIDADE: crenças centrais, esquemas, padrões repetitivos e vínculo emocional.
NÍVEL 5 — MAESTRIA: timing, linguagem refinada, manejo de resistência e intervenções de alto impacto.

REGRA DE ABERTURA:
- Se o usuário ainda não escolheu um nível, pergunte EXATAMENTE:
"Qual nível você deseja treinar hoje?
1. Fundamentos
2. Direcionamento terapêutico
3. Intervenções técnicas
4. Processos profundos
5. Maestria clínica"
e aguarde a resposta antes de continuar.

FORMATO DE TREINO (ciclo obrigatório):
1. Apresente um cenário clínico breve, realista e específico (idade, queixa, contexto, fala literal do paciente entre aspas).
2. Pergunte: "O que você diria agora?"
3. Aguarde a resposta do usuário.
4. Avalie usando os critérios abaixo.
5. Dê uma NOTA de 0 a 10 no formato: **Nota: X/10**
6. REGRA DE PROGRESSÃO (obrigatória):
   - Se nota < 6: O aluno NÃO avança. Diga: "Nota baixa. Vamos destrinchar passo a passo antes de você tentar de novo." Depois explique EM ETAPAS o que deveria ter sido feito: primeiro a validação, depois a identificação da emoção, depois a condução. Peça para ele tentar NOVAMENTE no MESMO cenário.
   - Se nota 6–7: O aluno NÃO avança. Diga: "Quase lá. Vamos refinar." Aponte 1 erro principal e 1 ajuste específico. Mostre a resposta melhorada. Peça para ele tentar NOVAMENTE no MESMO cenário.
   - Se nota ≥ 8: O aluno pode avançar. Diga: "Bom trabalho. Vamos subir o nível." Apresente um NOVO cenário ligeiramente mais difícil.
7. NUNCA avance para novo cenário se nota < 8.
8. NUNCA deixe o aluno "só ler" a resposta melhorada e ir embora. A prática acontece na repetição.

MICRO-ENSINO ENTRE TENTATIVAS (quando nota < 8):
- Não apenas liste erros. ENSINE o passo a passo da intervenção correta:
  - "Passo 1: Primeiro você valida a emoção assim: [fala]"
  - "Passo 2: Depois você nomeia o que está por baixo: [fala]"
  - "Passo 3: Só então você conduz: [fala]"
- Explique POR QUE cada passo importa clinicamente (1 linha por passo).
- Peça: "Agora tente novamente aplicando esses 3 passos."

CRITÉRIOS DE AVALIAÇÃO (use todos):
- Clareza da intervenção
- Adequação ao momento da sessão
- Empatia (sem suavização vazia)
- Direcionalidade terapêutica
- Qualidade técnica (alinhamento ao nível escolhido)
- Risco de reforçar esquivas, ruminação ou distorções

REGRAS DE ESTILO DE RESPOSTA:
- Use Markdown limpo. Negrito para a nota e títulos curtos.
- Seções fixas: **Cenário**, **Sua resposta**, **Nota**, **Análise**, **Erros**, **Micro-ensino** (passo a passo), **Tente novamente**.
- Sem disclaimers genéricos. Sem "depende". Sem teoria longa.
- Falas do terapeuta sempre entre aspas e em primeira pessoa.
- Máximo de 350 palavras por turno.

OBJETIVO FINAL:
Transformar o usuário em um terapeuta mais preciso, intencional e eficaz na condução de sessões — através de repetição deliberada com feedback imediato.`;

/* ---------- Tiny in-memory rate limiter ---------- */
const buckets = new Map(); // key -> { count, resetAt }
function checkRate(key) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_S * 1000 });
    return { ok: true, remaining: RATE_LIMIT - 1, retryAfter: 0 };
  }
  if (b.count >= RATE_LIMIT) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now)/1000) };
  }
  b.count++;
  return { ok: true, remaining: RATE_LIMIT - b.count, retryAfter: 0 };
}
// periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
}, 60_000).unref?.();

/* ---------- Helpers ---------- */
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Access-Code');
  res.setHeader('Access-Control-Max-Age', '86400');
}
function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8') || '{}';
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error('invalid json')); }
    });
    req.on('error', reject);
  });
}
function clientIp(req) {
  const xff = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
  return xff || req.socket.remoteAddress || 'unknown';
}
function safeMessages(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-30) // cap context length
    .map(m => ({ role: m.role, content: m.content.slice(0, 6000) }));
}

/* ---------- Static file serving (so the HTML can be hosted by the same process) ---------- */
const MIME = {
  '.html':'text/html; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
  '.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'
};
function serveStatic(req, res, pathname) {
  // default: index points to the trainer HTML
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/psiefica-treinador.html';
  // prevent path traversal
  const safe = path.normalize(rel).replace(/^([/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safe);
  if (!filePath.startsWith(path.resolve(PUBLIC_DIR))) {
    return json(res, 403, { error: 'forbidden' });
  }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type','text/plain; charset=utf-8');
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control','no-cache');
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ---------- Upstream call ---------- */
async function callUpstream(messages) {
  const endpoint = PROVIDER === 'openrouter'
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  const headers = {
    'Content-Type':'application/json',
    'Authorization':'Bearer ' + API_KEY
  };
  if (PROVIDER === 'openrouter') {
    headers['HTTP-Referer'] = process.env.PUBLIC_URL || 'https://psiefica.local';
    headers['X-Title']      = 'PSI Eficaz Treinador Clinico';
  }

  const body = {
    model: MODEL,
    messages: [{ role:'system', content: SYSTEM_PROMPT }, ...messages],
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS
  };

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const tx = await resp.text().catch(() => '');
    const err = new Error('upstream_error');
    err.status = resp.status;
    err.detail = tx.slice(0, 500);
    throw err;
  }
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || '';
}

/* ---------- Server ---------- */
const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

  const u = url.parse(req.url, true);
  const pathname = u.pathname || '/';

  // Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    return json(res, 200, {
      ok: true,
      provider: PROVIDER,
      model: MODEL,
      hasKey: Boolean(API_KEY),
      gatedByCodes: ACCESS_CODES.length > 0,
      time: new Date().toISOString()
    });
  }

  // Chat endpoint
  if (pathname === '/api/chat' && req.method === 'POST') {
    try {
      if (!API_KEY) return json(res, 500, { error: 'server_not_configured' });

      // Access code gating
      const code = (req.headers['x-access-code'] || '').toString().trim();
      if (ACCESS_CODES.length > 0) {
        if (!code || !ACCESS_CODES.includes(code)) {
          return json(res, 401, { error: 'invalid_access_code' });
        }
      }

      // Rate limiting (per code if provided, else per IP)
      const rkey = code ? 'code:' + code : 'ip:' + clientIp(req);
      const r = checkRate(rkey);
      res.setHeader('X-RateLimit-Remaining', String(r.remaining));
      if (!r.ok) {
        res.setHeader('Retry-After', String(r.retryAfter));
        return json(res, 429, { error: 'rate_limited', retry_after: r.retryAfter });
      }

      const body = await readBody(req);
      const messages = safeMessages(body.messages);
      if (messages.length === 0) {
        return json(res, 400, { error: 'no_messages' });
      }

      const reply = await callUpstream(messages);
      return json(res, 200, { reply });
    } catch (err) {
      const status = err.status || 500;
      console.error('[psiefica] chat error:', status, err.detail || err.message);
      // never leak upstream key/details to client
      return json(res, status >= 400 && status < 600 ? status : 500, {
        error: 'upstream_error',
        message: status === 401 ? 'API key inválida no servidor.' :
                 status === 429 ? 'Limite atingido na API. Tente novamente em instantes.' :
                                  'Falha ao consultar o modelo.'
      });
    }
  }

  // Static fallback (serves the trainer HTML)
  if (req.method === 'GET') {
    return serveStatic(req, res, pathname);
  }

  return json(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`[psiefica] proxy listening on http://localhost:${PORT}`);
  console.log(`[psiefica] provider=${PROVIDER} model=${MODEL} gated=${ACCESS_CODES.length>0}`);
  console.log(`[psiefica] open: http://localhost:${PORT}/`);
});
