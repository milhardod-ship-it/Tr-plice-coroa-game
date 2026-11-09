import { useMemo, useState } from 'react';
import { CONQUISTAS } from '../../core/conquistas';
import { artilheiros, type Progresso } from '../../core/progresso';
import { raridade } from '../../core/raridade';
import { sequencia } from '../../core/sequencia';
import { CLUBES } from '../../dados';
import { Faixa } from '../componentes/Faixa';
import { hoje } from '../persistencia';
import { clubePorId } from '../util';

type Aba = 'album' | 'conquistas' | 'recordes';

export function Colecao({ progresso, voltar }: { progresso: Progresso; voltar: () => void }) {
  const [aba, setAba] = useState<Aba>('album');
  return (
    <div className="tela colecao">
      <button className="voltar" onClick={voltar}>‹ Início</button>
      <h2 className="titulo-tela">Sua coleção</h2>
      <nav className="abas abas-3">
        <button className={aba === 'album' ? 'ativa' : ''} onClick={() => setAba('album')}>Álbum</button>
        <button className={aba === 'conquistas' ? 'ativa' : ''} onClick={() => setAba('conquistas')}>Conquistas</button>
        <button className={aba === 'recordes' ? 'ativa' : ''} onClick={() => setAba('recordes')}>Recordes</button>
      </nav>
      {aba === 'album' && <Album progresso={progresso} />}
      {aba === 'conquistas' && <Conquistas progresso={progresso} />}
      {aba === 'recordes' && <Recordes progresso={progresso} />}
    </div>
  );
}

function Album({ progresso }: { progresso: Progresso }) {
  const clubes = CLUBES.filter((c) => c.temporadas.length);
  const [id, setId] = useState(() => clubes.find((c) => progresso.album[c.id]?.length)?.id ?? clubes[0].id);
  const clube = clubePorId(id);
  // Todos os jogadores do clube (nome único), com a melhor temporada de cada um.
  const todos = useMemo(() => {
    const m = new Map<string, { nome: string; posicao: string; nota: number; ano: number }>();
    for (const t of clube.temporadas) for (const j of t.jogadores) {
      const atual = m.get(j.nome);
      if (!atual || j.nota > atual.nota) m.set(j.nome, { nome: j.nome, posicao: j.posicao, nota: j.nota, ano: t.ano });
    }
    return [...m.values()].sort((a, b) => b.nota - a.nota || a.nome.localeCompare(b.nome));
  }, [clube]);
  const escalados = new Set(progresso.album[id] ?? []);
  const n = todos.filter((j) => escalados.has(j.nome)).length;

  return (
    <>
      <div className="chips-clubes">
        {clubes.map((c) => (
          <button key={c.id} className={c.id === id ? 'sel' : ''} onClick={() => setId(c.id)}>
            <Faixa clube={c} /> {c.nome} <small>{(progresso.album[c.id] ?? []).length}</small>
          </button>
        ))}
      </div>
      <p className="album-total"><b>{n}</b> de {todos.length} ídolos do {clube.nome}</p>
      <div className="barra-album"><i style={{ width: `${(n / Math.max(1, todos.length)) * 100}%` }} /></div>
      <div className="album">
        {todos.map((j) => escalados.has(j.nome) ? (
          <div key={j.nome} className={`fig r-${raridade(j.nota)}`}>
            <span className="fig-pos">{j.posicao}</span>
            <b>{j.nome}</b>
            <small>melhor: {j.ano} · {j.nota}</small>
          </div>
        ) : (
          <div key={j.nome} className="fig silhueta">
            <span className="fig-pos">{j.posicao}</span>
            <span className="sombra">👤</span>
            <small>?</small>
          </div>
        ))}
      </div>
    </>
  );
}

function Conquistas({ progresso }: { progresso: Progresso }) {
  const total = Object.keys(progresso.conquistas).length;
  return (
    <>
      <p className="album-total"><b>{total}</b> de {CONQUISTAS.length} conquistas</p>
      <ul className="lista-conquistas">
        {CONQUISTAS.map((c) => {
          const data = progresso.conquistas[c.id];
          return (
            <li key={c.id} className={data ? 'ok' : ''}>
              <span className="emoji">{data ? c.emoji : '🔒'}</span>
              <div><b>{c.nome}</b><small>{c.descricao}{data ? ` · ${data.split('-').reverse().join('/')}` : ''}</small></div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Recordes({ progresso }: { progresso: Progresso }) {
  const r = progresso.recordes;
  const seq = sequencia(Object.keys(progresso.desafios), hoje());
  const art = artilheiros(progresso, 5);
  return (
    <div className="recordes">
      <div className="numeros">
        <div><b>{r.campanhas}</b><small>campanhas</small></div>
        <div><b>{r.titulos}</b><small>títulos</small></div>
        <div><b>{seq.melhor}</b><small>maior sequência</small></div>
      </div>
      <div className="rec"><small>Melhor campanha</small><b>{r.melhor ? r.melhor.texto : '—'}</b></div>
      <div className="rec"><small>Maior goleada</small><b>{r.maiorGoleada ? `${r.maiorGoleada.golsA} a ${r.maiorGoleada.golsB} no ${r.maiorGoleada.adv} (${clubePorId(r.maiorGoleada.clubeId).nome})` : '—'}</b></div>
      <div className="rec">
        <small>Seus artilheiros históricos</small>
        {art.length ? (
          <ol>{art.map((a) => <li key={`${a.clubeId}${a.nome}`}><span>{a.nome} <small>{clubePorId(a.clubeId).nome}</small></span><b>{a.gols}</b></li>)}</ol>
        ) : <b>—</b>}
      </div>
      <div className="rec"><small>Desafios jogados</small><b>{Object.keys(progresso.desafios).length} · sequência atual {seq.atual}</b></div>
    </div>
  );
}
