import { useMemo } from 'react';
import { ENCARTES, nomeMercado } from '../../dados';
import { dataCurta } from '../componentes';
import { useApp } from '../contexto';

export function Encartes() {
  const { hoje, ofertas } = useApp();
  const contagem = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of ofertas) m.set(o.encarte, (m.get(o.encarte) ?? 0) + 1);
    return m;
  }, [ofertas]);

  const validos = ENCARTES.filter((e) => e.inicio <= hoje && hoje <= e.fim);
  const outros = ENCARTES.filter((e) => !validos.includes(e));

  return (
    <>
      <h1 className="titulo-tela">Encartes</h1>
      <p className="subtitulo">De onde vêm os preços. Cada oferta no app aponta para o encarte original.</p>

      <section className="secao">
        <h2>Valendo hoje ({validos.length})</h2>
        {validos.length === 0 && <p className="apoio">Nenhum encarte válido hoje.</p>}
        {validos.map((e) => (
          <article key={e.id} className="cartao" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="linha">
              <span className="cresce" style={{ fontWeight: 700 }}>{nomeMercado(e.mercado)}</span>
              {e.inicio === e.fim && <span className="chip hoje">Só hoje</span>}
            </div>
            <span>{e.titulo}</span>
            <span className="apoio">
              {e.inicio === e.fim ? `Só ${dataCurta(e.inicio)}` : `${dataCurta(e.inicio)} a ${dataCurta(e.fim)}`} ·{' '}
              {contagem.get(e.id) ?? 0} ofertas valendo
            </span>
            <span className="apoio">Fonte: {e.fonte}</span>
            {e.lojas.length > 0 ? (
              <details>
                <summary className="apoio">Vale em {e.lojas.length} lojas</summary>
                <p className="apoio" style={{ marginTop: 6 }}>{e.lojas.join(' · ')}</p>
              </details>
            ) : (
              <span className="apoio">Vale em todas as lojas da rede no RJ (confirme na loja)</span>
            )}
          </article>
        ))}
      </section>

      {outros.length > 0 && (
        <section className="secao">
          <h2>Vencidos ou futuros</h2>
          {outros.map((e) => (
            <div key={e.id} className="cartao apoio">
              {nomeMercado(e.mercado)} · {e.titulo} · {dataCurta(e.inicio)} a {dataCurta(e.fim)}
            </div>
          ))}
        </section>
      )}

      <section className="secao">
        <h2>Ainda não incluídos</h2>
        <p className="apoio">Prezunic, Supermarket e Assaí entram assim que a coleta deles estiver pronta.</p>
      </section>
    </>
  );
}
