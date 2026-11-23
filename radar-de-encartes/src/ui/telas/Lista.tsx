import { useMemo, useState } from 'react';
import { calcularLista, type Opcao } from '../../core/lista';
import { mercadosDistintos } from '../../core/produtos';
import { formatarReais } from '../../core/texto';
import type { MercadoId, Perfil, ProgramaId } from '../../core/tipos';
import { PROGRAMAS, nomeMercado } from '../../dados';
import { useApp } from '../contexto';
import { Icone, Logo } from '../Icone';

const TODOS_PROGRAMAS: Perfil = { programas: Object.keys(PROGRAMAS) as ProgramaId[] };

export function Lista() {
  const { lista, ofertas, perfil, produtos, mudarQuantidade, remover, limparLista, irPara, abrirProduto, adicionar } = useApp();

  const [confirmarLimpar, setConfirmarLimpar] = useState(false);
  const r = useMemo(() => calcularLista(lista, ofertas, perfil), [lista, ofertas, perfil]);
  const comTudo = useMemo(() => calcularLista(lista, ofertas, TODOS_PROGRAMAS), [lista, ofertas]);

  const sugestoes = useMemo(
    () => [...produtos.values()].filter((p) => mercadosDistintos(p) > 1 && !lista.some((i) => i.produto === p.id)).slice(0, 8),
    [produtos, lista],
  );

  if (lista.length === 0) {
    return (
      <>
        <Cabecalho total={0} />
        <div className="vazio">
          <p>Sua lista está vazia. Busque produtos e toque em “Adicionar à lista”: o radar calcula onde a compra sai mais barata.</p>
          <button className="botao primario" onClick={() => irPara('buscar', { focarBusca: true })}>
            <Icone nome="buscar" /> Buscar produtos
          </button>
        </div>
        {sugestoes.length > 0 && <Sugestoes ids={sugestoes.map((p) => p.id)} />}
      </>
    );
  }

  const dividir = r.compensaDividir && r.melhorDivisao;
  const unico = r.melhorUnico;
  const n = lista.length;

  /** Onde comprar cada item no plano recomendado. */
  function opcaoEscolhida(opcoes: Opcao[], produto: string): Opcao | undefined {
    if (dividir) return opcoes.find((o) => o.mercado === r.melhorDivisao!.onde[produto]);
    return opcoes.find((o) => o.mercado === unico?.mercado) ?? opcoes[0];
  }

  const economiaComTudo =
    perfil.programas.length < TODOS_PROGRAMAS.programas.length && comTudo.melhorDivisao && r.melhorDivisao
      ? r.melhorDivisao.total - comTudo.melhorDivisao.total
      : 0;
  const maiorTotal = Math.max(...r.porMercado.map((m) => m.total), 1);

  return (
    <>
      <Cabecalho total={n} />

      {!unico ? (
        <div className="aviso">Nenhum item da sua lista está nos encartes válidos hoje.</div>
      ) : (
        <section className="destaque" aria-live="polite">
          <span className="rotulo">Melhor opção para sua lista</span>
          {dividir ? (
            <>
              <span style={{ fontSize: 18, fontWeight: 600 }}>
                Dividir: {r.melhorDivisao!.mercados.map(nomeMercado).join(' + ')}
              </span>
              <span className="valor">{formatarReais(r.melhorDivisao!.total)}</span>
              <span>
                {r.melhorDivisao!.encontrados} de {n} itens em oferta
              </span>
              <span className="nota">
                {r.divisaoCobreMais
                  ? `Assim você encontra ${r.melhorDivisao!.encontrados - unico.encontrados} item(ns) que o ${nomeMercado(unico.mercado)} não tem em oferta.`
                  : `Economia de ${formatarReais(r.economiaDivisao)} em relação a comprar tudo no ${nomeMercado(unico.mercado)}.`}
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 18, fontWeight: 600 }}>Tudo no {nomeMercado(unico.mercado)}</span>
              <span className="valor">{formatarReais(unico.total)}</span>
              <span>
                {unico.encontrados} de {n} itens em oferta
              </span>
              {r.melhorDivisao && r.melhorDivisao.mercados.length > 1 && r.economiaDivisao > 0 && (
                <span className="nota">
                  Dividir com o {nomeMercado(r.melhorDivisao.mercados.find((m) => m !== unico.mercado)!)} economiza só{' '}
                  {formatarReais(r.economiaDivisao)}. Não compensa a viagem.
                </span>
              )}
            </>
          )}
        </section>
      )}

      {economiaComTudo >= 1 && (
        <div className="aviso linha" style={{ alignItems: 'flex-start' }}>
          <Icone nome="cartao" />
          <span className="cresce">
            <strong>Com apps e cartões dos mercados</strong> sua lista cairia para {formatarReais(comTudo.melhorDivisao!.total)} (−
            {formatarReais(economiaComTudo)}).{' '}
            <button className="filtro" style={{ height: 32, marginTop: 6 }} onClick={() => irPara('perfil')}>
              Marcar os que eu tenho
            </button>
          </span>
        </div>
      )}

      {r.porMercado.length > 0 && (
        <section className="secao">
          <h2>Sua lista em cada mercado</h2>
          {r.porMercado.map((m) => (
            <div key={m.mercado} className="cartao" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="linha">
                <span className="cresce" style={{ fontWeight: 600 }}>{nomeMercado(m.mercado)}</span>
                <span className="numero">{formatarReais(m.total)}</span>
              </div>
              <div className="barra">
                <div className={m.mercado === unico?.mercado ? 'melhor' : ''} style={{ width: `${Math.max(4, (m.total / maiorTotal) * 100)}%` }} />
              </div>
              <span className="apoio">
                {m.encontrados} de {n} itens em oferta
                {m.faltando.length > 0 && m.faltando.length <= 3
                  ? ` · faltam ${m.faltando.map((id) => lista.find((i) => i.produto === id)?.rotulo).join(', ')}`
                  : m.faltando.length > 3
                    ? ` · faltam ${m.faltando.length}`
                    : ''}
              </span>
            </div>
          ))}
        </section>
      )}

      <section className="secao">
        <div className="linha">
          <h2 className="cresce" style={{ fontSize: 16 }}>Itens</h2>
          <button className="filtro" onClick={() => irPara('buscar', { focarBusca: true })}>+ Adicionar</button>
        </div>
        {r.itens.map(({ item, opcoes }) => {
          const salvo = lista.find((i) => i.produto === item.produto)!;
          const escolhida = opcaoEscolhida(opcoes, item.produto);
          const maisBarata = opcoes[0];
          return (
            <div key={item.produto} className="cartao" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="linha" style={{ alignItems: 'flex-start' }}>
                <button
                  className="cresce"
                  onClick={() => produtos.has(item.produto) && abrirProduto(item.produto)}
                  style={{ border: 'none', background: 'none', padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 3 }}
                >
                  <span style={{ fontWeight: 600 }}>{salvo.rotulo}</span>
                  {escolhida ? (
                    <span className="apoio">
                      {formatarReais(escolhida.preco.valor)} cada{escolhida.preco.exige.length ? ' (com app)' : ''}
                      {maisBarata && escolhida.mercado !== maisBarata.mercado
                        ? ` · ${nomeMercado(maisBarata.mercado)}: ${formatarReais(maisBarata.preco.valor)}`
                        : opcoes.length > 1
                          ? ` · mais barato que ${opcoes.slice(1).map((o) => nomeMercado(o.mercado)).join(', ')}`
                          : ''}
                    </span>
                  ) : (
                    <span className="apoio">Sem oferta nos encartes de hoje</span>
                  )}
                </button>
                {escolhida && (
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className="numero">{formatarReais(escolhida.subtotal)}</span>
                    <span className="chip">{nomeMercado(escolhida.mercado as MercadoId)}</span>
                  </span>
                )}
              </div>
              <div className="linha">
                <div className="quantidade">
                  <button aria-label={`Diminuir ${salvo.rotulo}`} onClick={() => mudarQuantidade(item.produto, -1)}>−</button>
                  <span>{item.quantidade}</span>
                  <button aria-label={`Aumentar ${salvo.rotulo}`} onClick={() => mudarQuantidade(item.produto, 1)}>+</button>
                </div>
                <span className="cresce" />
                <button className="botao-icone" aria-label={`Remover ${salvo.rotulo}`} onClick={() => remover(item.produto)}>
                  <Icone nome="lixeira" tamanho={20} />
                </button>
              </div>
            </div>
          );
        })}
        {confirmarLimpar ? (
          <div className="cartao linha">
            <span className="cresce">Apagar todos os itens?</span>
            <button className="botao pequeno" onClick={() => setConfirmarLimpar(false)}>Cancelar</button>
            <button
              className="botao pequeno primario"
              onClick={() => {
                limparLista();
                setConfirmarLimpar(false);
              }}
            >
              Apagar
            </button>
          </div>
        ) : (
          <button className="botao bloco" onClick={() => setConfirmarLimpar(true)}>
            Limpar lista
          </button>
        )}
      </section>

      {sugestoes.length > 0 && <Sugestoes ids={sugestoes.slice(0, 4).map((p) => p.id)} />}
    </>
  );

  function Sugestoes({ ids }: { ids: string[] }) {
    return (
      <section className="secao">
        <h2>Sugestões para testar (estão em 2+ mercados)</h2>
        {ids.map((id) => {
          const p = produtos.get(id)!;
          return (
            <div key={id} className="cartao linha">
              <span className="cresce">
                {p.nome} <span className="apoio">{p.marca}</span>
              </span>
              <button className="botao pequeno" onClick={() => adicionar(p)}>
                <Icone nome="mais" tamanho={18} grosso /> Lista
              </button>
            </div>
          );
        })}
      </section>
    );
  }
}

function Cabecalho({ total }: { total: number }) {
  return (
    <header className="cabecalho">
      <Logo tamanho={34} />
      <div className="cresce">
        <h1 className="titulo-tela">Minha lista</h1>
        <p className="subtitulo">{total === 0 ? 'Monte sua lista de compras' : `${total} ${total === 1 ? 'item' : 'itens'} · encartes válidos hoje`}</p>
      </div>
    </header>
  );
}
