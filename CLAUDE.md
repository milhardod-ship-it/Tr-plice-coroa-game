# CLAUDE.md — instruções para o Claude Code neste projeto

Leia este arquivo inteiro antes de qualquer trabalho. Ele substitui a conversa original
onde o projeto foi especificado.

## O projeto
Jogo de futebol para navegador, **mobile-first**, inspirado no jogo viral "7 a 0" (montar um
time sorteando elencos históricos e simular um torneio). Diferença: usa **clubes brasileiros**, e o
jogador monta o time **só com jogadores de diferentes temporadas do seu clube de coração**. O time
disputa uma **Copa Libertadores simulada** contra elencos históricos.

Nome provisório: **Tríplice Coroa** (pode mudar).

## Como trabalhar com o dono do projeto
- Tudo em **português do Brasil** (interface, commits, explicações).
- Ele gosta de entender o **porquê** das decisões e de ver cada etapa funcionando antes de seguir.
- Trabalhe **em etapas** e **PARE ao fim de cada uma** para ele testar. Em cada parada, explique
  em poucas linhas: o que fez, por que escolheu assim e como testar.
- Ele testa pelo **celular**. O repositório está ligado à **Vercel**, que publica a cada push.
- Ao fim de cada etapa: rode `npm run build` (precisa passar sem erros — senão a Vercel falha),
  `npm test`, faça commit e push, e avise que dá para abrir o link da Vercel.
- Teste o layout em **390px de largura**.
- Branch de trabalho: `claude/libertadores-football-game-chhk8w`. Ao fim de cada etapa, envie também
  para a `main` (fast-forward), que a Vercel publica em https://triplice-coroa.vercel.app.

## Escopo desta versão
Apenas **modo solo**. Um multiplayer com amigos (campeonato entre os times montados) virá depois,
então o **motor de simulação deve ser um módulo puro** (sem dependência de UI), **determinístico a
partir de uma seed**, para no futuro rodar no servidor. Tudo isso vive em `src/core/`.

## Clubes jogáveis (12)
Flamengo, Fluminense, Vasco, Botafogo, Corinthians, Palmeiras, São Paulo, Santos, Atlético-MG,
Cruzeiro, Grêmio, Internacional.
**NÃO usar escudos, uniformes ou fotos** (marcas/imagem). Identificar cada clube pelo nome e cores.

## Adversários da Libertadores
Além dos 12 clubes, são ADVERSÁRIOS (não jogáveis, não aparecem no draft) o **campeão e o vice de
cada Libertadores de 1980 a 2025** (lista em `data/finalistas-libertadores.json`).
- Finalista que é um dos 12 jogáveis: o elenco fica no arquivo do clube como temporada marcante
  (sorteável no draft) e é reaproveitado como adversário. **Não duplicar.**
- Clube brasileiro fora dos 12 (ex.: São Caetano) ou estrangeiro: vai em `data/adversarios.json`.
- Cada elenco adversário: **11 titulares + até 3 reservas**, com posição e nota.

## Fluxo do jogo
1. Tela inicial: escolher o clube de coração e o modo (**Clássico**: notas visíveis /
   **Almanaque**: notas ocultas).
2. Escolher formação (4-4-2, 4-3-3, 3-5-2, 4-2-3-1 — vagas em `src/core/formacoes.ts`) e estilo
   (defensivo, equilibrado, ofensivo).
3. **Draft em 11 rodadas**: a cada rodada sorteia UMA temporada do clube (ex.: "Vasco 1997") e
   mostra o elenco. O jogador escolhe 1 jogador e o coloca numa vaga livre da formação.
   - Fora da posição natural é permitido, com penalidade de nota (posição alternativa: penalidade
     pequena; fora de posição: maior).
   - Não repetir o mesmo jogador (mesmo nome, mesmo em outra temporada).
   - Re-sorteios: 3 por partida no Clássico, 1 no Almanaque.
   - Uma temporada não pode sair duas vezes seguidas.
4. Torneio "Libertadores":
   - Fase de grupos: 3 adversários, ida e volta (6 jogos), pelo menos 2 estrangeiros.
     Classificam os 2 primeiros.
   - Mata-mata: oitavas, quartas, semi e final, jogo único, pênaltis se empatar.
   - Adversários sorteados do pool (finalistas da Libertadores + temporadas marcantes dos outros 11
     clubes), dificuldade crescente a cada fase. **A final é sempre contra um CAMPEÃO da Libertadores.**
   - Mostrar cada adversário com nome e ano (ex.: "Boca Juniors 2000").
5. Resultado revelado jogo a jogo (placar + autores dos gols), com botão para pular para o fim.
6. Tela final: campanha completa, destaque "Campeão invicto", e card de imagem para compartilhar
   (gerado no navegador, **1080x1350**) com o time escalado e o resultado.

## Motor de simulação (`src/core/`)
- Força por setor (goleiro, defesa, meio, ataque) a partir das notas, com penalidade para fora de posição.
- Estilo altera o peso ataque/defesa. Adversários usam estilo equilibrado.
- Gols por **Poisson**, média derivada do ataque de um time contra a defesa do outro.
- Pênaltis cobrança a cobrança.
- Autores dos gols sorteados com peso maior para atacantes e meias.
- RNG com seed (nada de `Math.random()` dentro do motor).
- Testes (vitest em `tests/`), ex.: time de notas 90 vence time de notas 70 na grande maioria de
  1000 simulações.

## Dados — PARTE MAIS IMPORTANTE
- Tudo em JSON em `/data`, separado do código:
  - `data/clubes/<id>.json` — um por clube jogável (ids: flamengo, fluminense, vasco, botafogo,
    corinthians, palmeiras, sao-paulo, santos, atletico-mg, cruzeiro, gremio, internacional).
  - `data/adversarios.json` — `{ "adversarios": [ { id, nome, pais, ano, observacao, revisado, titulares[11], reservas[≤3] } ] }`.
    O `id` é o mesmo usado em `finalistas-libertadores.json`.
  - `data/finalistas-libertadores.json` — campeão e vice por ano.
  - `data/confrontos.json` — (etapa 5) confrontos históricos marcantes entre clubes, `"revisado": false`.
- Jogador: `{ "nome", "posicao", "alternativas": [], "nota" }`.
  Posições: `GOL, LD, ZAG, LE, VOL, MC, MEI, PD, PE, ATA`. Nota 40–99.
- Temporada: `{ "ano", "observacao", "titulos": [], "revisado": false, "jogadores": [] }`.
  `titulos` não vazio = "Temporada Lendária". Só títulos grandes (Libertadores, Mundial,
  Brasileiro/Copa União, Copa do Brasil, Mercosul/Sul-Americana); estaduais só na `observacao`.
- Clubes jogáveis: **6 a 8 temporadas MARCANTES** entre 1980 e 2025 (títulos importantes, times
  lembrados pela torcida, **incluindo as Libertadores que disputou como finalista**), com 16 a 20
  jogadores por elenco.
- A nota representa o jogador **NAQUELA temporada**, não na carreira (equilibra os clubes).
- Os dados vêm do conhecimento do modelo e podem ter erros. Por isso: **cadastre só jogadores com
  boa confiança de que estavam naquele elenco; na dúvida, deixe de fora** (mesmo que o elenco fique
  abaixo de 16). Marque tudo `"revisado": false`. O dono revisa.
- O sorteio só usa temporadas cadastradas: o jogo funciona com poucos dados e cresce depois.
- Validação: `npm run validar` (roda antes de todo build). Lógica em `src/core/validacao.ts`,
  também exibida na aba "Validação" do app. `npm run validar:estrito` falha se algum finalista
  estiver sem elenco (use ao terminar a etapa 4/7).

## Técnica
- Vite + React + TypeScript, sem backend. Estado salvo em localStorage (retomar partida em
  andamento; e na etapa 8: progresso, álbum, conquistas).
- Visual escuro e esportivo, botões grandes, bom em 390px.
- `npm run dev` para rodar; publicável na Vercel (`vercel.json` já configura Vite).

## Engajamento e emoção (todas as etapas de interface)
Emocionante e com vontade de jogar "só mais uma", **SEM manipulação**: sorteio e simulação sempre
honestos (aleatoriedade real, nada de resultado forçado), sem compras nem caixas pagas, sem timer
falso, sem notificação de culpa.

1. **Sorteio com suspense**: roleta de anos que gira e desacelera. Temporadas com título aparecem
   como "Temporada Lendária", brilho dourado e animação especial. Elenco revelado carta por carta.
2. **Raridade pela nota**: Bronze (<70), Prata (70–79), Ouro (80–87), Lenda (88+)
   (`src/core/raridade.ts`). Cor e animação próprias; Lenda é rara e marcante. No Almanaque a
   raridade fica oculta até o fim do draft, quando o time é revelado.
3. **Narração ao vivo**: lances em texto minuto a minuto, estilo locutor de rádio brasileiro
   ("GOOOOL! É do Vasco!"), com variedade de frases. Ritmo acelera e fica tenso nos minutos finais
   de jogo apertado. Pênaltis cobrança a cobrança, com pausa antes de cada resultado. Opção de pular.
4. **Identidade de torcedor**: ídolos (nota alta em temporada de título) ganham texto de entrada
   especial ao serem escolhidos. `data/confrontos.json` com confrontos históricos; quando o torneio
   sortear um deles, anunciar "Jogo de vingança" ou "Clássico histórico", com narração própria.
5. **Quase-vitória**: na tela final, mostrar o quão perto chegou ("Faltou 1 gol para o invicto",
   "Eliminado nos pênaltis por 5 a 4"). Botão "Jogar de novo" grande, direto ao draft com o mesmo
   clube em 1 toque.
6. **Desafio do Dia**: seed diária igual para todos (mesmos sorteios e adversários), estilo Wordle,
   numerado ("Desafio #12"). Card compacto para WhatsApp. Uma partida por dia; modo livre ilimitado.
7. **Sequência** de dias jogando o desafio, com 1 dia de folga permitido. Sem mensagens de culpa.
8. **Álbum por clube**: jogadores já escalados ("37 de 210 ídolos do Vasco"), não escalados como silhueta.
9. **Conquistas**: "Invicto", "7 a 0" (vencer por 7+ gols de diferença), "Só anos 80" (campeão com 11
   jogadores de temporadas 1980–1989), "Virada", "Muralha" (campeão sofrendo até 2 gols).
   Notificação discreta ao desbloquear.
10. **Recordes pessoais**: melhor campanha, maior goleada, artilheiro histórico do usuário.
11. **Som e vibração**: sons curtos (sorteio, Lenda, gol, apito final); `navigator.vibrate` a cada gol
    quando disponível. Botão de silenciar sempre visível. Sem músicas ou hinos oficiais.
12. **Ritmo**: partida completa (draft + torneio) em 3 a 5 minutos.

## Etapas
| # | Etapa | Status |
|---|-------|--------|
| 1 | Estrutura do projeto + dados de Vasco e Flamengo + finalistas 1980–2025 + validação | ✅ feita |
| 2 | Telas de clube, modo, formação e o draft completo (itens 1–2 de engajamento) | ✅ feita |
| 3 | Motor de simulação + testes | ✅ feita |
| 4 | Elencos dos finalistas da Libertadores (adversários) | ⏭ próxima |
| 5 | Torneio Libertadores com revelação jogo a jogo (itens 3–4) | |
| 6 | Tela final + card de compartilhamento (item 5) | |
| 7 | Dados dos 10 clubes jogáveis restantes | |
| 8 | Desafio do Dia, sequência, álbum, conquistas, recordes e sons (itens 6–11) | |

**Atualize esta tabela ao concluir cada etapa.**

## Estado atual (fim da etapa 3)
- `src/core/` (puro, sem UI): `tipos.ts`, `formacoes.ts`, `raridade.ts`, `validacao.ts`,
  `rng.ts` (mulberry32 com seed; estado = 1 número), `posicoes.ts` (penalidade: alternativa −3;
  improvisado −8/−14/−22 conforme distância de setor; goleiro ↔ linha −35; mínimo 30),
  `draft.ts` (estado imutável: `iniciarDraft`, `resortear`, `escolher`, `vagasLivres`, `forcaGeral`).
- `src/ui/`: `App.tsx` (troca de telas + salva a partida em localStorage, chave `tc:partida:v1`),
  `telas/` (Inicio, Configurar, Draft, TimeCompleto, Dados), `componentes/` (Campo, Carta, Roleta, Faixa).
- `src/core/motor.ts`: forças por setor (pesos por vaga), λ = 1,25·e^(d/25) com
  d = (ofensivo A − defensivo B) + ½(meio A − meio B); estilo multiplica λ (ofensivo ×1,18 marca /
  ×1,10 sofre; defensivo ×0,85 / ×0,80); mando +10%; gols Poisson; autores por peso de vaga e nota;
  3% gol contra; chances perdidas em `lances` (para a narração da etapa 5); pênaltis cobrança a
  cobrança (conversão 55–90% pela nota cobrador × goleiro); `escalarAutomatico` (melhor 11 entre as
  4 formações, para adversários vindos dos arquivos de clubes); `timeDoDraft`; `estatisticas`.
  Recebe um `Rng` mutável, para encadear um torneio inteiro a partir de uma seed.
- Calibragem atual (5000 jogos, campo neutro): 90×70 → 96% vitórias; 80×80 → 37/27/35%, 2,5 gols;
  84×80 → 50/27/23%.
- UI de teste: aba "Motor" em "Conferir dados" (laboratório) e "Amistoso de teste" no Time completo.
- A roleta é só apresentação: o ano já vem sorteado pelo `core` (com seed).
- Tela "Time completo": botão "Disputar a Libertadores" desativado até a etapa 5.
- Dados: Vasco (1989, 1997, 1998, 2000, 2011, 2024) e Flamengo (1981, 1987, 1992, 2009, 2019,
  2021, 2022, 2025). Os outros 10 clubes têm arquivo com nome/cores e `temporadas: []`.
- `data/adversarios.json` vazio (etapa 4). `data/finalistas-libertadores.json` completo, não revisado.

## Comandos
```
npm install
npm run dev              # desenvolvimento (http://localhost:5173)
npm run validar          # confere os dados
npm test                 # testes (vitest)
npm run build            # validação + tsc + build (o que a Vercel roda)
```
