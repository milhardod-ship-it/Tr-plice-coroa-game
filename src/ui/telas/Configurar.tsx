import { useState } from 'react';
import type { Estilo, Modo } from '../../core/draft';
import { LISTA_FORMACOES, type FormacaoId } from '../../core/formacoes';
import { CLUBES } from '../../dados';
import { Campo } from '../componentes/Campo';
import { Faixa } from '../componentes/Faixa';
import { clubePorId, varsClube } from '../util';

export interface Escolhas {
  clubeId: string;
  modo: Modo;
  formacao: FormacaoId;
  estilo: Estilo;
}

const ESTILOS: { id: Estilo; nome: string; desc: string }[] = [
  { id: 'defensivo', nome: 'Defensivo', desc: 'Fecha a casinha' },
  { id: 'equilibrado', nome: 'Equilibrado', desc: 'Meio a meio' },
  { id: 'ofensivo', nome: 'Ofensivo', desc: 'Pra cima deles' },
];

export function Configurar({
  inicial, comecar, voltar,
}: { inicial?: Partial<Escolhas>; comecar: (e: Escolhas) => void; voltar: () => void }) {
  const [passo, setPasso] = useState<1 | 2 | 3>(inicial?.clubeId ? 2 : 1);
  const [clubeId, setClubeId] = useState(inicial?.clubeId ?? '');
  const [modo, setModo] = useState<Modo>(inicial?.modo ?? 'classico');
  const [formacao, setFormacao] = useState<FormacaoId>(inicial?.formacao ?? '4-3-3');
  const [estilo, setEstilo] = useState<Estilo>(inicial?.estilo ?? 'equilibrado');

  const anterior = () => (passo === 1 ? voltar() : setPasso((passo - 1) as 1 | 2));
  const clube = clubeId ? clubePorId(clubeId) : null;

  return (
    <div className="tela" style={clube ? varsClube(clube) : undefined}>
      <div className="barra-passos">
        <button className="voltar" onClick={anterior}>‹ Voltar</button>
        <span className="passos">{[1, 2, 3].map((p) => <i key={p} className={p <= passo ? 'on' : ''} />)}</span>
      </div>

      {passo === 1 && (
        <>
          <h2 className="titulo-tela">Qual é o seu clube de coração?</h2>
          <div className="grade">
            {CLUBES.map((c) => {
              const vazio = c.temporadas.length === 0;
              return (
                <button
                  key={c.id}
                  className={`cartao-clube ${clubeId === c.id ? 'sel' : ''}`}
                  disabled={vazio}
                  onClick={() => { setClubeId(c.id); setPasso(2); }}
                >
                  <Faixa clube={c} />
                  <strong>{c.nome}</strong>
                  <small>{vazio ? 'em breve' : `${c.temporadas.length} temporadas`}</small>
                </button>
              );
            })}
          </div>
        </>
      )}

      {passo === 2 && clube && (
        <>
          <h2 className="titulo-tela"><Faixa clube={clube} /> Modo de jogo</h2>
          <div className="opcoes">
            <button className={`opcao ${modo === 'classico' ? 'sel' : ''}`} onClick={() => { setModo('classico'); setPasso(3); }}>
              <strong>Clássico</strong>
              <span>Notas e raridades visíveis. 3 re-sorteios.</span>
            </button>
            <button className={`opcao ${modo === 'almanaque' ? 'sel' : ''}`} onClick={() => { setModo('almanaque'); setPasso(3); }}>
              <strong>Almanaque</strong>
              <span>Notas ocultas: vale o que você lembra de cada time. 1 re-sorteio. O time é revelado no fim.</span>
            </button>
          </div>
        </>
      )}

      {passo === 3 && clube && (
        <>
          <h2 className="titulo-tela">Formação e estilo</h2>
          <div className="formacoes">
            {LISTA_FORMACOES.map((f) => (
              <button key={f.id} className={`opcao-formacao ${formacao === f.id ? 'sel' : ''}`} onClick={() => setFormacao(f.id)}>
                <Campo formacao={f.id} pequeno itens={f.vagas.map(() => ({ topo: '' }))} />
                <strong>{f.id}</strong>
              </button>
            ))}
          </div>
          <div className="estilos">
            {ESTILOS.map((s) => (
              <button key={s.id} className={estilo === s.id ? 'sel' : ''} onClick={() => setEstilo(s.id)}>
                <strong>{s.nome}</strong>
                <small>{s.desc}</small>
              </button>
            ))}
          </div>
          <button className="botao-grande primario" onClick={() => comecar({ clubeId, modo, formacao, estilo })}>
            Começar o draft
          </button>
        </>
      )}
    </div>
  );
}
