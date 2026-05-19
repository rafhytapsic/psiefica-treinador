# Universal Dockerfile (funciona em Render, Railway, Fly.io, Google Cloud Run, AWS App Runner, VPS)
FROM node:20-alpine

WORKDIR /app

# Copia tudo (a aplicação não tem dependências npm)
COPY . .

# A porta padrão é 8787 mas a maioria das hospedagens injeta PORT
ENV PORT=8787
EXPOSE 8787

# O servidor já lê .env automaticamente; em produção use vars de ambiente da plataforma
WORKDIR /app/server
CMD ["node", "server.js"]
