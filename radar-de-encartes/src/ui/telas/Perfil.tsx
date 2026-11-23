import { MERCADOS, TODAS_OFERTAS } from '../../dados';
import type { MercadoId } from '../../core/tipos';
import { useApp } from '../contexto';
import { Icone } from '../Icone';

const COM_PROGRAMAS: MercadoId[] = ['guanabara', 'mundial', 'atacadao'];

export function Perfil() {
  const { perfil, alternarPrograma, hoje } = useApp();
  return (
    <>
      <h1 className="titulo-tela">Perfil</h1>

      <section className="secao">
        <h2>Quais destes você tem?</h2>
        <p className="apoio">
          Os mercados dão preços menores para quem usa o app ou o cartão deles. Marque os que você tem e o radar passa a
          comparar pelo preço que <strong>você</strong> paga. Nada é enviado para fora do seu celular.
        </p>
        {COM_PROGRAMAS.map((m) => (
          <div key={m} className="cartao" style={{ padding: 0 }}>
            <p style={{ padding: '12px 14px 0', fontWeight: 700 }}>{MERCADOS[m].nome}</p>
            {MERCADOS[m].programas.map((p) => (
              <label key={p.id} className="opcao">
                <input type="checkbox" checked={perfil.programas.includes(p.id)} onChange={() => alternarPrograma(p.id)} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>{p.nome}</span>
                  <span className="apoio">{p.descricao}</span>
                </span>
              </label>
            ))}
          </div>
        ))}
      </section>

      <section className="secao">
        <h2>Sua região</h2>
        <div className="cartao linha">
          <Icone nome="local" />
          <span className="cresce apoio">Em breve: informe seu bairro para ver só as lojas perto de você e a distância de cada uma.</span>
        </div>
      </section>

      <section className="secao">
        <h2>Sobre esta versão</h2>
        <p className="apoio">
          Versão de teste com {TODAS_OFERTAS.length} ofertas de Guanabara, Mundial e Atacadão (encartes de 17/11 a 02/12/2026).
          Os dados foram extraídos automaticamente e ainda não foram revisados. Data usada: {hoje.split('-').reverse().join('/')}.
        </p>
      </section>
    </>
  );
}
