import { describe, expect, it } from 'vitest';
import { idProduto } from '../src/core/canonico';
import { categorizar } from '../src/core/categorias';
import { calcularLista } from '../src/core/lista';
import { descontoPercentual, ehSoHoje, estaValida, melhorPreco, precoParaTodos } from '../src/core/precos';
import { agruparProdutos, buscar, similaresMaisBaratos } from '../src/core/produtos';
import { extrairTamanho, formatarPorMedida, formatarReais } from '../src/core/texto';
import type { Encarte, MercadoId, Oferta, Perfil } from '../src/core/tipos';

describe('extrairTamanho', () => {
  it.each([
    ['Pacote com 5kg', 5000, 'g', false],
    ['5 kg', 5000, 'g', false],
    ['Lata com 1,7kg', 1700, 'g', false],
    ['Pack com 4x85g', 340, 'g', false],
    ['Caixeta com 36x56g', 2016, 'g', false],
    ['TP 1 L', 1000, 'ml', false],
    ['2,25L', 2250, 'ml', false],
    ['2 Litros', 2000, 'ml', false],
    ['Pet com 750ml', 750, 'ml', false],
    ['Bandeja com 30 unidades', 30, 'un', false],
    ['c/20 Unids.', 20, 'un', false],
    ['Quilo', 1000, 'g', true],
    ['Preço por quilo na peça', 1000, 'g', true],
  ])('%s', (texto, valor, unidade, porKg) => {
    const r = extrairTamanho(texto);
    expect(r.tamanho).toEqual({ valor, unidade });
    expect(r.porKg).toBe(porKg);
  });

  it('sem tamanho', () => {
    expect(extrairTamanho('Pneu Dunlop 175/65 R14').tamanho).toBeNull();
  });
});

describe('formatação', () => {
  it('reais e preço por medida', () => {
    expect(formatarReais(27.95)).toBe('R$ 27,95');
    expect(formatarPorMedida(27.95, { valor: 5000, unidade: 'g' })).toBe('R$ 5,59/kg');
    expect(formatarPorMedida(15.9, { valor: 30, unidade: 'un' })).toBe('R$ 0,53/un');
  });
});

describe('idProduto', () => {
  it('ignora embalagem e conectivos; porKg vira 1000g', () => {
    expect(idProduto('Arroz Parboilizado', 'Tio João', { valor: 5000, unidade: 'g' }, false)).toBe(
      'arroz-parboilizado__tio-joao__5000g',
    );
    expect(idProduto('Filé de Peito de Frango', 'Sadia', { valor: 1000, unidade: 'g' }, true)).toBe(
      idProduto('Filé de Peito de Frango', 'Sadia', { valor: 1000, unidade: 'g' }, false),
    );
  });
});

describe('categorizar', () => {
  it.each([
    ['Macarrão de Sêmola Aldente', 'Mercearia'],
    ['Suco de Uva Integral', 'Bebidas'],
    ['Maçã', 'Hortifrúti'],
    ['Filé de Peito de Frango Congelado', 'Açougue'],
    ['Kit Desengordurante Veja Limão', 'Limpeza'],
    ['Salgadinho Batata Ruffles', 'Mercearia'],
    ['Lasanha Bolonhesa', 'Congelados'],
  ])('%s → %s', (t, c) => expect(categorizar(t)).toBe(c));
});

// ---------------------------------------------------------------- dados de teste
const ENCARTES = new Map<string, Encarte>([
  ['g', { id: 'g', mercado: 'guanabara', titulo: '', inicio: '2026-11-18', fim: '2026-11-23', lojas: [], fonte: '' }],
  ['a', { id: 'a', mercado: 'atacadao', titulo: '', inicio: '2026-11-17', fim: '2026-11-23', lojas: [], fonte: '' }],
  ['d', { id: 'd', mercado: 'atacadao', titulo: '', inicio: '2026-11-23', fim: '2026-11-23', lojas: [], fonte: '' }],
  ['m', { id: 'm', mercado: 'mundial', titulo: '', inicio: '2026-11-19', fim: '2026-12-02', lojas: [], fonte: '' }],
]);

let n = 0;
function oferta(mercado: MercadoId, produto: string, normal: number, extra: Partial<Oferta> = {}): Oferta {
  const encarte = mercado === 'guanabara' ? 'g' : mercado === 'atacadao' ? 'a' : 'm';
  return {
    id: `t${++n}`,
    mercado,
    encarte,
    produto,
    nome: produto,
    marca: 'X',
    original: produto,
    categoria: 'Mercearia',
    tamanho: { valor: 1000, unidade: 'g' },
    porKg: false,
    precos: [{ valor: normal, exige: [] }],
    revisado: false,
    ...extra,
  };
}

const TODOS: Perfil = { programas: [] };
const COM_APP: Perfil = { programas: ['meu-atacadao', 'cartao-atacadao'] };

describe('preços e validade', () => {
  const o = oferta('atacadao', 'feijao', 7.15, {
    precos: [
      { valor: 7.15, exige: [] },
      { valor: 6.99, exige: ['meu-atacadao'] },
      { valor: 6.49, exige: ['meu-atacadao', 'cartao-atacadao'] },
    ],
    precoDe: 7.45,
  });

  it('cada perfil paga o menor preço que consegue', () => {
    expect(precoParaTodos(o)?.valor).toBe(7.15);
    expect(melhorPreco(o, TODOS)?.valor).toBe(7.15);
    expect(melhorPreco(o, { programas: ['meu-atacadao'] })?.valor).toBe(6.99);
    expect(melhorPreco(o, COM_APP)?.valor).toBe(6.49);
    // só o cartão, sem o app: não consegue o preço de app + cartão
    expect(melhorPreco(o, { programas: ['cartao-atacadao'] })?.valor).toBe(7.15);
  });

  it('desconto pelo preço para todos', () => {
    expect(descontoPercentual(o)).toBe(4);
  });

  it('validade inclusiva e "só hoje"', () => {
    expect(estaValida(o, ENCARTES, '2026-11-23')).toBe(true);
    expect(estaValida(o, ENCARTES, '2026-11-24')).toBe(false);
    expect(estaValida(o, ENCARTES, '2026-11-16')).toBe(false);
    const doDia = { ...o, encarte: 'd' };
    expect(ehSoHoje(doDia, ENCARTES, '2026-11-23')).toBe(true);
    expect(ehSoHoje(o, ENCARTES, '2026-11-23')).toBe(false);
  });
});

describe('calcularLista', () => {
  const ofertas = [
    oferta('guanabara', 'arroz', 27.95),
    oferta('guanabara', 'feijao', 7.19),
    oferta('guanabara', 'acucar', 2.99),
    oferta('atacadao', 'feijao', 7.15, {
      precos: [
        { valor: 7.15, exige: [] },
        { valor: 6.49, exige: ['meu-atacadao', 'cartao-atacadao'] },
      ],
    }),
    oferta('atacadao', 'acucar', 3.19),
    oferta('mundial', 'arroz', 31.95),
    oferta('mundial', 'cafe', 18.9),
  ];

  it('totais por mercado e melhor mercado único', () => {
    const r = calcularLista(
      [
        { produto: 'arroz', quantidade: 1 },
        { produto: 'feijao', quantidade: 2 },
        { produto: 'acucar', quantidade: 1 },
      ],
      ofertas,
      TODOS,
    );
    expect(r.melhorUnico?.mercado).toBe('guanabara');
    expect(r.melhorUnico?.total).toBe(45.32); // 27,95 + 2×7,19 + 2,99
    expect(r.melhorUnico?.encontrados).toBe(3);
    const atacadao = r.porMercado.find((m) => m.mercado === 'atacadao')!;
    expect(atacadao.encontrados).toBe(2);
    expect(atacadao.faltando).toEqual(['arroz']);
    // Dividir economiza só 0,08 (feijão 2×0,04): não compensa.
    expect(r.melhorDivisao?.mercados.sort()).toEqual(['atacadao', 'guanabara']);
    expect(r.economiaDivisao).toBe(0.08);
    expect(r.compensaDividir).toBe(false);
  });

  it('com app + cartão a divisão muda e pode compensar com limite menor', () => {
    const itens = [
      { produto: 'arroz', quantidade: 1 },
      { produto: 'feijao', quantidade: 10 },
    ];
    const r = calcularLista(itens, ofertas, COM_APP, 5);
    expect(r.melhorDivisao?.onde).toEqual({ arroz: 'guanabara', feijao: 'atacadao' });
    expect(r.economiaDivisao).toBe(7); // 10 × (7,19 − 6,49)
    expect(r.compensaDividir).toBe(true);
  });

  it('divisão que encontra mais itens sempre compensa', () => {
    const r = calcularLista(
      [
        { produto: 'arroz', quantidade: 1 },
        { produto: 'cafe', quantidade: 1 },
        { produto: 'feijao', quantidade: 1 },
      ],
      ofertas,
      TODOS,
    );
    expect(r.melhorUnico?.encontrados).toBe(2);
    expect(r.melhorDivisao?.encontrados).toBe(3);
    expect(r.divisaoCobreMais).toBe(true);
    expect(r.compensaDividir).toBe(true);
  });

  it('item que nenhum mercado tem fica sem opções', () => {
    const r = calcularLista([{ produto: 'nada', quantidade: 1 }], ofertas, TODOS);
    expect(r.itens[0].opcoes).toEqual([]);
    expect(r.melhorUnico).toBeNull();
  });
});

describe('busca e similares', () => {
  const ofertas = [
    oferta('guanabara', 'arroz-tio', 27.95, { nome: 'Arroz Parboilizado', marca: 'Tio João', tamanho: { valor: 5000, unidade: 'g' } }),
    oferta('mundial', 'arroz-tio', 31.95, { nome: 'Arroz Parboilizado', marca: 'Tio João', tamanho: { valor: 5000, unidade: 'g' } }),
    oferta('guanabara', 'arroz-ouro', 17.95, { nome: 'Arroz', marca: 'Ouro Nobre', tamanho: { valor: 5000, unidade: 'g' } }),
    oferta('guanabara', 'feijao', 7.19, { nome: 'Feijão Preto', marca: 'Kicaldo' }),
  ];
  const produtos = agruparProdutos(ofertas);

  it('busca sem acento e por começo de palavra; mais mercados primeiro', () => {
    const r = buscar(produtos.values(), 'arroz', TODOS);
    expect(r.map((p) => p.id)).toEqual(['arroz-tio', 'arroz-ouro']);
    expect(buscar(produtos.values(), 'feij kical', TODOS).map((p) => p.id)).toEqual(['feijao']);
    expect(buscar(produtos.values(), 'FEIJÃO', TODOS)).toHaveLength(1);
  });

  it('similar mais barato por kg', () => {
    const s = similaresMaisBaratos(produtos.get('arroz-tio')!, produtos.values(), TODOS);
    expect(s.map((p) => p.id)).toEqual(['arroz-ouro']);
  });
});
