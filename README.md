# Tríplice Coroa

Jogo de futebol para navegador (mobile-first): monte um time com ídolos de várias temporadas do seu clube e dispute uma Libertadores simulada contra elencos históricos.

## Rodar
```
npm install
npm run dev        # desenvolvimento
npm run validar    # confere os dados de /data
npm test           # testes
npm run build      # valida os dados + build de produção (o que a Vercel roda)
```

## Organização
- `data/` — todos os dados, em JSON, separados do código.
  - `clubes/<id>.json` — um arquivo por clube jogável: `temporadas → jogadores`.
  - `adversarios.json` — finalistas da Libertadores que não são clubes jogáveis.
  - `finalistas-libertadores.json` — campeão e vice de 1980 a 2025.
- `src/core/` — regras puras (tipos, formações, validação; depois o motor). Não importa nada de UI, para rodar no servidor no multiplayer.
- `src/dados/` — carrega os JSONs no app.
- `src/ui/` — telas React.
- `scripts/validar-dados.ts` — validação (roda antes de todo build).

## Formato de uma temporada
```json
{
  "ano": 1998,
  "observacao": "Campeão da Libertadores",
  "titulos": ["Copa Libertadores"],
  "revisado": false,
  "jogadores": [
    { "nome": "Juninho Pernambucano", "posicao": "MC", "alternativas": ["MEI"], "nota": 88 }
  ]
}
```
- Posições: `GOL, LD, ZAG, LE, VOL, MC, MEI, PD, PE, ATA`. Nota de 40 a 99, **naquela temporada**.
- `titulos` não vazio = "Temporada Lendária" no draft. Use só títulos grandes (Libertadores, Mundial, Brasileiro/Copa União, Copa do Brasil, Mercosul/Sul-Americana); estaduais ficam só na `observacao`.
- Raridade pela nota: Bronze (<70), Prata (70–79), Ouro (80–87), Lenda (88+).
