# Radar de Encartes (nome provisório)

App (PWA) que reúne os encartes dos supermercados do Rio de Janeiro e mostra **onde a sua lista de compras sai mais barata**.

> Este projeto está temporariamente dentro do repositório do jogo, na pasta `radar-de-encartes/`. Vai para um repositório próprio.

## Como rodar
```
cd radar-de-encartes
npm install
npm run dev        # http://localhost:5173  (para testar uma data: ?data=2026-11-23)
npm test           # testes do motor (vitest)
npm run build      # importa os dados + checa tipos + gera dist/
```

## Organização
- `src/core/` — motor puro (sem React): tamanhos e preço por kg/L, preços por perfil (normal / app / cartão),
  validade, id canônico do produto, busca, similares e o cálculo da lista (mercado único × dividir em 2, "compensa?").
- `src/ui/` — telas: Início, Buscar, Produto, Lista, Encartes, Perfil.
- `data/brutos/` — dados como vieram da fonte (site do Mundial, dados embutidos no PDF do Atacadão).
- `data/curadoria/` — ofertas lidas de imagem (Guanabara, Boa do Dia do Atacadão).
- `data/encartes.json` — encartes, validade e lojas onde valem.
- `data/ofertas.json` — gerado por `npm run importar` (não editar à mão).

## Regras importantes
- Mesmo produto em mercados diferentes = mesmo `produto` (id canônico). Quando a regra automática erra, a curadoria define o id.
- Preço com app/cartão nunca aparece como se fosse para todos.
- Tudo `revisado: false` até passar pelo painel de revisão (etapa futura).
