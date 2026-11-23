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

## Robô de coleta
```
npm run coletar             # busca Guanabara e Mundial nos sites e salva em data/brutos/
npm run coletar -- mundial  # só um mercado
npm run importar            # transforma tudo em data/ofertas.json (o build já roda)
```
- **Guanabara**: lista de ofertas do site, por categoria (`/produtos/<id>`) + validade da página `/encarte`.
  O Guana Clube exige login: não é coletado.
- **Mundial**: lista de ofertas do site (JSON dentro da página) + encartes vigentes.
- Agendamento: `.github/workflows/coletar.yml` roda 2×/dia (06:17 e 10:43 no Rio), salva e publica.
  Só fica ativo quando o projeto estiver no repositório próprio.
- Se um site mudar, o robô falha com mensagem clara e os testes de `tests/coleta.test.ts` mostram o que quebrou.

## Organização
- `src/core/` — motor puro (sem React): tamanhos e preço por kg/L, preços por perfil (normal / app / cartão),
  validade, id canônico do produto, busca, similares e o cálculo da lista (mercado único × dividir em 2, "compensa?").
- `src/ui/` — telas: Início, Buscar, Produto, Lista, Encartes, Perfil.
- `data/brutos/` — dados como vieram da fonte (site do Mundial, dados embutidos no PDF do Atacadão).
- `data/curadoria/` — ofertas lidas de imagem (Guanabara, Boa do Dia do Atacadão).
- `data/encartes-manuais.json` — encartes cadastrados à mão (Atacadão); `data/encartes.json` é gerado.
- `data/ofertas.json` — gerado por `npm run importar` (não editar à mão).

## Regras importantes
- Mesmo produto em mercados diferentes = mesmo `produto` (id canônico). Quando a regra automática erra, a curadoria define o id.
- Preço com app/cartão nunca aparece como se fosse para todos.
- Tudo `revisado: false` até passar pelo painel de revisão (etapa futura).
