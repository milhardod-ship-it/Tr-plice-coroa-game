import type { ResultadoPartida } from '../../core/motor';

/** Placar com autores dos gols (e pênaltis, se houver). */
export function Placar({ nomeA, nomeB, r }: { nomeA: string; nomeB: string; r: ResultadoPartida }) {
  const lista = (lado: 'a' | 'b') =>
    r.gols.filter((g) => g.time === lado).map((g, i) => (
      <li key={i}>{g.autor}{g.contra ? ' (contra)' : ''} <small>{g.minuto > 90 ? `90+${g.minuto - 90}` : g.minuto}'</small></li>
    ));
  return (
    <div className="placar">
      <div className="linha-placar">
        <span className={`equipe ${r.vencedor === 'a' ? 'venceu' : ''}`}>{nomeA}</span>
        <b>{r.golsA}</b>
        <i>×</i>
        <b>{r.golsB}</b>
        <span className={`equipe direita ${r.vencedor === 'b' ? 'venceu' : ''}`}>{nomeB}</span>
      </div>
      {r.penaltis && (
        <p className="penaltis">Pênaltis: {r.penaltis.golsA} × {r.penaltis.golsB}</p>
      )}
      <div className="autores">
        <ul>{lista('a')}</ul>
        <ul className="direita">{lista('b')}</ul>
      </div>
    </div>
  );
}
