import { useEffect, useState } from 'react';

import { forcaGeral, type EstadoDraft } from '../../core/draft';
import { FORMACOES } from '../../core/formacoes';
import { encaixe, notaEfetiva } from '../../core/posicoes';
import { NOME_RARIDADE, raridade, type Raridade } from '../../core/raridade';
import { Campo, type ItemCampo } from '../componentes/Campo';
import { Faixa } from '../componentes/Faixa';
import { clubePorId, nomeCurto, varsClube } from '../util';

const INTERVALO = 320;
const ORDEM_RAR: Raridade[] = ['lenda', 'ouro', 'prata', 'bronze'];

/** Fim do draft: o time é revelado jogador a jogador (no Almanaque, é aqui que as notas aparecem). */
export function TimeCompleto({
  estado, disputar, novoMesmoClube, inicio,
}: { estado: EstadoDraft; disputar: () => void; novoMesmoClube: () => void; inicio: () => void }) {
  const clube = clubePorId(estado.clubeId);
  const vagas = FORMACOES[estado.formacao].vagas;
  const [revelados, setRevelados] = useState(0);
  const terminou = revelados >= vagas.length;

  useEffect(() => {
    if (terminou) return;
    const t = setTimeout(() => setRevelados((n) => n + 1), revelados === 0 ? 500 : INTERVALO);
    return () => clearTimeout(t);
  }, [revelados, terminou]);

  const itens: ItemCampo[] = vagas.map((p, i) => {
    const x = estado.escalacao[i]!;
    if (i >= revelados) return { topo: p, centro: '?', nome: nomeCurto(x.jogador.nome), classe: 'cheio escondido' };
    return {
      topo: p,
      centro: String(notaEfetiva(x.jogador, p)),
      nome: nomeCurto(x.jogador.nome),
      classe: `cheio r-${raridade(x.jogador.nota)} revelado`,
    };
  });

  const contagem = ORDEM_RAR.map((r) => ({ r, n: estado.escalacao.filter((x) => raridade(x!.jogador.nota) === r).length }))
    .filter((c) => c.n > 0);

  return (
    <div className="tela time-completo" style={varsClube(clube)}>
      <div className="cab-time">
        <Faixa clube={clube} grande />
        <div>
          <small>Seu {clube.nome} · {estado.formacao} · {estado.estilo}</small>
          <h2>Time completo!</h2>
        </div>
      </div>

      <div className="campo-revelacao" onClick={() => setRevelados(vagas.length)}>
        <Campo formacao={estado.formacao} itens={itens} />
        {!terminou && <span className="toque-pular">toque para revelar tudo</span>}
      </div>

      {terminou && (
        <div className="resumo-time">
          <div className="forca">
            <small>Força do time</small>
            <b>{forcaGeral(estado)}</b>
          </div>
          <div className="contagem">
            {contagem.map((c) => (
              <span key={c.r} className={`chip r-${c.r}`}>{c.n}× {NOME_RARIDADE[c.r]}</span>
            ))}
          </div>

          <ul className="lista-time">
            {vagas.map((p, i) => {
              const x = estado.escalacao[i]!;
              const enc = encaixe(x.jogador, p);
              return (
                <li key={i} className={`r-${raridade(x.jogador.nota)}`}>
                  <span className="pos">{p}</span>
                  <span className="nome">
                    {x.jogador.nome} <small>{x.ano}{enc !== 'natural' && ` · ${enc === 'alternativa' ? 'posição alternativa' : 'improvisado'}`}</small>
                  </span>
                  <span className="nota">{notaEfetiva(x.jogador, p)}</span>
                </li>
              );
            })}
          </ul>

          <button className="botao-grande primario pulsante" onClick={disputar}>
            Disputar a Libertadores
            <small>grupos, oitavas, quartas, semi e final</small>
          </button>
          <button className="botao-grande secundario" onClick={novoMesmoClube}>Montar outro {clube.nome}</button>
          <button className="link-discreto" onClick={inicio}>Início</button>
        </div>
      )}
    </div>
  );
}
