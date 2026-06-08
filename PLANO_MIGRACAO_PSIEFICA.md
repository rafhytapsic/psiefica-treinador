# Plano de Migração — Treinador Clínico PSI Eficaz
## Publicação Permanente 24/7

---

## 1. ARQUITETURA RECOMENDADA

### 🏆 Opção Elegida: **Railway** (Deploy via GitHub)

| Plataforma | Frontend | Backend | Banco | SSL Gratuito | Domínio Customizado | Preço (24/7) | Facilidade |
|---|---|---|---|---|---|---|---|
| **Railway** | ✅ Static | ✅ Node.js | N/A | ✅ Auto | ✅ | **$5/mês** | ⭐⭐⭐ |
| Render | ✅ Static | ✅ Node.js | ❌ Free limita | ✅ | ✅ | $7/mês | ⭐⭐ |
| Vercel | ✅ Ótimo | ⚠️ Edge Funções | N/A | ✅ | ✅ | $20/mês* | ⭐⭐⭐ |
| Netlify | ✅ Ótimo | ⚠️ Edge Funções | N/A | ✅ | ✅ | $19/mês* | ⭐⭐ |
| Heroku | ✅ | ✅ PostgreSQL | Sim | ✅ Dyno sleeping | ✅ | $7/mês* | ⭐⭐ |

> *Para backend sempre ligado (não "cold start")

**Por que Railway:**
- Node.js nativo (nenhuma alteração no código)
- Deploy automático via push no GitHub
- Variáveis de ambiente no painel
- Free tier de 500h/mês para testar
- Starter $5/mês = 720h/mês (24/7 sem cold start)
- SSL automático + domínio customizado em 2 cliques
- Logs em tempo real no dashboard
- Escalável para múltiplos containers

**Arquitetura final:**

```
┌─────────────────────────────────────────┐
│  ALUNO                                  │
│  navegador/celular → HTTPS              │
│                                         │
│  Domínio: treinador.psieficaz.com       │
│  SSL: Auto (Railway)                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  RAILWAY APP                            │
│  Container: Ubuntu + Node.js 18+          │
│  Porta: $PORT (8000-65535)               │
│                                         │
│  ┌────────────────────────┐             │
│  │ Express/HTTP Server    │             │
│  │  - server.js            │             │
│  │  - static HTML (public)│             │
│  └──────────┬─────────────┘             │
│             │                           │
│  ┌──────────▼─────────────┐             │
│  │ Env Secrets              │             │
│  │  - API_KEY (OpenRouter)  │             │
│  │  - ACCESS_CODES (CSV)    │             │
│  │  - MODEL                 │             │
│  └─────────────────────────┘             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  OPENROUTER API (externo)               │
│  Custo: R$ 0.01-0.03 por conversação    │
└─────────────────────────────────────────┘
```

---

## 2. ESTRUTURA IDEAL

### Semestado (stateless) — Zero Banco de Dados

O atual `server.js` é **stateless**: conversas ficam apenas no navegador, não no servidor. Isso é **ótimo** para hospedagem barata.

**NÃO precisa de:**
- PostgreSQL / MongoDB / Redis
- Sessões de servidor
- Cache persistente
- Armazenamento de histórico

**Estrutura de arquivos no Railway:**

```
/
├── server.js          ← backend proxy (IA segura)
├── PSI Eficaz-treinador.html  ← frontend (single page)
├── package.json       ← declara "main": "server.js"
├── .env.example       ← template de variáveis
└── railway.json       ← configuração do deploy (opcional)
```

### Alterações mínimas no código

Apenas **3 linhas** precisam de ajuste:

1. **PORT dinâmica** (Railway define `$PORT`):
   ```js
   const PORT = parseInt(process.env.PORT || '8787', 10);
   ```
   → Já está feito no servidor atual! ✅

2. **Static files** (Railway serve o HTML):
   ```js
   // Adicionar no server.js antes do listen:
   const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, '.');
   const srv = http.createServer((req, res) => { ... });
   ```
   → Já está feito! ✅

3. **CORS origin** (para domínio customizado):
   ```js
   const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';
   ```
   → Já está feito! ✅

**Conclusão:** O código atual precisa de **ZERO alterações** para rodar no Railway.

---

## 3. PROCESSO DE MIGRAÇÃO

### Passo 1 — Preparar repositório GitHub

| Ação | Tempo |
|---|---|
| Criar repositório `PSI Eficaz-treinador` no GitHub | 3 min |
| Fazer upload dos arquivos (server.js, HTML, package.json) | 2 min |
| Confirmar estrutura na raiz do repo | 2 min |

**Estrutura do repo:**

```
PSI Eficaz-treinador/
├── server.js
├── PSI Eficaz-treinador.html
└── package.json
```

`package.json`:
```json
{
  "name": "PSI Eficaz-treinador",
  "version": "1.0.0",
  "description": "Treinador Clínico PSI Eficaz - Prática Deliberada Psicoterapia",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Passo 2 — Criar conta Railway

| Ação | Tempo |
|---|---|
| Acessar railway.app → Sign up with GitHub | 2 min |
| Confirmar e-mail | 1 min |
| Verificar free tier disponível (500h/mês) | instante |

### Passo 3 — Deploy Automático (GitHub → Railway)

| Ação | Tempo |
|---|---|
| Dashboard → New Project → Deploy from GitHub repo | 1 min |
| Selecionar `PSI Eficaz-treinador` | instante |
| Railway detecta Node.js e auto-configura | instante |
| Build automático (1ª vez) | 1-2 min |
| Railway gera URL temporária `*.up.railway.app` | instante |
| **Total até "Hello World" online** | **3-5 min** |

### Passo 4 — Variáveis de Ambiente (Segredos)

No painel Railway → Variables → New Variable:

| Variável | Valor | Obrigatório |
|---|---|---|
| `API_KEY` | `sk-or-v1-…` (sua chave OpenRouter) | ✅ SIM |
| `ACCESS_CODES` | `PSF-2025-ALUNO1` | ✅ SIM |
| `PORT` | `8000` (Railway sobrescreve sozinho) | ❌ Auto |
| `PROVIDER` | `openrouter` | ✅ Recomendado |
| `MODEL` | `openai/gpt-4o-mini` | ✅ Recomendado |
| `ALLOW_ORIGIN` | `https://treinador.psieficaz.com` | ✅ Recomendado |

> ⚠️ A `API_KEY` **NUNCA** entra no código-fonte. Railway criptografa no backend.

### Passo 5 — Domínio Customizado

| Etapa | Ação | Quem faz |
|---|---|---|
| 1 | No Railway dashboard → Settings → Domains → Generate domain | Railway |
| 2 | Copiar CNAME target (ex: `abc123.up.railway.app`) | Railway gera |
| 3 | Acessar painel DNS do domínio `psieficaz.com` | Você |
| 4 | Criar registro **CNAME**:
    - Nome: `treinador`
    - Valor: `abc123.up.railway.app`
    - TTL: 300 | Você |
| 5 | Railway detecta CNAME e emite certificado SSL (Let's Encrypt) | Auto (5-10 min) |
| 6 | URL final: `https://treinador.psieficaz.com` | ✅ Pronto |

> Se usar Cloudflare como DNS: desativar proxy (nuvem cinza), usar apenas DNS.

**Tempo total para domínio customizado**: 10-15 minutos

---

## 4. DOMÍNIO

### Opção Recomendada: `treinador.psieficaz.com`

| Subdomínio | Função |
|---|---|
| `treinador.psieficaz.com` | Treinador Clínico IA (alunos) |
| `app.psieficaz.com` | Painel institucional (futuro) |
| `api.psieficaz.com` | API pública (futuro) |

**Vantagens de `treinador.`:**
- Explicita a função do serviço
- SEO: "treinador psiefica" indexa melhor
- Para alunos: intuitivo e fácil de lembrar
- Permite separar de landing page institucional

---

## 5. ESCALABILIDADE

### Capacidade do Railway Starter ($5/mês)

| Métrica | Capacidade |
|---|---|
| CPU | 1 vCPU |
| RAM | 2 GB |
| Uptime garantido | 720h/mês (24/7) |
| Requisições simultâneas | ~50-100 conexões |
| Alunos simultâneos (estimativa) | **30-60 alunos** treinando ao mesmo tempo |
| Mensagens por segundo | ~10-20 req/s (gpt-4o-mini é rápido) |
| Limite OpenRouter | Depende da conta (geralmente 20 req/min free, 1000 req/min pago) |

### Quando escalar

| Cenário | Ação | Custo |
|---|---|---|
| > 60 alunos simultâneos | Upgrade Railway → 2 containers ($10/mês) | $10/mês |
| > 150 alunos simultâneos | Railway → 3x2GB ($20/mês) ou 1x4GB | $20/mês |
| > 300 alunos | Separar frontend (Vercel CDN) + backend Railway | $25-35/mês |
| IA custosa | Trocar gpt-4o-mini → mistral أو gemini (mais baratos) | -30% a -80% |

**Realisticamente:** Com 50 alunos pagantes matriculados, metade nunca está online ao mesmo tempo. A infraestrutura suporta **100 alunos ativos** sem problema.

---

## 6. CUSTOS

### Plano Gratuito (Free Tier)

| Item | Custo | Nota |
|---|---|---|
| Railway Free | US$ 0 | 500h/mês (≈20 dias 24/7) |
| OpenRouter (gpt-4o-mini) | ~R$ 0.03/conversa | Variável |
| Domínio | R$ 0 | Subdomínio existente |
| **Total mensal** | **~R$ 0** | ⚠️ App dorme 4h/dia |

> O free tier da Railway dorme quando hita 500h. Para 24/7 real, precisa do Starter.

### Plano Profissional (Recomendado)

| Item | Custo | Nota |
|---|---|---|
| Railway Starter | US$ 5/mês (~R$ 28) | 24/7, RAM 2GB, 1 vCPU |
| OpenRouter (1000 conversas/mês) | ~R$ 30/mês | Estimativa conservadora |
| Domínio (psieficaz.com) | ~R$ 50/ano | Já pago? R$ 0 |
| **Total mensal** | **~R$ 58/mês** | Para 50 alunos ativos |

### Custo por Aluno

| Alunos ativos | Custo total/mês | Por aluno/mês |
|---|---|---|
| 10 | R$ 58 | R$ 5,80 |
| 50 | R$ 58 | R$ 1,16 |
| 100 | R$ 75 (mais IA) | R$ 0,75 |
| 200 | R$ 120 (dois dynos) | R$ 0,60 |

> Com mensalidade do aluno a partir de R$ 50-100/mês, o custo operacional é marginal.

---

## 7. PUBLICAÇÃO — ESTRATÉGIA DEFINITIVA

### 🚀 Plano "Mínimo Viável Profissional"

| Fase | Ação | Tempo | Custo |
|---|---|---|---|
| **1. Setup** (1 dia) | Criar repo GitHub, testar deploy Railway free | 2h | R$ 0 |
| **2. Domínio** (1 dia) | Configurar DNS `treinador.psieficaz.com` | 30 min | R$ 0 (subdomínio) |
| **3. Produção** (hora zero) | Upgrade Railway Starter ($5/mês), confirmar 24/7 | 5 min | US$ 5 |
| **4. Testes** (mesmo dia) | Validar acesso externo, testar chat, verificar SSL | 1h | R$ 0 |
| **5. Go-live** | Anunciar aos alunos, compartilhar link | 30 min | R$ 0 |

**Tempo total para produção: 1 dia de trabalho (4 horas)**

---

## RESUMO EXECUTIVO

| Questão | Resposta |
|---|---|
| **Plataforma** | Railway (Starter $5/mês) |
| **Domínio** | `treinador.psieficaz.com` |
| **SSL** | Automático (Let's Encrypt) |
| **Banco dados** | NENHUM (stateless) |
| **Alteração código** | ZERO (já é compatível) |
| **Deploy** | Push no GitHub → Railway auto-deploy |
| **Escalabilidade** | 50-100 alunos simultâneos |
| **Custo mensal** | ~R$ 28 (hospedagem) + ~R$ 30 (IA) = **~R$ 58** |
| **Uptime** | 99.9% (Railway garante) |
| **Cold start** | NENHUM (Starter é sempre ligado) |

---

## PRÓXIMOS PASSOS (Se aprovado)

1. ✅ Criar repositório GitHub
2. ✅ Autorizar Railway no GitHub
3. ✅ Configurar variáveis de ambiente
4. ✅ Deploy automático
5. ✅ Configurar DNS `treinador.psieficaz.com`
6. ✅ Testar acesso externo
7. ✅ Go-live

**Está pronto para aprová-lo?**
