import { melhorPreco } from './precos';
import type { ItemLista, MercadoId, Oferta, Perfil, Preco } from './tipos';

/** Abaixo desta economia, dividir a compra entre 2 mercados "não compensa a viagem". */
export const ECONOMIA_MINIMA_PARA_DIVIDIR = 10;

export interface Opcao {
  mercado: MercadoId;
  oferta: Oferta;
  preco: Preco;
  /** preço × quantidade */
  subtotal: number;
}

export interface ResultadoItem {
  item: ItemLista;
  /** Melhor opção em cada mercado que tem o produto, do mais barato ao mais caro. */
  opcoes: Opcao[];
}

export interface ResultadoMercado {
  mercado: MercadoId;
  total: number;
  encontrados: number;
  faltando: string[];
}

export interface Divisao {
  mercados: MercadoId[];
  total: number;
  encontrados: number;
  /** Em qual mercado comprar cada produto. */
  onde: Record<string, MercadoId>;
}

export interface ResultadoLista {
  itens: ResultadoItem[];
  porMercado: ResultadoMercado[];
  /** Melhor compra num mercado só (mais itens; empate → menor total). */
  melhorUnico: ResultadoMercado | null;
  /** Melhor compra em até 2 mercados. */
  melhorDivisao: Divisao | null;
  /** Quanto a divisão economiza em relação ao melhor mercado único (mesmos itens). */
  economiaDivisao: number;
  /** A divisão encontra itens que o mercado único não tem. */
  divisaoCobreMais: boolean;
  compensaDividir: boolean;
}

/**
 * Calcula a lista de compras: quanto custa em cada mercado e a melhor forma de comprar.
 * `ofertas` deve conter só ofertas válidas (e da região do usuário).
 */
export function calcularLista(
  itens: ItemLista[],
  ofertas: Oferta[],
  perfil: Perfil,
  economiaMinima = ECONOMIA_MINIMA_PARA_DIVIDIR,
): ResultadoLista {
  const porProduto = new Map<string, Oferta[]>();
  for (const o of ofertas) {
    const l = porProduto.get(o.produto);
    if (l) l.push(o);
    else porProduto.set(o.produto, [o]);
  }

  const resultadoItens: ResultadoItem[] = itens.map((item) => {
    const melhorPorMercado = new Map<MercadoId, Opcao>();
    for (const oferta of porProduto.get(item.produto) ?? []) {
      const preco = melhorPreco(oferta, perfil);
      if (!preco) continue;
      const atual = melhorPorMercado.get(oferta.mercado);
      if (!atual || preco.valor < atual.preco.valor) {
        melhorPorMercado.set(oferta.mercado, {
          mercado: oferta.mercado,
          oferta,
          preco,
          subtotal: arred(preco.valor * item.quantidade),
        });
      }
    }
    const opcoes = [...melhorPorMercado.values()].sort((a, b) => a.subtotal - b.subtotal);
    return { item, opcoes };
  });

  const mercados = [...new Set(resultadoItens.flatMap((r) => r.opcoes.map((o) => o.mercado)))].sort();

  const porMercado: ResultadoMercado[] = mercados
    .map((mercado) => {
      let total = 0;
      let encontrados = 0;
      const faltando: string[] = [];
      for (const r of resultadoItens) {
        const op = r.opcoes.find((o) => o.mercado === mercado);
        if (op) {
          total += op.subtotal;
          encontrados++;
        } else faltando.push(r.item.produto);
      }
      return { mercado, total: arred(total), encontrados, faltando };
    })
    .sort((a, b) => b.encontrados - a.encontrados || a.total - b.total);

  const melhorUnico = porMercado[0] ?? null;

  // Testa todos os pares de mercados (e cada mercado sozinho).
  let melhorDivisao: Divisao | null = null;
  const combinacoes: MercadoId[][] = mercados.map((m) => [m]);
  for (let i = 0; i < mercados.length; i++)
    for (let j = i + 1; j < mercados.length; j++) combinacoes.push([mercados[i], mercados[j]]);

  for (const combo of combinacoes) {
    let total = 0;
    let encontrados = 0;
    const onde: Record<string, MercadoId> = {};
    for (const r of resultadoItens) {
      const op = r.opcoes.find((o) => combo.includes(o.mercado)); // opcoes já ordenadas
      if (op) {
        total += op.subtotal;
        encontrados++;
        onde[r.item.produto] = op.mercado;
      }
    }
    // Só conta como divisão se os 2 mercados forem realmente usados.
    const usados = combo.filter((m) => Object.values(onde).includes(m));
    const candidato: Divisao = { mercados: usados, total: arred(total), encontrados, onde };
    if (
      !melhorDivisao ||
      candidato.encontrados > melhorDivisao.encontrados ||
      (candidato.encontrados === melhorDivisao.encontrados && candidato.total < melhorDivisao.total - 0.001)
    ) {
      melhorDivisao = candidato;
    }
  }

  let economiaDivisao = 0;
  let divisaoCobreMais = false;
  if (melhorDivisao && melhorUnico && melhorDivisao.mercados.length > 1) {
    divisaoCobreMais = melhorDivisao.encontrados > melhorUnico.encontrados;
    if (!divisaoCobreMais) economiaDivisao = arred(melhorUnico.total - melhorDivisao.total);
  }
  const compensaDividir =
    !!melhorDivisao && melhorDivisao.mercados.length > 1 && (divisaoCobreMais || economiaDivisao >= economiaMinima);

  return {
    itens: resultadoItens,
    porMercado,
    melhorUnico,
    melhorDivisao,
    economiaDivisao,
    divisaoCobreMais,
    compensaDividir,
  };
}

function arred(n: number): number {
  return Math.round(n * 100) / 100;
}
