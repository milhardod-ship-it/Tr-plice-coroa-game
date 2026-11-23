// Coleta do Guanabara: o site publica as ofertas do encarte em texto, por categoria
// (https://www.supermercadosguanabara.com.br/produtos/<id>). O clube (Guana Clube) exige login: não coletamos.
import type { Baixar } from './http';

export const SITE_GUANABARA = 'https://www.supermercadosguanabara.com.br';

export const CATEGORIAS_GUANABARA: Record<string, string> = {
  '2': 'Cereais e farináceos',
  '12': 'Matinais e padaria',
  '22': 'Massas',
  '32': 'Biscoitos',
  '42': 'Açougue',
  '52': 'Embutidos',
  '62': 'Frios e laticínios',
  '72': 'Carnes salgadas',
  '82': 'Bebidas',
  '92': 'Conservas',
  '102': 'Limpeza',
  '112': 'Higiene pessoal',
  '152': 'Chocolates e bombons',
  '203': 'Cantinho do bebê',
};

export interface ItemGuanabara {
  categoria: string;
  nome: string;
  /** Preço como aparece ("28,95"). */
  preco: string;
  /** Texto depois do preço ("cada"), se houver. */
  sufixo: string;
  imagem: string | null;
}

export interface ColetaGuanabara {
  fonte: 'guanabara-site';
  coletadoEm: string;
  inicio: string;
  fim: string;
  itens: ItemGuanabara[];
}

const entidades: Record<string, string> = { '&amp;': '&', '&quot;': '"', '&#039;': "'", '&#39;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };
function texto(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, (e) => entidades[e] ?? e)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lê os produtos de uma página de categoria. */
export function lerCategoriaGuanabara(html: string, categoria: string): ItemGuanabara[] {
  const itens: ItemGuanabara[] = [];
  const re = /<div class="col item">([\s\S]*?)<div class="name">([\s\S]*?)<\/div>/g;
  for (const m of html.matchAll(re)) {
    const bloco = m[1];
    const preco = bloco.match(/<span class="number">([^<]*)<\/span>\s*([^<]*)</);
    if (!preco) continue;
    const img = bloco.match(/url\('([^']+)'\)/);
    itens.push({
      categoria,
      nome: texto(m[2]),
      preco: texto(preco[1]),
      sufixo: texto(preco[2]),
      imagem: img ? (img[1].startsWith('//') ? `https:${img[1]}` : img[1]).replace(':443/', '/') : null,
    });
  }
  return itens;
}

/** Validade do encarte: "Promoção válida de 18/11/2026 até 23/11/2026". */
export function lerValidadeGuanabara(html: string): { inicio: string; fim: string } | null {
  const m = texto(html).match(/v[áa]lida de (\d{2})\/(\d{2})\/(\d{4}) at[ée] (\d{2})\/(\d{2})\/(\d{4})/i);
  if (!m) return null;
  return { inicio: `${m[3]}-${m[2]}-${m[1]}`, fim: `${m[6]}-${m[5]}-${m[4]}` };
}

export function coletarGuanabara(baixar: Baixar, agora = new Date()): ColetaGuanabara {
  const validade = lerValidadeGuanabara(baixar(`${SITE_GUANABARA}/encarte`));
  if (!validade) throw new Error('Guanabara: não achei a validade do encarte na página /encarte');
  const itens: ItemGuanabara[] = [];
  for (const [id, nome] of Object.entries(CATEGORIAS_GUANABARA)) {
    itens.push(...lerCategoriaGuanabara(baixar(`${SITE_GUANABARA}/produtos/${id}`), nome));
  }
  if (itens.length === 0) throw new Error('Guanabara: nenhuma oferta encontrada (o site mudou?)');
  return { fonte: 'guanabara-site', coletadoEm: agora.toISOString(), ...validade, itens };
}
