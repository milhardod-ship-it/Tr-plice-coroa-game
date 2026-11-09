import { useMemo, useState } from 'react';
import type { Estilo } from '../../core/draft';
import { escalarAutomatico, estatisticas, forcas, mediasDeGols, simularPartida, type Mando, type ResultadoPartida, type Time } from '../../core/motor';
import { Rng } from '../../core/rng';
import { CLUBES } from '../../dados';
import { Placar } from '../componentes/Placar';
import { novaSeed } from '../persistencia';

/** Todas as temporadas cadastradas viram times escalados automaticamente. */
function opcoes(): Time[] {
  return CLUBES.flatMap((c) =>
    c.temporadas.map((t) => ({
      id: `${c.id}-${t.ano}`, nome: `${c.nome} ${t.ano}`, ano: t.ano, estilo: 'equilibrado' as Estilo,
      escalacao: escalarAutomatico(t.jogadores),
    })),
  );
}

export function Laboratorio() {
  const times = useMemo(opcoes, []);
  const [ia, setIa] = useState(0);
  const [ib, setIb] = useState(Math.min(1, times.length - 1));
  const [estiloA, setEstiloA] = useState<Estilo>('equilibrado');
  const [mando, setMando] = useState<Mando>('neutro');
  const [mataMata, setMataMata] = useState(false);
  const [jogo, setJogo] = useState<ResultadoPartida | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof estatisticas> | null>(null);

  const a = { ...times[ia], estilo: estiloA };
  const b = times[ib];
  const fa = forcas(a), fb = forcas(b);
  const med = mediasDeGols(a, b, mando);
  const limpar = () => { setJogo(null); setStats(null); };

  return (
    <div className="lab">
      <p className="nota-rodape">Escolha dois elencos e veja o motor jogar. Útil para calibrar as notas.</p>
      <label>Time A
        <select value={ia} onChange={(e) => { setIa(+e.target.value); limpar(); }}>
          {times.map((t, i) => <option key={t.id} value={i}>{t.nome}</option>)}
        </select>
      </label>
      <label>Time B
        <select value={ib} onChange={(e) => { setIb(+e.target.value); limpar(); }}>
          {times.map((t, i) => <option key={t.id} value={i}>{t.nome}</option>)}
        </select>
      </label>
      <div className="lab-opcoes">
        <select value={estiloA} onChange={(e) => { setEstiloA(e.target.value as Estilo); limpar(); }}>
          <option value="defensivo">A defensivo</option>
          <option value="equilibrado">A equilibrado</option>
          <option value="ofensivo">A ofensivo</option>
        </select>
        <select value={mando} onChange={(e) => { setMando(e.target.value as Mando); limpar(); }}>
          <option value="neutro">Campo neutro</option>
          <option value="a">A em casa</option>
          <option value="b">B em casa</option>
        </select>
        <label className="check"><input type="checkbox" checked={mataMata} onChange={(e) => setMataMata(e.target.checked)} /> Mata-mata</label>
      </div>

      <table className="setores">
        <thead><tr><th></th><th>GOL</th><th>DEF</th><th>MEIO</th><th>ATQ</th><th>Gols*</th></tr></thead>
        <tbody>
          {[[a, fa, med.a], [b, fb, med.b]].map(([t, f, l]) => {
            const tt = t as Time, ff = f as ReturnType<typeof forcas>;
            return (
              <tr key={tt.id}>
                <td>{tt.nome}</td>
                <td>{ff.gol.toFixed(0)}</td><td>{ff.defesa.toFixed(0)}</td><td>{ff.meio.toFixed(0)}</td><td>{ff.ataque.toFixed(0)}</td>
                <td>{(l as number).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="nota-rodape">* média de gols esperada de cada time neste confronto.</p>

      <button className="botao-grande primario" onClick={() => setJogo(simularPartida(a, b, new Rng(novaSeed()), { mando, mataMata }))}>
        Simular 1 jogo
      </button>
      {jogo && <Placar nomeA={a.nome} nomeB={b.nome} r={jogo} />}

      <button className="botao-grande secundario" onClick={() => setStats(estatisticas(a, b, 1000, novaSeed(), mando))}>
        Simular 1000 jogos
      </button>
      {stats && (
        <div className="stats">
          <div><b>{(stats.vitoriasA * 100).toFixed(0)}%</b><small>vitórias A</small></div>
          <div><b>{(stats.empates * 100).toFixed(0)}%</b><small>empates</small></div>
          <div><b>{(stats.vitoriasB * 100).toFixed(0)}%</b><small>vitórias B</small></div>
          <div><b>{stats.mediaGols.toFixed(2)}</b><small>gols/jogo</small></div>
        </div>
      )}
    </div>
  );
}
