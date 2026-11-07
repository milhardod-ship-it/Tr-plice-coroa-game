# Como continuar o projeto no computador

## 1. Instalar (uma vez)
- **Node.js 22** (LTS): https://nodejs.org — baixe o instalador "LTS".
- **Git**: https://git-scm.com/downloads
- **Claude Code**: siga https://code.claude.com/docs (instalação e login).

Para conferir, abra o terminal (Windows: "Terminal" ou "PowerShell"; Mac: "Terminal") e rode:
```
node -v
git --version
```

## 2. Baixar o projeto (uma vez)
```
git clone https://github.com/milhardod-ship-it/Tr-plice-coroa-game.git
cd Tr-plice-coroa-game
git checkout claude/libertadores-football-game-chhk8w
npm install
```

## 3. Ver o jogo no computador
```
npm run dev
```
Abra o endereço que aparecer (normalmente http://localhost:5173).
Para simular o celular no Chrome: F12 → ícone de celular → largura 390.

## 4. Continuar com o Claude Code
Dentro da pasta do projeto:
```
claude
```
Ele lê o `CLAUDE.md` automaticamente (plano completo, regras e etapa atual).
Para seguir, basta dizer, por exemplo:
> Leia o CLAUDE.md e faça a etapa 2.

## 5. Toda vez que voltar ao projeto
Antes de começar, pegue a versão mais recente do GitHub (caso algo tenha sido feito em outro lugar):
```
git pull
```

## Vercel
A ligação com a Vercel é feita uma vez no site e vale para sempre: cada `git push` publica
automaticamente, venha de onde vier. O `vercel.json` já diz à Vercel que o projeto é Vite.
- Push na `main` → link principal.
- Push em outra branch → link de preview (em Deployments, no painel da Vercel).
