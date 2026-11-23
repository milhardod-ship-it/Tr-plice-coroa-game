import { normalizar } from './texto';
import type { Tamanho } from './tipos';

// Palavras que não ajudam a identificar o produto (embalagem, conectivos, "vários sabores"…).
const IGNORADAS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'com', 'sem', 'em', 'e', 'ou', 'a', 'o', 'p', 'c', 's',
  'tipo', '1', 'varios', 'varias', 'sabores', 'tipos', 'fragrancias', 'linha', 'toda',
  'congelado', 'congelada', 'resfriado', 'resfriada', 'pacote', 'bandeja', 'pote', 'lata', 'latao',
  'caixeta', 'caixa', 'garrafa', 'pet', 'frasco', 'tp', 'unidade', 'unidades', 'preco', 'por', 'quilo',
  'na', 'no', 'peca', 'sache', 'vidro', 'tubo', 'pack', 'refil', 'kg', 'g', 'ml', 'l', 'un', 'cada',
]);

/**
 * Etiqueta do tamanho para compor o id: "5000g", "500ml", "30un".
 * Vendido por quilo vira "1000g": assim "filé por kg" e "filé bandeja 1 kg" se comparam.
 */
export function etiquetaTamanho(tamanho: Tamanho | null, porKg: boolean): string {
  if (porKg) return '1000g';
  if (!tamanho) return 'sem-tamanho';
  return `${tamanho.valor}${tamanho.unidade}`;
}

/**
 * Id canônico do produto: tipo (até 3 palavras do nome) + marca + tamanho.
 * Ex.: ("Arroz Parboilizado", "Tio João", 5000 g) → "arroz-parboilizado__tio-joao__5000g".
 * Ofertas com o mesmo id em mercados diferentes são o MESMO produto e entram na comparação.
 * Quando a regra automática erra, a curadoria define o id à mão.
 */
export function idProduto(nome: string, marca: string, tamanho: Tamanho | null, porKg: boolean): string {
  const daMarca = new Set(normalizar(marca).split(' '));
  const palavras = normalizar(nome)
    .split(' ')
    .filter((w) => w && !IGNORADAS.has(w) && !daMarca.has(w) && !/^\d/.test(w))
    .slice(0, 3);
  return [palavras.join('-') || 'produto', normalizar(marca).replace(/ /g, '-') || 'sem-marca', etiquetaTamanho(tamanho, porKg)].join('__');
}
