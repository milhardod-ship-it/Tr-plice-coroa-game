import type { Encarte, Oferta, Perfil, Preco } from './tipos';

/** Perfil de quem não marcou nenhum app ou cartão. */
export const PERFIL_VAZIO: Perfil = { programas: [] };

/** O cliente consegue pagar este preço? (tem todos os programas exigidos) */
export function podePagar(preco: Preco, perfil: Perfil): boolean {
  return preco.exige.every((p) => perfil.programas.includes(p));
}

/** Preço que qualquer pessoa paga no caixa (o menor sem exigências). */
export function precoParaTodos(oferta: Oferta): Preco | null {
  return menor(oferta.precos.filter((p) => p.exige.length === 0));
}

/** Menor preço que ESTE cliente consegue pagar, conforme o perfil. */
export function melhorPreco(oferta: Oferta, perfil: Perfil): Preco | null {
  return menor(oferta.precos.filter((p) => podePagar(p, perfil)));
}

/** Menor preço da oferta para quem tem tudo (para mostrar "até R$ X com app"). */
export function menorPrecoPossivel(oferta: Oferta): Preco | null {
  return menor(oferta.precos);
}

function menor(precos: Preco[]): Preco | null {
  let m: Preco | null = null;
  for (const p of precos) if (!m || p.valor < m.valor) m = p;
  return m;
}

/** Fim efetivo da oferta: a própria data, senão o fim do encarte. */
export function fimDaOferta(oferta: Oferta, encartes: Map<string, Encarte>): string {
  return oferta.fim ?? encartes.get(oferta.encarte)?.fim ?? '0000-00-00';
}

/** A oferta vale na data `hoje` (AAAA-MM-DD)? Datas são inclusivas. */
export function estaValida(oferta: Oferta, encartes: Map<string, Encarte>, hoje: string): boolean {
  const enc = encartes.get(oferta.encarte);
  if (!enc) return false;
  return enc.inicio <= hoje && hoje <= fimDaOferta(oferta, encartes);
}

/** "Só hoje": a oferta termina exatamente hoje e começou hoje (ofertas de um dia). */
export function ehSoHoje(oferta: Oferta, encartes: Map<string, Encarte>, hoje: string): boolean {
  const enc = encartes.get(oferta.encarte);
  return !!enc && enc.inicio === hoje && fimDaOferta(oferta, encartes) === hoje;
}

/** Desconto em % em relação ao preço "de", usando o preço para todos. */
export function descontoPercentual(oferta: Oferta): number | null {
  const p = precoParaTodos(oferta);
  if (!p || !oferta.precoDe || oferta.precoDe <= p.valor) return null;
  return Math.round((1 - p.valor / oferta.precoDe) * 100);
}
