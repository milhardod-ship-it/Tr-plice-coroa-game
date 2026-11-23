// Importa os encartes (dados brutos + curadoria manual) para data/ofertas.json.
// Rode com: npm run importar
//
// Fontes:
//  - data/brutos/mundial-site-*.json      lista de ofertas do site do Mundial (dados prontos)
//  - data/brutos/atacadao-ofertao-*.json  dados embutidos no PDF do Atacadão
//  - data/curadoria/*.json                ofertas lidas de imagem (Guanabara, Boa do Dia)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { idProduto } from '../src/core/canonico';
import { categorizar } from '../src/core/categorias';
import { extrairTamanho, normalizar } from '../src/core/texto';
import type { MercadoId, Oferta, Preco, ProgramaId } from '../src/core/tipos';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (rel: string) => JSON.parse(readFileSync(join(RAIZ, rel), 'utf8'));

const ofertas: Oferta[] = [];
let seq = 0;

/** Cria uma oferta por marca (ofertas "Marca A, B ou C" valem para cada uma). */
function adicionar(base: {
  mercado: MercadoId;
  encarte: string;
  nome: string;
  marcas: string[];
  original: string;
  textoTamanho: string;
  precos: Preco[];
  precoDe?: number;
  fim?: string;
  limite?: string;
  produto?: string;
  categoria?: Oferta['categoria'];
}) {
  const { tamanho, porKg } = extrairTamanho(base.textoTamanho);
  const marcas = base.marcas.length ? base.marcas : [''];
  for (const marca of marcas) {
    const produto =
      base.produto && marcas.length === 1 ? base.produto : idProduto(base.nome, marca, tamanho, porKg);
    ofertas.push({
      id: `${base.encarte}#${++seq}`,
      mercado: base.mercado,
      encarte: base.encarte,
      produto,
      nome: base.nome,
      marca,
      original: base.original,
      categoria: base.categoria ?? categorizar(`${base.nome} ${base.original}`),
      tamanho,
      porKg,
      precos: base.precos,
      ...(base.precoDe ? { precoDe: base.precoDe } : {}),
      ...(base.fim ? { fim: base.fim } : {}),
      ...(base.limite ? { limite: base.limite } : {}),
      revisado: false,
    });
  }
}

const reais = (txt: string | null | undefined): number | undefined => {
  if (!txt) return undefined;
  const m = txt.replace(/\./g, '').match(/(\d+),(\d{2})/);
  return m ? Number(`${m[1]}.${m[2]}`) : undefined;
};

const PEQUENAS = new Set(['de', 'da', 'do', 'das', 'dos', 'com', 'e', 'ou', 'em', 'a', 'o', 'para']);
function capitalizar(txt: string): string {
  return txt
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => (i > 0 && PEQUENAS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

/** Data local (Rio, UTC−3) a partir de um instante ISO em UTC. */
function dataLocal(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- Mundial
{
  const brutos = ler('data/brutos/mundial-site-2026-11-19.json') as any[];
  for (const o of brutos) {
    const p = o.product;
    const imperdivel = !p.customBrand && !p.customWeight;
    const nomeBase = imperdivel
      ? capitalizar(String(p.customName).replace(/\s+(c\/\s*\d+.*|\d.*|kg)$/i, ''))
      : [p.customName, p.customType].filter(Boolean).join(' ');
    const marca = p.customBrand ? capitalizar(p.customBrand) : '';
    const textoTamanho = o.measureUnit === 'KG' ? 'Quilo' : `${p.customWeight ?? ''} ${p.customName ?? ''}`;
    const preco = reais(o.price)!;
    const normal = reais(o.oldPrice);
    let condicao = 'no app Mundial Total';
    if (o.quantity > 1) {
      condicao = o.percent
        ? `levando ${o.quantity}, ${o.percent}% off (app Mundial Total)`
        : `leve ${o.quantity}, pague ${o.quantity2} (app Mundial Total)`;
    }
    const precos: Preco[] = normal
      ? [
          { valor: normal, exige: [] },
          { valor: preco, exige: ['mundial-total'], condicao },
        ]
      : [{ valor: preco, exige: [] }];
    adicionar({
      mercado: 'mundial',
      encarte: 'mundial-2026-11-19',
      nome: nomeBase.trim(),
      marcas: [marca],
      original: [p.customName, p.customBrand, p.customType, p.customWeight, p.customDetail].filter(Boolean).join(' ').replace(/\s+/g, ' '),
      textoTamanho,
      precos,
      fim: dataLocal(o.unpublishedIn),
    });
  }
}

// ---------------------------------------------------------------- Atacadão (PDF)
const MARCAS_ATACADAO = [
  'Copacol', 'Aurora', 'Frimesa', 'Friboi', 'Sadia', 'Canção', 'Lar', 'São Geraldo', 'Imperial', 'Mutumilk',
  'Perdigão', 'Uai', 'Aldente', 'Kicaldo', 'Guarani', 'Bulnez', 'Pramesa', 'Cisne', 'Junco', 'Único', 'Panco',
  'Porto Alegre', 'Trakinas', 'Renata', 'Triunfo', 'Moça', 'Ninho', 'Nestlé', 'Mucilon', 'Santa Edwiges',
  'Mucininho', 'Nescau', 'Nescafé', 'Elma Chips', 'Kerus', 'Cantina da Serra', 'Cereser', 'OQ', 'Aliança',
  'Pink Moon', 'Cliper', 'Itaipava', 'Amstel', 'Grapette', 'Antarctica', 'Búfalo', 'Comfort', 'Cif', 'Veja',
  'Harpic', 'Darling', 'Palmolive', 'Giovanna Baby', 'Lady', 'Dunlop', 'Celeste', 'Kerocopo', 'Vittamax', 'Alklin',
];

function separarMarcas(linha: string, lista: string[]): { nome: string; marcas: string[] } {
  let resto = ` ${linha} `;
  const marcas: string[] = [];
  for (const m of lista) {
    const re = new RegExp(`(?<=[\\s/])${m.replace(/ /g, '\\s+')}(?=[\\s/,])`, 'i');
    if (re.test(resto)) {
      marcas.push(m);
      resto = resto.replace(re, ' ');
    }
  }
  const nome = resto.replace(/[/,]/g, ' ').replace(/\s+/g, ' ').trim();
  return { nome, marcas };
}

{
  const pdf = ler('data/brutos/atacadao-ofertao-2026-11-17.json');
  for (const pg of pdf.paginas) {
    for (const it of pg.itens) {
      const linhas = String(it.descricao).split('\n').map((s: string) => s.trim()).filter(Boolean);
      const { nome, marcas } = separarMarcas(linhas[0], MARCAS_ATACADAO);
      const c = it.campos;
      const precos: Preco[] = [];
      const normal = reais(c.P);
      if (normal) precos.push({ valor: normal, exige: [] });
      const app = reais(c.PSEG);
      if (app) precos.push({ valor: app, exige: ['meu-atacadao'], condicao: 'ativando a oferta no app Meu Atacadão' });
      const cartao = reais(c.PTER);
      if (cartao)
        precos.push({
          valor: cartao,
          exige: ['meu-atacadao', 'cartao-atacadao'] as ProgramaId[],
          condicao: 'app Meu Atacadão + cartão Atacadão, Carrefour ou Sam’s Club',
        });
      const de = reais(c.D);
      adicionar({
        mercado: 'atacadao',
        encarte: 'atacadao-ofertao-2026-11-17',
        nome,
        marcas,
        original: linhas.join(' · '),
        textoTamanho: linhas.join(' '),
        precos,
        precoDe: de && normal && de > normal ? de : undefined,
        limite: c.QUNTOFERTAO ? 'limite por cliente: consulte no app' : undefined,
      });
    }
  }
}

// ---------------------------------------------------------------- Curadoria (lida de imagens)
interface ItemCuradoria {
  nome: string;
  marcas: string[];
  tamanho: string;
  preco: number;
  de?: number;
  clube?: number;
  app?: number;
  condicao?: string;
  limite?: string;
  produto?: string;
  pagina?: number;
}
interface ArquivoCuradoria {
  encarte: string;
  mercado: MercadoId;
  programaClube?: ProgramaId;
  nomeClube?: string;
  programaApp?: ProgramaId;
  itens: ItemCuradoria[];
}

for (const arq of readdirSync(join(RAIZ, 'data/curadoria')).filter((f) => f.endsWith('.json')).sort()) {
  const c = ler(`data/curadoria/${arq}`) as ArquivoCuradoria;
  for (const it of c.itens) {
    const precos: Preco[] = [{ valor: it.preco, exige: [], ...(it.condicao ? { condicao: it.condicao } : {}) }];
    if (it.clube && c.programaClube)
      precos.push({ valor: it.clube, exige: [c.programaClube], condicao: `no ${c.nomeClube ?? 'clube'}` });
    if (it.app && c.programaApp)
      precos.push({ valor: it.app, exige: [c.programaApp], condicao: 'ativando a oferta no app' });
    adicionar({
      mercado: c.mercado,
      encarte: c.encarte,
      nome: it.nome,
      marcas: it.marcas,
      original: `${it.nome} ${it.marcas.join(', ')} ${it.tamanho}`.replace(/\s+/g, ' ').trim(),
      textoTamanho: it.tamanho,
      precos,
      precoDe: it.de,
      limite: it.limite,
      produto: it.produto,
    });
  }
}

// ---------------------------------------------------------------- Saída
ofertas.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
writeFileSync(join(RAIZ, 'data/ofertas.json'), JSON.stringify(ofertas, null, 1) + '\n');

const porMercado = new Map<string, number>();
for (const o of ofertas) porMercado.set(o.mercado, (porMercado.get(o.mercado) ?? 0) + 1);
const produtos = new Map<string, Set<string>>();
for (const o of ofertas) {
  if (!produtos.has(o.produto)) produtos.set(o.produto, new Set());
  produtos.get(o.produto)!.add(o.mercado);
}
const emVarios = [...produtos].filter(([, m]) => m.size > 1);
console.log(`Ofertas: ${ofertas.length} (${[...porMercado].map(([m, n]) => `${m} ${n}`).join(', ')})`);
console.log(`Produtos: ${produtos.size}; em 2+ mercados: ${emVarios.length}`);
for (const [id, m] of emVarios) console.log(`  ${id}  [${[...m].join(', ')}]`);
if (process.argv.includes('--ids')) {
  const filtro = normalizar(process.argv[process.argv.indexOf('--ids') + 1] ?? '');
  for (const id of produtos.keys()) if (id.includes(filtro.replace(/ /g, '-'))) console.log('   ', id);
}
