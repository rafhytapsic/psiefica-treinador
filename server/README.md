# Psiefica · Treinador Clínico — Servidor Proxy

Backend mínimo (Node 18+, **zero dependências**) que esconde a chave de API e o system prompt do cliente, gerencia códigos de acesso por aluno e protege contra abuso com rate-limit. O mesmo processo também serve o HTML do treinador.

```
filecusersrafaeladownloadsaria/
├── psiefica-treinador.html       # frontend (modo proxy por padrão)
└── server/
    ├── server.js                 # proxy + estáticos
    ├── package.json
    ├── .env.example
    └── README.md                 # este arquivo
```

---

## 1. Como rodar localmente

Pré-requisito: **Node.js 18 ou superior**.

> Se ainda não tem Node instalado, baixe em https://nodejs.org/ (escolha a versão LTS, instalador `.msi` para Windows). Reinicie o PowerShell depois.

```powershell
cd server
copy .env.example .env
# edite .env e cole sua chave em API_KEY
node server.js
```

Abra http://localhost:8787/ — o servidor entrega o HTML e a API no mesmo endereço.

> O HTML por padrão chama `/api/chat` no mesmo domínio em que estiver hospedado. Não precisa configurar URL nenhuma se você abrir pelo servidor.

---

## 2. Variáveis de ambiente

Configure no `.env` (local) ou no painel da hospedagem:

| Variável        | Obrig. | Descrição |
|-----------------|--------|-----------|
| `API_KEY`       | sim    | Chave OpenAI (`sk-…`) ou OpenRouter |
| `PROVIDER`      | não    | `openai` (padrão) ou `openrouter` |
| `MODEL`         | não    | `gpt-4o-mini` (padrão) |
| `ACCESS_CODES`  | não    | Códigos dos alunos separados por vírgula. Se vazio, qualquer um com a URL usa. |
| `ALLOW_ORIGIN`  | não    | CORS. Em produção, coloque o domínio do site (ex: `https://psiefica.com.br`). |
| `RATE_LIMIT`    | não    | Requisições permitidas por janela (padrão 40) |
| `RATE_WINDOW_S` | não    | Janela em segundos (padrão 60) |
| `MAX_TOKENS`    | não    | Tamanho máximo de resposta (padrão 900) |
| `TEMPERATURE`   | não    | Criatividade (padrão 0.6) |
| `PORT`          | não    | Porta (padrão 8787) |
| `PUBLIC_URL`    | não    | Apenas usado nos headers do OpenRouter |

---

## 3. Gerenciar alunos por código de acesso

Para que **só alunos pagos** consigam usar:

```env
ACCESS_CODES=PSF-2025-MARIA,PSF-2025-JOAO,PSF-2025-ANA
```

- Cada aluno digita o código no modal **Config** do treinador, na aba *Servidor Psiefica*.
- O servidor valida via header `X-Access-Code`.
- O rate-limit passa a ser **por código** (não por IP), evitando que um aluno compartilhe a URL.
- Para revogar acesso, basta remover o código do `ACCESS_CODES` e reiniciar o servidor.

> Para algo mais robusto (banco de dados, expiração, painel admin), avise — é a próxima evolução natural.

---

## 4. Deploy em produção

### Opção A — Render.com (gratuito ou US$ 7/mês)

1. Suba a pasta `server/` em um repositório (GitHub).
2. Em Render: **New → Web Service → Build Command:** vazio. **Start Command:** `node server.js`.
3. Em **Environment** adicione `API_KEY`, `ACCESS_CODES`, `ALLOW_ORIGIN` etc.
4. Conecte o domínio (ex: `treinador.psiefica.com.br`).
5. Suba o arquivo `psiefica-treinador.html` para a raiz **junto com `server/`** — o `PUBLIC_DIR` padrão (`..`) já encontra o HTML.

### Opção B — Railway / Fly.io / VPS

Mesma ideia: `node server.js`, defina as variáveis. Em VPS, use PM2:

```bash
npm i -g pm2
pm2 start server.js --name psiefica
pm2 save && pm2 startup
```

### Opção C — Apenas API, frontend separado

Se você quiser hospedar o HTML em outro lugar (ex: Hotmart, Kiwify, WordPress, Vercel), é só:

1. Subir `server/` em qualquer plataforma → vira `https://api.seu-dominio.com`.
2. No HTML, no modal **Config**, preencher **URL do servidor** = `https://api.seu-dominio.com`.
3. Definir `ALLOW_ORIGIN=https://seu-site.com` no servidor.

---

## 5. Endpoints

### `GET /api/health`
Diagnóstico (não autenticado):
```json
{ "ok": true, "provider": "openai", "model": "gpt-4o-mini", "hasKey": true, "gatedByCodes": true }
```

### `POST /api/chat`
Headers:
- `Content-Type: application/json`
- `X-Access-Code: PSF-...` *(se houver `ACCESS_CODES` configurado)*

Body:
```json
{ "messages": [
  {"role":"user","content":"Quero treinar nível 2."},
  {"role":"assistant","content":"…"},
  {"role":"user","content":"…"}
] }
```

Resposta:
```json
{ "reply": "**Cenário** ..." }
```

Erros:
- `401 invalid_access_code`
- `429 rate_limited`
- `500 server_not_configured` / `upstream_error`

---

## 6. Custos e ajustes recomendados

- **gpt-4o-mini** custa centavos por sessão de treino completa (~50 turnos). Excelente custo/qualidade para correção técnica.
- Para nível 5 (Maestria), considere `gpt-4o` ou `claude-3.5-sonnet` (via OpenRouter): respostas mais refinadas em timing e linguagem.
- Em produção, monte `ALLOW_ORIGIN` apontando só para o seu domínio.

---

## 7. Segurança

- A chave de API **nunca** chega ao navegador do aluno.
- O system prompt **nunca** é exposto ao cliente em modo proxy.
- Há rate limit por código/IP em memória (suficiente para começar; para escala alta, troque por Redis).
- O servidor rejeita payloads acima de 256 KB e limita o histórico a 30 turnos por requisição.
