# Deploy do Treinador Psiefica — passo a passo

Escolha um caminho. Os arquivos `render.yaml`, `Dockerfile`, `.gitignore` já estão prontos no repositório.

---

## ⭐ Caminho recomendado — Render.com (GRATUITO)

Tempo: ~10 minutos. Você ganha uma URL HTTPS pública tipo `https://psiefica-treinador.onrender.com`.

### 1) Crie a conta GitHub (se não tiver)
- https://github.com/signup — pode usar o e-mail que você já usa.

### 2) Suba o código no GitHub
**Opção A — pelo terminal (já tudo automatizado por mim):**
```powershell
cd "C:\Users\Rafaela\.verdent\verdent-projects\filecusersrafaeladownloadsaria"
gh auth login          # abre o navegador, você loga no GitHub
gh repo create psiefica-treinador --public --source=. --push
```

**Opção B — pela interface do GitHub:**
1. https://github.com/new → nome `psiefica-treinador` → **Create repository**.
2. Na próxima página, clique **"uploading an existing file"** e arraste TODOS os arquivos da pasta (menos `.env` e `node_modules`, mas o `.gitignore` já cuida disso).
3. Confirme o commit.

### 3) Crie a conta Render
- https://dashboard.render.com/register — pode logar com GitHub direto.

### 4) Deploy via Blueprint (1 clique)
1. https://dashboard.render.com/blueprints → **New Blueprint Instance**.
2. Selecione o repositório `psiefica-treinador`.
3. Render lê `render.yaml` automaticamente.
4. Em **Environment Variables**, preencha as 2 marcadas como `sync: false`:
   - `API_KEY` = sua chave OpenAI (`sk-...`)
   - `ACCESS_CODES` = `PSF-2025-MARIA,PSF-2025-JOAO,...` (códigos dos seus alunos)
5. **Apply**. Em ~2 minutos seu serviço estará no ar.

### 5) Use
A URL será `https://psiefica-treinador.onrender.com` (ou similar).
- Compartilhe com seus alunos junto com o código de acesso deles.
- Eles abrem a URL → clicam em **Config** → colam o código → começam a treinar.

> **Limitações do plano Free do Render:**
> - O serviço dorme após 15 min de inatividade (1ª requisição depois demora ~30s).
> - 750h/mês grátis (mais que suficiente para um único serviço).
> - Para evitar cold start, atualize para o plano **Starter ($7/mês)**.

### 6) (Opcional) Domínio próprio
No Render → Settings → Custom Domain → adicione `treinador.psiefica.com.br`. O Render dá os registros DNS. Configure no seu provedor (Registro.br, GoDaddy, etc).

---

## 🚀 Caminho expresso — Cloudflare Tunnel (PÚBLICO EM 2 MINUTOS, sem signup)

Use isso para validar com os primeiros alunos enquanto não migra para o Render. **Seu PC precisa ficar ligado** com o servidor rodando.

```powershell
# 1. Instalar (uma vez)
winget install --id Cloudflare.cloudflared

# 2. Subir o servidor Psiefica numa janela:
cd "C:\Users\Rafaela\.verdent\verdent-projects\filecusersrafaeladownloadsaria\server"
& "C:\Program Files\nodejs\node.exe" server.js

# 3. Em OUTRA janela do PowerShell, abra o tunnel:
cloudflared tunnel --url http://localhost:8787
```

Vai aparecer uma URL tipo `https://random-words.trycloudflare.com`. **Essa URL é a que você dá para os alunos**. Eles preenchem essa URL no campo **URL do servidor** no Config.

---

## 🛠 Caminho alternativo — Railway / Fly.io / VPS

### Railway (free trial, depois ~$5/mês)
1. https://railway.app → New Project → Deploy from GitHub Repo.
2. Selecione `psiefica-treinador`.
3. Em Variables, adicione `API_KEY`, `ACCESS_CODES`, `PORT=8787`.
4. Pronto.

### Fly.io (free tier real, sem cold start)
```powershell
winget install Fly.flyctl
fly auth signup
cd server
fly launch --copy-config --no-deploy
fly secrets set API_KEY=sk-... ACCESS_CODES=PSF-2025-MARIA
fly deploy
```

### VPS (Hostgator, Locaweb, DigitalOcean, etc)
1. SSH no servidor.
2. Instale Node 20: `curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs`
3. Suba os arquivos (`scp` ou git clone).
4. `cd server && cp .env.example .env && nano .env` (preencha `API_KEY` e `ACCESS_CODES`).
5. Rode com PM2 para reiniciar automático:
   ```bash
   npm i -g pm2
   pm2 start server.js --name psiefica
   pm2 save && pm2 startup
   ```
6. Configure NGINX como proxy reverso para HTTPS (Let's Encrypt gratuito).

---

## ✅ Pós-deploy — checklist final

- [ ] Acesse `https://SUA-URL/api/health` no navegador. Deve mostrar `{"ok":true,"hasKey":true,"gatedByCodes":true}`.
- [ ] Acesse `https://SUA-URL/`. O treinador deve carregar.
- [ ] No Config, cole um código válido. Mande "oi". Deve receber a pergunta dos 5 níveis.
- [ ] Em produção, mude `ALLOW_ORIGIN` para o seu domínio real (não use `*`).
- [ ] Adicione `https://SUA-URL/` ao seu site Psiefica como botão "Acessar Treinador".

---

## Custos esperados

| Item | Custo mensal |
|------|--------------|
| Hospedagem Render Free | R$ 0 (com cold start) |
| Hospedagem Render Starter | ~R$ 35 (~US$ 7) |
| OpenAI gpt-4o-mini, ~50 sessões/aluno × 20 alunos | ~R$ 25–50 |
| Domínio próprio (.com.br) | ~R$ 40/ano |

Total: **R$ 60-90/mês para até 20 alunos ativos**, e cada turma adicional praticamente não muda o custo.
