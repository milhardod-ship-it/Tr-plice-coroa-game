// Importa os encartes (coletas do robô + dados manuais) para data/ofertas.json e data/encartes.json.
// Rode com: npm run importar  (o build já roda)
//
// Fontes em data/brutos/:
//  - guanabara-site-<início>.json  coletado pelo robô (npm run coletar) do site do Guanabara
//  - mundial-site-<data>.json      coletado pelo robô do site do Mundial (só o mais recente vale)
//  - atacadao-ofertao-*.json       dados embutidos no PDF do Atacadão (manual, por enquanto)
// E em data/curadoria/: ofertas lidas de imagem (ex.: Boa do Dia do Atacadão).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ColetaGuanabara } from '../src/coleta/guanabara';
import type { ColetaMundial } from '../src/coleta/mundial';
import { idProduto, unificarProdutos } from '../src/core/canonico';
import { categorizar } from '../src/core/categorias';
import { MARCAS_CONHECIDAS, limparNome, separarMarca } from '../src/core/marcas';
import { extrairTamanho } from '../src/core/texto';
import type { Encarte, MercadoId, Oferta, Preco, ProgramaId } from '../src/core/tipos';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (rel: string) => JSON.parse(readFileSync(join(RAIZ, rel), 'utf8'));
const brutos = readdirSync(join(RAIZ, 'data/brutos')).sort();

let ofertas: Oferta[] = [];
const encartes: Encarte[] = ler('data/encartes-manuais.json');
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
  imagem?: string;
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
      categoria: categorizar(`${base.nome} ${base.original}`),
      tamanho,
      porKg,
      precos: base.precos,
      ...(base.precoDe ? { precoDe: base.precoDe } : {}),
      ...(base.fim ? { fim: base.fim } : {}),
      ...(base.limite ? { limite: base.limite } : {}),
      ...(base.imagem ? { imagem: base.imagem } : {}),
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
  return new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

const marcasConhecidas = new Set<string>(MARCAS_CONHECIDAS);

// ---------------------------------------------------------------- Mundial (robô; só a coleta mais recente)
{
  const arquivo = brutos.filter((f) => f.startsWith('mundial-site-')).pop();
  if (arquivo) {
    const c = ler(`data/brutos/${arquivo}`) as ColetaMundial;
    const idEncarte = arquivo.replace('.json', '');
    const fins: string[] = [];
    for (const o of c.ofertas as any[]) {
      const p = o.product;
      if (p.customBrand) marcasConhecidas.add(capitalizar(p.customBrand));
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
      const fim = dataLocal(o.unpublishedIn);
      fins.push(fim);
      adicionar({
        mercado: 'mundial',
        encarte: idEncarte,
        nome: nomeBase.trim(),
        marcas: [marca],
        original: [p.customName, p.customBrand, p.customType, p.customWeight, p.customDetail].filter(Boolean).join(' ').replace(/\s+/g, ' '),
        textoTamanho,
        precos,
        fim,
        imagem: p.images?.[0]?.url,
      });
    }
    const inicios = c.encartes.map((e) => dataLocal(e.publicadoEm)).sort();
    encartes.push({
      id: idEncarte,
      mercado: 'mundial',
      titulo: c.encartes.map((e) => e.descricao.replace(/^Encarte - /, '')).join(' + ') || 'Ofertas do site',
      inicio: inicios[0] ?? c.coletadoEm.slice(0, 10),
      fim: fins.sort().pop() ?? c.coletadoEm.slice(0, 10),
      lojas: [],
      fonte: `site do Mundial (robô, ${c.coletadoEm.slice(0, 10)})`,
    });
  }
}

// ---------------------------------------------------------------- Atacadão (dados embutidos no PDF)
const MARCAS_ATACADAO = [
  'Copacol', 'Aurora', 'Frimesa', 'Friboi', 'Sadia', 'Canção', 'Lar', 'São Geraldo', 'Imperial', 'Mutumilk',
  'Perdigão', 'Uai', 'Aldente', 'Kicaldo', 'Guarani', 'Bulnez', 'Pramesa', 'Cisne', 'Junco', 'Único', 'Panco',
  'Porto Alegre', 'Trakinas', 'Renata', 'Triunfo', 'Moça', 'Ninho', 'Nestlé', 'Mucilon', 'Santa Edwiges',
  'Mucininho', 'Nescau', 'Nescafé', 'Elma Chips', 'Kerus', 'Cantina da Serra', 'Cereser', 'OQ', 'Aliança',
  'Pink Moon', 'Cliper', 'Itaipava', 'Amstel', 'Grapette', 'Antarctica', 'Búfalo', 'Comfort', 'Cif', 'Veja',
  'Harpic', 'Darling', 'Palmolive', 'Giovanna Baby', 'Lady', 'Dunlop', 'Celeste', 'Kerocopo', 'Vittamax', 'Alklin',
];
for (const m of MARCAS_ATACADAO) marcasConhecidas.add(m);

function separarMarcasAtacadao(linha: string): { nome: string; marcas: string[] } {
  let resto = ` ${linha} `;
  const marcas: string[] = [];
  for (const m of MARCAS_ATACADAO) {
    const re = new RegExp(`(?<=[\\s/])${m.replace(/ /g, '\\s+')}(?=[\\s/,])`, 'i');
    if (re.test(resto)) {
      marcas.push(m);
      resto = resto.replace(re, ' ');
    }
  }
  return { nome: resto.replace(/[/,]/g, ' ').replace(/\s+/g, ' ').trim(), marcas };
}

for (const arquivo of brutos.filter((f) => f.startsWith('atacadao-ofertao-'))) {
  const pdf = ler(`data/brutos/${arquivo}`);
  const idEncarte = arquivo.replace('.json', '');
  for (const pg of pdf.paginas) {
    for (const it of pg.itens) {
      const linhas = String(it.descricao).split('\n').map((s: string) => s.trim()).filter(Boolean);
      const { nome, marcas } = separarMarcasAtacadao(linhas[0]);
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
        encarte: idEncarte,
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

// ---------------------------------------------------------------- Guanabara (robô; encartes das últimas 2 semanas)
{
  const coletas = brutos
    .filter((f) => f.startsWith('guanabara-site-'))
    .map((f) => ({ arquivo: f, c: ler(`data/brutos/${f}`) as ColetaGuanabara }));
  const maisRecente = coletas.map((x) => x.c.fim).sort().pop();
  const limite = maisRecente ? new Date(new Date(maisRecente).getTime() - 14 * 86400000).toISOString().slice(0, 10) : '';
  const listaMarcas = [...marcasConhecidas];
  for (const { arquivo, c } of coletas) {
    if (c.fim < limite) continue;
    const idEncarte = arquivo.replace('.json', '');
    encartes.push({
      id: idEncarte,
      mercado: 'guanabara',
      titulo: 'Encarte Guanabara',
      inicio: c.inicio,
      fim: c.fim,
      lojas: [],
      fonte: `site do Guanabara (robô, ${c.coletadoEm.slice(0, 10)})`,
    });
    for (const it of c.itens) {
      const preco = reais(it.preco);
      if (!preco) continue;
      const { marca, nome } = separarMarca(it.nome, listaMarcas);
      const obs = it.nome.match(/\(([^)]*)\)/)?.[1]?.trim();
      adicionar({
        mercado: 'guanabara',
        encarte: idEncarte,
        nome: limparNome(nome) || nome,
        marcas: marca ? [marca] : [],
        original: it.nome,
        textoTamanho: it.nome,
        precos: [{ valor: preco, exige: [], ...(obs && !/^pe[çc]a$/i.test(obs) ? { condicao: obs.replace(/^Exc\.?:?\s*/i, 'exceto ') } : {}) }],
        imagem: it.imagem ?? undefined,
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

// ---------------------------------------------------------------- Junta o mesmo produto escrito de jeitos diferentes
const antes = new Set(ofertas.map((o) => o.produto)).size;
ofertas = unificarProdutos(ofertas);
const depois = new Set(ofertas.map((o) => o.produto)).size;

// ---------------------------------------------------------------- Saída
ofertas.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
writeFileSync(join(RAIZ, 'data/ofertas.json'), JSON.stringify(ofertas, null, 1) + '\n');
encartes.sort((a, b) => a.mercado.localeCompare(b.mercado) || a.inicio.localeCompare(b.inicio));
writeFileSync(join(RAIZ, 'data/encartes.json'), JSON.stringify(encartes, null, 1) + '\n');

const porMercado = new Map<string, number>();
for (const o of ofertas) porMercado.set(o.mercado, (porMercado.get(o.mercado) ?? 0) + 1);
const produtos = new Map<string, Set<string>>();
for (const o of ofertas) {
  if (!produtos.has(o.produto)) produtos.set(o.produto, new Set());
  produtos.get(o.produto)!.add(o.mercado);
}
const emVarios = [...produtos].filter(([, m]) => m.size > 1);
console.log(`Ofertas: ${ofertas.length} (${[...porMercado].map(([m, n]) => `${m} ${n}`).join(', ')})`);
console.log(`Encartes: ${encartes.map((e) => `${e.id} [${e.inicio}..${e.fim}]`).join(', ')}`);
console.log(`Produtos: ${depois} (unificados ${antes - depois}); em 2+ mercados: ${emVarios.length}`);
if (process.argv.includes('--comparaveis')) for (const [id, m] of emVarios) console.log(`  ${id}  [${[...m].join(', ')}]`);
