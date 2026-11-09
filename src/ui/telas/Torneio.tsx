import { useEffect, useMemo, useRef, useState } from 'react';
import type { EstadoDraft } from '../../core/draft';
import { timeDoDraft, type Time } from '../../core/motor';
import { narrarPartida, type EventoNarracao } from '../../core/narracao';
import { FASES, type JogoTorneio, type LinhaTabela, type Torneio } from '../../core/torneio';
import { POOL } from '../../dados';
import { Faixa } from '../componentes/Faixa';
import { clubePorId, varsClube } from '../util';
import { Final } from './Final';

interface Props {
  draft: EstadoDraft;
  torneio: Torneio;
  vistos: number;
  marcarVistos: (n: number) => void;
  novoMesmoClube: () => void;
  inicio: () => void;
}

const timeAdv = (chave: string, nome: string): Time =>
  POOL.find((p) => p.chave === chave)?.time ?? { id: chave, nome, estilo: 'equilibrado', escalacao: [] };

export function TorneioTela({ draft, torneio, vistos, marcarVistos, novoMesmoClube, inicio }: Props) {
  const clube = clubePorId(draft.clubeId);
  const meu = useMemo(() => timeDoDraft(draft, 'meu', clube.nome), [draft, clube]);
  const [assistindo, setAssistindo] = useState(false);
  const terminou = vistos >= torneio.jogos.length;

  useEffect(() => { window.scrollTo(0, 0); }, [assistindo, vistos]);

  if (terminou) {
    return <Final draft={draft} torneio={torneio} jogarDeNovo={novoMesmoClube} inicio={inicio} />;
  }

  const jogo = torneio.jogos[vistos];
  if (assistindo) {
    return (
      <div className="tela" style={varsClube(clube)}>
        <PartidaAoVivo
          key={vistos}
          jogo={jogo}
          meu={meu}
          adv={timeAdv(jogo.adv.chave, jogo.adv.nome)}
          nomeMeu={clube.nome}
          aoTerminar={() => { setAssistindo(false); marcarVistos(vistos + 1); }}
          pularTudo={() => { setAssistindo(false); marcarVistos(torneio.jogos.length); }}
        />
      </div>
    );
  }

  const anterior = vistos > 0 ? torneio.jogos[vistos - 1] : null;
  const tabela = jogo.fase === 'grupos' || anterior?.fase === 'grupos' ? tabelaApos(torneio, Math.min(vistos, 6), clube.nome) : null;

  return (
    <div className="tela torneio" style={varsClube(clube)}>
      <header className="cab-torneio">
        <button className="voltar" onClick={inicio}>‹ Sair</button>
        <h2>Libertadores</h2>
        <Faixa clube={clube} />
      </header>
      <Fases atual={jogo.fase} />

      {anterior && <ResultadoCurto jogo={anterior} nomeMeu={clube.nome} />}

      <div className={`proximo ${jogo.confronto ? `conf-${jogo.confronto.tipo}` : ''} ${jogo.fase === 'final' ? 'e-final' : ''}`}>
        <small>{jogo.rotulo}{jogo.mando !== 'neutro' ? ` · ${jogo.mando === 'casa' ? 'em casa' : 'fora de casa'}` : ' · campo neutro'}</small>
        {jogo.confronto && (
          <div className="anuncio-confronto">
            <b>{jogo.confronto.tipo === 'vinganca' ? '⚔ Jogo de vingança' : '★ Clássico histórico'}</b>
            <span>{jogo.confronto.titulo}</span>
            <p>{jogo.confronto.texto}</p>
          </div>
        )}
        <div className="duelo">
          <span>{clube.nome}</span>
          <i>×</i>
          <span className="adv">
            {jogo.adv.nome} {jogo.adv.ano}
            <small>{jogo.adv.pais}{jogo.adv.campeaoLibertadores ? ' · campeão da Libertadores' : ''}</small>
          </span>
        </div>
        <div className="forcas-duelo">
          <span>força do rival <b>{jogo.adv.forca}</b></span>
        </div>
        <button className="botao-grande primario" onClick={() => setAssistindo(true)}>
          {jogo.fase === 'final' ? 'Jogar a FINAL' : 'Jogar'}
        </button>
      </div>

      {tabela && <Tabela linhas={tabela} titulo={vistos >= 6 ? 'Grupo · classificação final' : vistos === 0 ? 'Seu grupo' : `Grupo · após ${vistos} rodada${vistos === 1 ? '' : 's'}`} />}

      <button className="link-discreto" onClick={() => marcarVistos(torneio.jogos.length)}>Pular para o fim da campanha</button>
    </div>
  );
}

function tabelaApos(t: Torneio, rodadas: number, nomeMeu: string): LinhaTabela[] {
  if (rodadas > 0) return t.tabelas[rodadas - 1];
  return [
    { chave: 'eu', nome: nomeMeu, eu: true, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0 },
    ...t.grupo.map((g) => ({ chave: g.chave, nome: `${g.nome} ${g.ano}`, eu: false, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0 })),
  ];
}

function Fases({ atual }: { atual: (typeof FASES)[number] }) {
  const i = FASES.indexOf(atual);
  const curto = { grupos: 'Grupos', oitavas: 'Oitavas', quartas: 'Quartas', semi: 'Semi', final: 'Final' };
  return (
    <ol className="fases">
      {FASES.map((f, k) => <li key={f} className={k < i ? 'feita' : k === i ? 'atual' : ''}>{curto[f]}</li>)}
    </ol>
  );
}

function Tabela({ linhas, titulo }: { linhas: LinhaTabela[]; titulo: string }) {
  return (
    <div className="tabela-grupo">
      <h3>{titulo}</h3>
      <table>
        <thead><tr><th></th><th>Time</th><th>P</th><th>J</th><th>V</th><th>SG</th></tr></thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={l.chave} className={`${l.eu ? 'eu' : ''} ${i < 2 ? 'classifica' : ''}`}>
              <td>{i + 1}</td><td>{l.nome}</td><td><b>{l.pts}</b></td><td>{l.j}</td><td>{l.v}</td><td>{l.gp - l.gc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultadoCurto({ jogo, nomeMeu }: { jogo: JogoTorneio; nomeMeu: string }) {
  const { r } = jogo;
  const cls = r.golsA > r.golsB || (r.penaltis && r.vencedor === 'a') ? 'v' : r.golsA < r.golsB || r.vencedor === 'b' ? 'd' : 'e';
  const autores = (lado: 'a' | 'b') => r.gols.filter((g) => g.time === lado).map((g) => `${g.autor}${g.contra ? ' (contra)' : ''} ${g.minuto > 90 ? `90+${g.minuto - 90}` : g.minuto}'`).join(', ');
  return (
    <div className={`res-curto r-${cls}`}>
      <small>{jogo.rotulo}</small>
      <div className="linha"><span>{nomeMeu}</span><b>{r.golsA} × {r.golsB}</b><span>{jogo.adv.nome} {jogo.adv.ano}</span></div>
      {r.penaltis && <p className="pen">Pênaltis: {r.penaltis.golsA} × {r.penaltis.golsB}</p>}
      {(r.golsA > 0 || r.golsB > 0) && <p className="aut">{[autores('a'), autores('b')].filter(Boolean).join(' · ')}</p>}
    </div>
  );
}

/* ---------------- Partida ao vivo ---------------- */

const PAUSA: Record<EventoNarracao['tipo'], number> = {
  inicio: 1400, lance: 650, gol: 1800, intervalo: 900, tensao: 1100, fim: 1200, penaltis: 1200, cobranca: 900,
};
const PAUSA_RESULTADO_PENALTI = 1000;

function PartidaAoVivo({
  jogo, meu, adv, nomeMeu, aoTerminar, pularTudo,
}: { jogo: JogoTorneio; meu: Time; adv: Time; nomeMeu: string; aoTerminar: () => void; pularTudo: () => void }) {
  const nomeAdv = `${jogo.adv.nome} ${jogo.adv.ano}`;
  const eventos = useMemo(
    () => narrarPartida(jogo.r, meu, adv, jogo.seedNarracao, { A: nomeMeu, B: jogo.adv.nome }, jogo.confronto),
    [jogo, meu, adv, nomeMeu],
  );
  const [mostrados, setMostrados] = useState(0);
  const [minuto, setMinuto] = useState(0);
  const [cobrancaRevelada, setCobrancaRevelada] = useState(true);
  const [rapido, setRapido] = useState(false);
  const acabou = mostrados >= eventos.length && cobrancaRevelada;

  const visiveis = eventos.slice(0, mostrados);
  const ultimo = visiveis[visiveis.length - 1];
  const placar = ultimo?.placar ?? [0, 0];
  const pen = [...visiveis].reverse().find((e) => e.tipo === 'cobranca');
  const penPlacar = pen && (cobrancaRevelada ? pen.placarPenaltis : placarAntes(visiveis));
  const tenso = minuto >= 80 && Math.abs(placar[0] - placar[1]) <= 1 && !eventos.slice(0, mostrados).some((e) => e.tipo === 'fim');
  const emPenaltis = visiveis.some((e) => e.tipo === 'penaltis');

  const vel = rapido ? 0.4 : 1;
  const [fresco, setFresco] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (acabou) return;
    const prox = eventos[mostrados];
    let espera: number;
    let passo: () => void;
    if (!cobrancaRevelada) {
      // Suspense: o resultado da cobrança só aparece depois de uma pausa.
      espera = PAUSA_RESULTADO_PENALTI;
      passo = () => { setCobrancaRevelada(true); setFresco(true); };
    } else if (fresco && ultimo) {
      // Segura a tela depois de um evento (gol pausa mais que uma chance perdida).
      espera = PAUSA[ultimo.tipo];
      passo = () => setFresco(false);
    } else if (prox && prox.minuto <= minuto) {
      espera = 60;
      passo = () => {
        setMostrados((n) => n + 1);
        if (prox.tipo === 'cobranca') setCobrancaRevelada(false);
        else setFresco(true);
      };
    } else {
      // Relógio: corre rápido no meio do jogo e desacelera na reta final de jogo apertado.
      espera = tenso ? 170 : 70;
      passo = () => setMinuto((m) => m + 1);
    }
    timer.current = setTimeout(passo, espera * vel);
    return () => clearTimeout(timer.current);
  }, [mostrados, minuto, cobrancaRevelada, fresco, acabou, eventos, tenso, vel, ultimo]);

  // Vibração curta a cada gol do jogador (quando o aparelho permite).
  useEffect(() => {
    if (ultimo?.tipo === 'gol' && ultimo.lado === 'a') navigator.vibrate?.(150);
  }, [ultimo]);

  const pular = () => { clearTimeout(timer.current); setMostrados(eventos.length); setCobrancaRevelada(true); setFresco(false); setMinuto(120); };
  const relogio = emPenaltis ? 'Pênaltis' : visiveis.some((e) => e.tipo === 'fim') ? 'Fim' : `${Math.min(minuto, 90)}'${minuto > 90 ? `+${minuto - 90}` : ''}`;
  const flash = ultimo?.tipo === 'gol' ? (ultimo.lado === 'a' ? 'flash-meu' : 'flash-deles') : '';

  return (
    <div className="ao-vivo">
      <div className={`placar-vivo ${tenso ? 'tenso' : ''} ${flash}`} key={`${placar[0]}-${placar[1]}`}>
        <small>{jogo.rotulo}</small>
        <div className="pv-linha">
          <span>{nomeMeu}</span>
          <b>{placar[0]}</b><i>×</i><b>{placar[1]}</b>
          <span>{nomeAdv}</span>
        </div>
        <div className="pv-rodape">
          <span className="relogio">{relogio}</span>
          {penPlacar && <span className="pen-vivo">pênaltis {penPlacar[0]} × {penPlacar[1]}</span>}
          {tenso && <span className="selo-tensao">reta final</span>}
        </div>
      </div>

      <div className="controles-vivo">
        <button onClick={() => setRapido(!rapido)}>{rapido ? '▶ Normal' : '⏩ 2,5×'}</button>
        {!acabou && <button onClick={pular}>Pular jogo</button>}
        <button onClick={pularTudo}>Pular tudo</button>
      </div>

      {acabou && (
        <button className="botao-grande primario" onClick={aoTerminar}>Continuar</button>
      )}

      <ol className="feed">
        {[...visiveis].reverse().map((e, i) => {
          const idx = visiveis.length - 1 - i;
          const pendente = e.tipo === 'cobranca' && idx === visiveis.length - 1 && !cobrancaRevelada;
          return (
            <li key={idx} className={`ev ev-${e.tipo} ${e.lado ? `lado-${e.lado}` : ''} ${e.tipo === 'cobranca' && !pendente ? (e.convertido ? 'conv' : 'perd') : ''}`}>
              <span className="min">{e.tipo === 'cobranca' || e.tipo === 'penaltis' ? '⚽' : e.minuto > 90 ? `90+${e.minuto - 90}'` : `${e.minuto}'`}</span>
              <span className="txt">
                {e.texto}
                {e.tipo === 'cobranca' && (pendente ? <em className="suspense">…</em> : <strong> {e.resultado}</strong>)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function placarAntes(vis: EventoNarracao[]): [number, number] | undefined {
  const cobr = vis.filter((e) => e.tipo === 'cobranca');
  return cobr.length > 1 ? cobr[cobr.length - 2].placarPenaltis : [0, 0];
}

