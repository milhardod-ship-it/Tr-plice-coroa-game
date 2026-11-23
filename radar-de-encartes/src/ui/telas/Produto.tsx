import { useMemo, useState } from 'react';
import { PERFIL_VAZIO, fimDaOferta, melhorPreco } from '../../core/precos';
import { similaresMaisBaratos } from '../../core/produtos';
import { formatarPorMedida, formatarReais, formatarTamanho } from '../../core/texto';
import type { MercadoId, Oferta, Preco } from '../../core/tipos';
import { MAPA_ENCARTES, PROGRAMAS, nomeMercado } from '../../dados';
import { LinhaProduto, Voltar, dataCurta } from '../componentes';
import { useApp } from '../contexto';
import { Icone } from '../Icone';

export function Produto({ id }: { id: string }) {
  const { produtos, perfil, ofertas, lista, adicionar, mudarQuantidade, irPara } = useApp();
  const produto = produtos.get(id);
  const temApps = perfil.programas.length > 0;
  const [modo, setModo] = useState<'todos' | 'meus'>(temApps ? 'meus' : 'todos');
  const perfilUsado = modo === 'meus' ? perfil : PERFIL_VAZIO;

  const linhas = useMemo(() => {
    if (!produto) return [];
    const porMercado = new Map<MercadoId, { oferta: Oferta; preco: Preco }>();
    for (const o of produto.ofertas) {
      const preco = melhorPreco(o, perfilUsado);
      if (!preco) continue;
      const atual = porMercado.get(o.mercado);
      if (!atual || preco.valor < atual.preco.valor) porMercado.set(o.mercado, { oferta: o, preco });
    }
    return [...porMercado.values()].sort((a, b) => a.preco.valor - b.preco.valor);
  }, [produto, perfilUsado]);

  const similares = useMemo(
    () => (produto ? similaresMaisBaratos(produto, produtos.values(), perfilUsado) : []),
    [produto, produtos, perfilUsado],
  );

  const mercadosSemOferta = useMemo(() => {
    const ativos = new Set(ofertas.map((o) => o.mercado));
    for (const l of linhas) ativos.delete(l.oferta.mercado);
    return [...ativos].map(nomeMercado);
  }, [ofertas, linhas]);

  if (!produto) {
    return (
      <>
        <div className="linha">
          <Voltar />
        </div>
        <div className="vazio">
          <p>Esta oferta não está mais valendo.</p>
        </div>
      </>
    );
  }

  const naLista = lista.find((i) => i.produto === id);
  const menor = linhas[0]?.preco.valor;

  return (
    <>
      <div className="linha">
        <Voltar />
        <span className="apoio" style={{ fontWeight: 600, fontSize: 15 }}>Comparar preços</span>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 className="titulo-tela" style={{ fontSize: 22, lineHeight: 1.2 }}>{produto.nome}</h1>
        <p className="subtitulo">
          {[produto.marca, formatarTamanho(produto.tamanho, produto.porKg), produto.categoria].filter(Boolean).join(' · ')}
        </p>
      </header>

      <div>
        <div className="segmentado" role="group" aria-label="Qual preço mostrar">
          <button aria-pressed={modo === 'todos'} onClick={() => setModo('todos')}>Preço para todos</button>
          <button aria-pressed={modo === 'meus'} onClick={() => setModo('meus')}>Com meus apps</button>
        </div>
        <p className="apoio" style={{ marginTop: 8 }}>
          {modo === 'todos' ? (
            'O que qualquer pessoa paga no caixa, sem app nem cartão.'
          ) : temApps ? (
            `Usando o que você marcou: ${perfil.programas.map((p) => PROGRAMAS[p].nome).join(', ')}.`
          ) : (
            <>
              Você ainda não marcou nenhum app ou cartão.{' '}
              <button className="filtro" style={{ height: 32 }} onClick={() => irPara('perfil')}>Marcar no perfil</button>
            </>
          )}
        </p>
      </div>

      <section className="secao">
        {linhas.map(({ oferta, preco }) => {
          const melhor = preco.valor === menor && linhas.length > 1;
          const extras = oferta.precos.filter((p) => p.valor < preco.valor - 0.001);
          const enc = MAPA_ENCARTES.get(oferta.encarte);
          return (
            <article
              key={oferta.id}
              className="cartao"
              style={{ display: 'flex', flexDirection: 'column', gap: 6, border: melhor ? '2px solid var(--verde)' : undefined }}
            >
              <div className="linha">
                <span className="cresce" style={{ fontSize: 16, fontWeight: 700 }}>{nomeMercado(oferta.mercado)}</span>
                {melhor && <span className="chip melhor">Mais barato</span>}
              </div>
              {oferta.precoDe && <span className="preco-de">de {formatarReais(oferta.precoDe)}</span>}
              <div className="linha" style={{ alignItems: 'baseline' }}>
                <span className="numero" style={{ fontSize: 28 }}>{formatarReais(preco.valor)}</span>
                <span className="apoio" style={{ fontSize: 14 }}>{formatarPorMedida(preco.valor, oferta.tamanho)}</span>
              </div>
              {preco.condicao && <span className="chip app" style={{ alignSelf: 'flex-start' }}>{preco.condicao}</span>}
              {extras.map((p, i) => (
                <span key={i} className="apoio">
                  {formatarReais(p.valor)} {p.condicao ?? `com ${p.exige.map((x) => PROGRAMAS[x].nome).join(' + ')}`}
                </span>
              ))}
              <span className="apoio">
                {enc?.titulo} · até {dataCurta(fimDaOferta(oferta, MAPA_ENCARTES))}
                {enc && enc.lojas.length > 0 ? ` · ${enc.lojas.length} lojas` : ''}
              </span>
              {oferta.limite && <span className="apoio">{oferta.limite}</span>}
              <span className="apoio" style={{ fontSize: 12 }}>No encarte: “{oferta.original}”</span>
            </article>
          );
        })}
        {mercadosSemOferta.length > 0 && (
          <p className="apoio">Não está no encarte de: {mercadosSemOferta.join(', ')}.</p>
        )}
      </section>

      {similares.length > 0 && (
        <section className="secao">
          <h2>Parecido e mais barato</h2>
          {similares.map((p) => (
            <LinhaProduto key={p.id} produto={p} />
          ))}
        </section>
      )}

      {naLista ? (
        <div className="cartao linha">
          <Icone nome="check" />
          <span className="cresce" style={{ fontWeight: 600 }}>Na sua lista</span>
          <div className="quantidade">
            <button aria-label="Diminuir" onClick={() => mudarQuantidade(id, -1)}>−</button>
            <span>{naLista.quantidade}</span>
            <button aria-label="Aumentar" onClick={() => mudarQuantidade(id, 1)}>+</button>
          </div>
        </div>
      ) : (
        <button className="botao primario bloco" onClick={() => adicionar(produto)}>
          <Icone nome="mais" grosso /> Adicionar à lista
        </button>
      )}

      <p className="apoio" style={{ fontSize: 12 }}>
        Preços tirados dos encartes oficiais. Valem enquanto durarem os estoques; confira na loja. Dados ainda não revisados.
      </p>
    </>
  );
}
