import { describe, expect, it } from 'vitest';
import { lerCategoriaGuanabara, lerValidadeGuanabara } from '../src/coleta/guanabara';
import { lerEncartesMundial, lerPageProps } from '../src/coleta/mundial';
import { unificarProdutos, idProduto } from '../src/core/canonico';
import { limparNome, separarMarca } from '../src/core/marcas';
import { extrairTamanho } from '../src/core/texto';
import type { Oferta } from '../src/core/tipos';

// Trecho real (simplificado) de https://www.supermercadosguanabara.com.br/produtos/12
const HTML_GUANABARA = `
<div class="col item">
  <div class="row">
    <div class="col image" style="background-image: url('//www.supermercadosguanabara.com.br:443/sites/default/files/acucar.png');">
      <div class="price"><div class="vertical-align"><span class="number">2,99</span> </div></div>
    </div>
    <div class="col text"><div class="vertical-align"><div class="name">Açúcar Guarani kg</div></div></div>
  </div>
</div>
<div class="col item">
  <div class="row">
    <div class="col image" style="background-image: url('//www.supermercadosguanabara.com.br:443/sites/default/files/aveia.png');">
      <div class="price"><div class="vertical-align"><span class="number">3,69</span> cada</div></div>
    </div>
    <div class="col text"><div class="vertical-align"><div class="name">Aveia em Flocos ou Flocos Finos Quaker 165g</div></div></div>
  </div>
</div>`;

describe('robô do Guanabara', () => {
  it('lê nome, preço, sufixo e foto de cada produto', () => {
    const itens = lerCategoriaGuanabara(HTML_GUANABARA, 'Matinais e padaria');
    expect(itens).toEqual([
      { categoria: 'Matinais e padaria', nome: 'Açúcar Guarani kg', preco: '2,99', sufixo: '', imagem: 'https://www.supermercadosguanabara.com.br/sites/default/files/acucar.png' },
      { categoria: 'Matinais e padaria', nome: 'Aveia em Flocos ou Flocos Finos Quaker 165g', preco: '3,69', sufixo: 'cada', imagem: 'https://www.supermercadosguanabara.com.br/sites/default/files/aveia.png' },
    ]);
  });

  it('lê a validade do encarte', () => {
    expect(lerValidadeGuanabara('<p>Promoção válida de 18/11/2026 até 23/11/2026, enquanto durarem nossos estoques.</p>')).toEqual({
      inicio: '2026-11-18',
      fim: '2026-11-23',
    });
    expect(lerValidadeGuanabara('<p>sem data</p>')).toBeNull();
  });
});

describe('robô do Mundial', () => {
  it('lê o __NEXT_DATA__ e os encartes', () => {
    const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: { pageProps: { encartes: [{ id: '61', description: 'Encarte - Ofertas 19.11 a 02.12.2026', file: { url: 'https://x/61.pdf' }, publishedIn: '2026-11-19T04:05:00.000Z', unpublishedIn: '2026-12-03T01:20:00.000Z' }] } },
    })}</script>`;
    expect(lerEncartesMundial(lerPageProps(html))).toEqual([
      { id: '61', descricao: 'Encarte - Ofertas 19.11 a 02.12.2026', pdf: 'https://x/61.pdf', publicadoEm: '2026-11-19T04:05:00.000Z', despublicadoEm: '2026-12-03T01:20:00.000Z' },
    ]);
  });

  it('avisa quando o site muda', () => {
    expect(() => lerPageProps('<html></html>')).toThrow(/mudou/);
  });
});

describe('marcas e nomes', () => {
  const marcas = ['Tio João', 'Andorinha', 'Andorinha Seleção', 'Hellmann\'s', 'Italac', 'Camil'];
  it.each([
    ['Arroz Camil 5kg', 'Camil', 'Arroz'],
    ['Azeite Extra Virgem Seleção Andorinha 500ml', 'Andorinha Seleção', 'Azeite Extra Virgem'],
    ['Maionese Hellmanns Trad. 500g', 'Hellmann\'s', 'Maionese Trad.'],
    ['Leite UHT Longa Vida Italac Integral TP Litro', 'Italac', 'Leite UHT Longa Vida Integral'],
    ['Feijão Preto Macio Kg', '', 'Feijão Preto Macio'],
  ])('%s', (texto, marca, nome) => {
    const r = separarMarca(texto, marcas);
    expect(r.marca).toBe(marca);
    expect(limparNome(r.nome)).toBe(nome);
  });

  it('pack e litro sem número', () => {
    expect(extrairTamanho('Cerveja Brahma 350ml Pack c/18 unidades').tamanho).toEqual({ valor: 6300, unidade: 'ml' });
    expect(extrairTamanho('Leite UHT Italac Integral TP Litro').tamanho).toEqual({ valor: 1000, unidade: 'ml' });
  });
});

describe('unificarProdutos', () => {
  function o(mercado: Oferta['mercado'], nome: string, marca: string, ml: number): Oferta {
    const tamanho = { valor: ml, unidade: 'ml' as const };
    return {
      id: `${mercado}-${nome}`, mercado, encarte: 'e', produto: idProduto(nome, marca, tamanho, false), nome, marca,
      original: nome, categoria: 'Mercearia', tamanho, porKg: false, precos: [{ valor: 1, exige: [] }], revisado: false,
    };
  }

  it('junta o mesmo produto escrito de jeitos diferentes em mercados diferentes', () => {
    const r = unificarProdutos([
      o('guanabara', 'Leite UHT Longa Vida Integral', 'Italac', 1000),
      o('atacadao', 'Leite Integral', 'Italac', 1000),
    ]);
    expect(r[0].produto).toBe(r[1].produto);
  });

  it('não junta variações diferentes nem produtos do mesmo mercado', () => {
    const r = unificarProdutos([
      o('guanabara', 'Leite UHT Integral', 'Italac', 1000),
      o('atacadao', 'Leite UHT Desnatado', 'Italac', 1000),
      o('mundial', 'Azeite Extravirgem', 'Andorinha', 500),
      o('mundial', 'Azeite Extravirgem Spray', 'Andorinha', 500),
    ]);
    expect(r[0].produto).not.toBe(r[1].produto);
    expect(r[2].produto).not.toBe(r[3].produto);
  });
});
