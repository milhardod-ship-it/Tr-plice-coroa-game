import { melhorPreco } from './precos';
import { normalizar } from './texto';
import type { Categoria, Oferta, Perfil, Tamanho } from './tipos';

/** Um produto com todas as ofertas dele (uma ou mais por mercado). */
export interface Produto {
  id: string;
  nome: string;
  marca: string;
  categoria: Categoria;
  tamanho: Tamanho | null;
  porKg: boolean;
  ofertas: Oferta[];
}

export function agruparProdutos(ofertas: Oferta[]): Map<string, Produto> {
  const mapa = new Map<string, Produto>();
  for (const o of ofertas) {
    const p = mapa.get(o.produto);
    if (p) p.ofertas.push(o);
    else
      mapa.set(o.produto, {
        id: o.produto,
        nome: o.nome,
        marca: o.marca,
        categoria: o.categoria,
        tamanho: o.tamanho,
        porKg: o.porKg,
        ofertas: [o],
      });
  }
  return mapa;
}

/** Menor preço do produto para o perfil, entre todos os mercados. */
export function menorPrecoDoProduto(produto: Produto, perfil: Perfil): number | null {
  let m: number | null = null;
  for (const o of produto.ofertas) {
    const p = melhorPreco(o, perfil);
    if (p && (m === null || p.valor < m)) m = p.valor;
  }
  return m;
}

/**
 * Busca por texto livre ("arroz 5kg", "leite ninho").
 * Todas as palavras precisam aparecer (como começo de palavra) no nome, marca ou categoria.
 * Produtos em mais mercados aparecem antes (dá para comparar); depois, o mais barato.
 */
export function buscar(produtos: Iterable<Produto>, texto: string, perfil: Perfil): Produto[] {
  const termos = normalizar(texto).split(' ').filter(Boolean);
  if (termos.length === 0) return [];
  const achados: { p: Produto; nomeComeca: boolean }[] = [];
  for (const p of produtos) {
    const palavras = normalizar(`${p.nome} ${p.marca} ${p.categoria} ${p.ofertas[0].original}`).split(' ');
    if (termos.every((t) => palavras.some((w) => w.startsWith(t)))) {
      achados.push({ p, nomeComeca: normalizar(p.nome).startsWith(termos[0]) });
    }
  }
  return achados
    .sort(
      (a, b) =>
        Number(b.nomeComeca) - Number(a.nomeComeca) ||
        mercadosDistintos(b.p) - mercadosDistintos(a.p) ||
        (menorPrecoDoProduto(a.p, perfil) ?? Infinity) - (menorPrecoDoProduto(b.p, perfil) ?? Infinity),
    )
    .map((x) => x.p);
}

export function mercadosDistintos(p: Produto): number {
  return new Set(p.ofertas.map((o) => o.mercado)).size;
}

/**
 * Produtos parecidos e mais baratos por kg/L: mesmo tipo (primeira palavra do nome),
 * mesma unidade de medida, preço por medida pelo menos 5% menor.
 */
export function similaresMaisBaratos(produto: Produto, todos: Iterable<Produto>, perfil: Perfil, limite = 3): Produto[] {
  const base = primeiraPalavra(produto.nome);
  const ref = precoPorBase(produto, perfil);
  if (!base || ref === null || !produto.tamanho) return [];
  const lista: { p: Produto; v: number }[] = [];
  for (const p of todos) {
    if (p.id === produto.id || primeiraPalavra(p.nome) !== base) continue;
    if (!p.tamanho || p.tamanho.unidade !== produto.tamanho.unidade) continue;
    const v = precoPorBase(p, perfil);
    if (v !== null && v < ref * 0.95) lista.push({ p, v });
  }
  return lista.sort((a, b) => a.v - b.v).slice(0, limite).map((x) => x.p);
}

function precoPorBase(p: Produto, perfil: Perfil): number | null {
  const v = menorPrecoDoProduto(p, perfil);
  if (v === null || !p.tamanho || p.tamanho.valor <= 0) return null;
  return v / p.tamanho.valor;
}

function primeiraPalavra(nome: string): string {
  return normalizar(nome).split(' ')[0] ?? '';
}
