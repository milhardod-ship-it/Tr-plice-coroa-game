import type { Tamanho } from './tipos';

/** Minúsculas, sem acentos, sem pontuação, espaços simples. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slug(texto: string): string {
  return normalizar(texto).replace(/ /g, '-');
}

function numero(txt: string): number {
  return Number(txt.replace(',', '.'));
}

const FATOR: Record<string, { fator: number; unidade: 'g' | 'ml' }> = {
  kg: { fator: 1000, unidade: 'g' },
  g: { fator: 1, unidade: 'g' },
  l: { fator: 1000, unidade: 'ml' },
  litro: { fator: 1000, unidade: 'ml' },
  litros: { fator: 1000, unidade: 'ml' },
  ml: { fator: 1, unidade: 'ml' },
};

/**
 * Lê o tamanho da embalagem a partir do texto do encarte.
 * Ex.: "Pacote com 5kg" → 5000 g; "Pack com 4x85g" → 340 g;
 * "Bandeja com 30 unidades" → 30 un; "Quilo" → vendido por kg.
 */
export function extrairTamanho(texto: string): { tamanho: Tamanho | null; porKg: boolean } {
  // Protege a vírgula/ponto decimal ("1,7kg") antes de normalizar, que apaga pontuação.
  const t = normalizar(texto.replace(/(\d)[,.](\d)/g, '$1p$2')).replace(/(\d)p(\d)/g, '$1.$2');

  const multi = t.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/);
  if (multi) {
    const f = FATOR[multi[3]];
    return { tamanho: { valor: arred(Number(multi[1]) * numero(multi[2]) * f.fator), unidade: f.unidade }, porKg: false };
  }

  const simples = t.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|litros|litro|l)\b/);
  if (simples) {
    const f = FATOR[simples[2]];
    // "Cerveja 350ml Pack c/18 unidades" → 18 × 350 ml
    const pack = t.match(/\bpack\s*(?:c|com)?\s*(\d+)\b/);
    if (pack) return { tamanho: { valor: arred(Number(pack[1]) * numero(simples[1]) * f.fator), unidade: f.unidade }, porKg: false };
    return { tamanho: { valor: arred(numero(simples[1]) * f.fator), unidade: f.unidade }, porKg: false };
  }

  const unidades = t.match(/(?:c|com)\s*(\d+)\s*(?:unidades|unids|unid|un)\b/);
  if (unidades) return { tamanho: { valor: Number(unidades[1]), unidade: 'un' }, porKg: false };

  if (/\blitro\b/.test(t)) return { tamanho: { valor: 1000, unidade: 'ml' }, porKg: false };

  if (/\b(quilo|kg)\b/.test(t)) return { tamanho: { valor: 1000, unidade: 'g' }, porKg: true };

  return { tamanho: null, porKg: false };
}

function arred(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Texto curto do tamanho: "5 kg", "500 ml", "30 un". */
export function formatarTamanho(t: Tamanho | null, porKg = false): string {
  if (porKg) return 'por kg';
  if (!t) return '';
  if (t.unidade === 'un') return `${t.valor} un`;
  if (t.valor >= 1000) {
    const v = t.valor / 1000;
    return `${formatarNumero(v)} ${t.unidade === 'g' ? 'kg' : 'L'}`;
  }
  return `${formatarNumero(t.valor)} ${t.unidade}`;
}

function formatarNumero(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

export function formatarReais(valor: number): string {
  return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Preço por unidade de medida, para comparar embalagens diferentes.
 * Gramas → R$/kg; ml → R$/L; unidades → R$/un.
 */
export function precoPorMedida(valor: number, tamanho: Tamanho | null): { valor: number; rotulo: string } | null {
  if (!tamanho || tamanho.valor <= 0) return null;
  if (tamanho.unidade === 'un') return { valor: valor / tamanho.valor, rotulo: '/un' };
  const v = (valor / tamanho.valor) * 1000;
  return { valor: v, rotulo: tamanho.unidade === 'g' ? '/kg' : '/L' };
}

export function formatarPorMedida(valor: number, tamanho: Tamanho | null): string {
  const p = precoPorMedida(valor, tamanho);
  return p ? formatarReais(p.valor) + p.rotulo : '';
}
