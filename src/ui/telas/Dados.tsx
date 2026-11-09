import { useMemo, useState } from 'react';
import { CLUBES, ADVERSARIOS, FINALISTAS } from '../../dados';
import { validarDados } from '../../core/validacao';
import { raridade, NOME_RARIDADE } from '../../core/raridade';
import type { ClubeJogavel, Temporada } from '../../core/tipos';
import { Faixa } from '../componentes/Faixa';
import { Laboratorio } from './Laboratorio';

type Aba = 'clubes' | 'finais' | 'validacao' | 'motor';

export function Dados({ voltar }: { voltar: () => void }) {
  const [aba, setAba] = useState<Aba>('clubes');
  return (
    <div className="tela">
      <button className="voltar" onClick={voltar}>‹ Início</button>
      <h2 className="titulo-tela">Conferência dos dados</h2>
      <nav className="abas">
        <button className={aba === 'clubes' ? 'ativa' : ''} onClick={() => setAba('clubes')}>Clubes</button>
        <button className={aba === 'finais' ? 'ativa' : ''} onClick={() => setAba('finais')}>Finais</button>
        <button className={aba === 'validacao' ? 'ativa' : ''} onClick={() => setAba('validacao')}>Validação</button>
        <button className={aba === 'motor' ? 'ativa' : ''} onClick={() => setAba('motor')}>Motor</button>
      </nav>
      {aba === 'clubes' && <AbaClubes />}
      {aba === 'finais' && <AbaFinais />}
      {aba === 'validacao' && <AbaValidacao />}
      {aba === 'motor' && <Laboratorio />}
    </div>
  );
}

function AbaClubes() {
  const [sel, setSel] = useState<ClubeJogavel | null>(null);
  if (sel) return <DetalheClube clube={sel} voltar={() => setSel(null)} />;
  return (
    <div className="grade">
      {CLUBES.map((c) => {
        const vazio = c.temporadas.length === 0;
        return (
          <button key={c.id} className="cartao-clube" disabled={vazio} onClick={() => setSel(c)}>
            <Faixa clube={c} />
            <strong>{c.nome}</strong>
            <small>{vazio ? 'em breve' : `${c.temporadas.length} temporadas`}</small>
          </button>
        );
      })}
    </div>
  );
}

function DetalheClube({ clube, voltar }: { clube: ClubeJogavel; voltar: () => void }) {
  const [aberta, setAberta] = useState<number | null>(null);
  return (
    <div>
      <button className="voltar" onClick={voltar}>‹ Clubes</button>
      <h2 className="titulo-clube"><Faixa clube={clube} /> {clube.nome}</h2>
      {clube.temporadas.map((t) => (
        <div key={t.ano} className={`temporada ${t.titulos.length ? 'lendaria' : ''}`}>
          <button className="cab-temporada" onClick={() => setAberta(aberta === t.ano ? null : t.ano)}>
            <span className="ano">{t.ano}</span>
            <span className="obs">
              {t.titulos.length > 0 && <em>Temporada Lendária</em>}
              {t.observacao}
            </span>
            <span className="qtd">{t.jogadores.length}</span>
          </button>
          {aberta === t.ano && <Elenco t={t} />}
        </div>
      ))}
    </div>
  );
}

function Elenco({ t }: { t: Temporada }) {
  return (
    <ul className="elenco">
      {t.jogadores.map((j) => {
        const r = raridade(j.nota);
        return (
          <li key={j.nome} className={`jogador r-${r}`}>
            <span className="pos">{j.posicao}</span>
            <span className="nome">
              {j.nome}
              {j.alternativas.length > 0 && <small> · {j.alternativas.join(', ')}</small>}
            </span>
            <span className="nota" title={NOME_RARIDADE[r]}>{j.nota}</span>
          </li>
        );
      })}
    </ul>
  );
}

function AbaFinais() {
  return (
    <>
      <p className="nota-rodape">Campeão e vice de 1980 a 2025. Tudo marcado como <code>revisado: false</code> — confira cada linha.</p>
      <table className="finais">
        <thead>
          <tr><th>Ano</th><th>Campeão</th><th>Vice</th></tr>
        </thead>
        <tbody>
          {[...FINALISTAS.finais].reverse().map((f) => (
            <tr key={f.ano}>
              <td>{f.ano}</td>
              <td>{f.campeao.nome} <small>{f.campeao.pais}</small></td>
              <td>{f.vice.nome} <small>{f.vice.pais}</small></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function AbaValidacao() {
  const r = useMemo(() => validarDados(CLUBES, ADVERSARIOS, FINALISTAS), []);
  return (
    <div className="validacao">
      <div className={`selo ${r.erros.length ? 'ruim' : 'bom'}`}>
        {r.erros.length ? `${r.erros.length} erro(s)` : 'Sem erros'}
      </div>
      <Lista titulo="Erros" itens={r.erros} classe="ruim" />
      <Lista titulo="Avisos" itens={r.avisos} classe="aviso" />
      <Lista titulo="Finalistas sem elenco (etapas 4 e 7)" itens={r.pendentes} classe="pendente" />
    </div>
  );
}

function Lista({ titulo, itens, classe }: { titulo: string; itens: string[]; classe: string }) {
  if (!itens.length) return null;
  return (
    <details open={classe === 'ruim'}>
      <summary>{titulo} ({itens.length})</summary>
      <ul className={`lista ${classe}`}>{itens.map((i) => <li key={i}>{i}</li>)}</ul>
    </details>
  );
}
