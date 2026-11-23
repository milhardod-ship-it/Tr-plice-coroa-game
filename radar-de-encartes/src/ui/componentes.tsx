import { melhorPreco, menorPrecoPossivel } from '../core/precos';
import { mercadosDistintos, type Produto } from '../core/produtos';
import { formatarPorMedida, formatarReais, formatarTamanho } from '../core/texto';
import type { Oferta, Perfil } from '../core/tipos';
import { nomeMercado } from '../dados';
import { useApp } from './contexto';
import { Icone } from './Icone';

/** Melhor oferta do produto para o perfil (e o mercado dela). */
export function melhorOfertaDoProduto(p: Produto, perfil: Perfil): { oferta: Oferta; valor: number; comApp: boolean } | null {
  let melhor: { oferta: Oferta; valor: number; comApp: boolean } | null = null;
  for (const o of p.ofertas) {
    const preco = melhorPreco(o, perfil);
    if (preco && (!melhor || preco.valor < melhor.valor)) melhor = { oferta: o, valor: preco.valor, comApp: preco.exige.length > 0 };
  }
  return melhor;
}

export function descricaoCurta(p: Pick<Produto, 'marca' | 'tamanho' | 'porKg'>): string {
  return [p.marca, formatarTamanho(p.tamanho, p.porKg)].filter(Boolean).join(' · ');
}

/** Linha de produto em listas e resultados de busca. */
export function LinhaProduto({ produto }: { produto: Produto }) {
  const { perfil, abrirProduto } = useApp();
  const melhor = melhorOfertaDoProduto(produto, perfil);
  const n = mercadosDistintos(produto);
  const menorComApp = Math.min(...produto.ofertas.map((o) => menorPrecoPossivel(o)?.valor ?? Infinity));
  return (
    <button className="cartao linha" onClick={() => abrirProduto(produto.id)}>
      <span className="cresce" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontWeight: 600 }}>{produto.nome}</span>
        <span className="apoio">{descricaoCurta(produto)}</span>
        {n > 1 && <span className="chip" style={{ alignSelf: 'flex-start' }}>compare em {n} mercados</span>}
      </span>
      {melhor && (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <span className="numero" style={{ fontSize: 17 }}>{formatarReais(melhor.valor)}</span>
          <span className="apoio" style={{ fontSize: 12 }}>{formatarPorMedida(melhor.valor, produto.tamanho)}</span>
          <span className={melhor.comApp ? 'chip app' : 'chip neutro'}>
            {nomeMercado(melhor.oferta.mercado)}
            {melhor.comApp ? ' · app' : ''}
          </span>
          {!melhor.comApp && menorComApp < melhor.valor - 0.001 && (
            <span className="apoio" style={{ fontSize: 12 }}>{formatarReais(menorComApp)} com app</span>
          )}
        </span>
      )}
    </button>
  );
}

/** Cartão compacto para grades (Só hoje, descontos). */
export function CartaoOferta({ oferta, valor, destaque }: { oferta: Oferta; valor: number; destaque?: string }) {
  const { abrirProduto } = useApp();
  return (
    <button className="cartao" onClick={() => abrirProduto(oferta.produto)} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {destaque && <span className="chip desconto" style={{ alignSelf: 'flex-start' }}>{destaque}</span>}
      <span style={{ fontWeight: 600, lineHeight: 1.3 }}>{oferta.nome}</span>
      <span className="apoio" style={{ fontSize: 12 }}>{descricaoCurta(oferta)}</span>
      {oferta.precoDe && <span className="preco-de">{formatarReais(oferta.precoDe)}</span>}
      <span className="numero" style={{ fontSize: 22, lineHeight: 1.1 }}>{formatarReais(valor)}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--verde-escuro)' }}>{nomeMercado(oferta.mercado)}</span>
    </button>
  );
}

export function Voltar({ rotulo = 'Voltar' }: { rotulo?: string }) {
  const { fecharProduto } = useApp();
  return (
    <button className="botao-icone" aria-label={rotulo} onClick={fecharProduto}>
      <Icone nome="voltar" />
    </button>
  );
}

export function dataCurta(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}
