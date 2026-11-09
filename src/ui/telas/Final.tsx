import { useEffect, useMemo, useState } from 'react';
import { analisarCampanha } from '../../core/campanha';
import { FORMACOES } from '../../core/formacoes';
import { notaEfetiva } from '../../core/posicoes';
import { raridade } from '../../core/raridade';
import { textoCompartilharDesafio } from '../../core/desafio';
import type { PartidaSalva } from '../persistencia';
import { gerarCard } from '../card';
import { Faixa } from '../componentes/Faixa';
import { clubePorId, varsClube } from '../util';
import { ResultadoCurto } from './Torneio';

/** Tela final: o desfecho, o quão perto chegou, o card para compartilhar e o "jogar de novo". */
export function Final({ partida, registrar, jogarDeNovo, inicio }: {
  partida: PartidaSalva; registrar: () => void; jogarDeNovo: () => void; inicio: () => void;
}) {
  const { draft } = partida;
  const torneio = partida.torneio!;
  const clube = clubePorId(draft.clubeId);
  // Conta a campanha (álbum, recordes, conquistas, desafio) ao chegar aqui — uma vez só.
  useEffect(() => { registrar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [copiado, setCopiado] = useState(false);
  const textoDesafio = partida.desafio
    ? textoCompartilharDesafio(partida.desafio.numero, clube.nome, analisarCampanha(torneio).titulo.replace(/!$/, ''), torneio, 'triplice-coroa.vercel.app')
    : '';
  const compartilharDesafio = async () => {
    try {
      if (navigator.share) { await navigator.share({ text: textoDesafio }); return; }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(textoDesafio);
      setCopiado(true);
    } catch { /* sem área de transferência */ }
  };
  const a = useMemo(() => analisarCampanha(torneio), [torneio]);
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let url = '';
    gerarCard(draft, clube, torneio, a)
      .then((blob) => { url = URL.createObjectURL(blob); setCard({ blob, url }); })
      .catch(() => setAviso('Não foi possível gerar a imagem neste navegador.'));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [draft, clube, torneio, a]);

  const textoShare = a.campeao
    ? `${a.invicto ? 'Campeão INVICTO' : 'Campeão'} da Libertadores com o ${clube.nome} de todas as eras! 🏆`
    : `${a.titulo} com o ${clube.nome} de todas as eras. ${a.quase[0] ?? ''}`;

  const compartilhar = async () => {
    if (!card) return;
    const arquivo = new File([card.blob], `triplice-coroa-${clube.id}.png`, { type: 'image/png' });
    const dados = { files: [arquivo], text: `${textoShare}\ntriplice-coroa.vercel.app` };
    try {
      if (navigator.canShare?.(dados)) {
        await navigator.share(dados);
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    baixar();
  };

  const baixar = () => {
    if (!card) return;
    const link = document.createElement('a');
    link.href = card.url;
    link.download = `triplice-coroa-${clube.id}.png`;
    link.click();
    setAviso('Imagem salva. Se não aparecer, toque e segure a imagem abaixo para salvar.');
  };

  const vagas = FORMACOES[draft.formacao].vagas;
  return (
    <div className="tela final" style={varsClube(clube)}>
      {a.campeao && <Confete cores={[clube.cores.primaria, clube.cores.secundaria, '#f5c542']} />}

      <div className={`trofeu ${a.campeao ? 'ouro' : ''} ${a.invicto ? 'invicto' : ''}`}>
        {a.campeao && <span className="coroa">♛</span>}
        {a.invicto && <span className="selo-invicto">Campeão invicto</span>}
        <h2>{a.titulo}</h2>
        <p className="sub-trofeu"><Faixa clube={clube} /> {clube.nome} de todas as eras · {draft.formacao}</p>
      </div>

      <div className={`quase ${a.campeao ? 'bom' : ''}`}>
        {a.quase.map((q) => <p key={q}>{q}</p>)}
      </div>

      {partida.novidades && (partida.novidades.conquistas.length > 0 || partida.novidades.recordes.length > 0) && (
        <div className="novidades">
          {partida.novidades.conquistas.map((c) => (
            <div key={c.id} className="nov-conquista"><span>{c.emoji}</span><div><small>Conquista desbloqueada</small><b>{c.nome}</b></div></div>
          ))}
          {partida.novidades.recordes.map((r) => <div key={r} className="nov-recorde">📈 Novo recorde · {r}</div>)}
        </div>
      )}

      {partida.desafio && (
        <div className="share-desafio">
          <pre>{textoDesafio}</pre>
          <button className="botao-grande primario" onClick={compartilharDesafio}>
            {copiado ? 'Copiado! Cole no WhatsApp' : 'Compartilhar resultado do desafio'}
          </button>
        </div>
      )}

      <button className={`botao-grande ${partida.desafio ? 'secundario' : 'primario pulsante'}`} onClick={jogarDeNovo}>
        Jogar de novo com o {clube.nome}
        <small>{partida.desafio ? 'no modo livre, quantas vezes quiser' : 'novo draft em 1 toque'}</small>
      </button>

      <div className="numeros">
        <div><b>{a.v}-{a.e}-{a.d}</b><small>V-E-D</small></div>
        <div><b>{a.gp}:{a.gc}</b><small>gols</small></div>
        <div><b>{a.artilheiro ? a.artilheiro.gols : 0}</b><small>{a.artilheiro ? a.artilheiro.nome : 'artilheiro'}</small></div>
      </div>

      <h3 className="secao">Compartilhar</h3>
      <div className="acoes-card">
        <button className="botao-grande secundario" disabled={!card} onClick={compartilhar}>Compartilhar card</button>
        <button className="botao-grande secundario" disabled={!card} onClick={baixar}>Baixar imagem</button>
      </div>
      {aviso && <p className="nota-rodape">{aviso}</p>}
      {card ? <img className="previa-card" src={card.url} alt="Card da campanha" /> : <div className="previa-card carregando">gerando card…</div>}

      <h3 className="secao">Campanha</h3>
      {torneio.jogos.map((j, i) => <ResultadoCurto key={i} jogo={j} nomeMeu={clube.nome} />)}

      <h3 className="secao">Seu time</h3>
      <ul className="lista-time">
        {vagas.map((p, i) => {
          const x = draft.escalacao[i]!;
          return (
            <li key={i} className={`r-${raridade(x.jogador.nota)}`}>
              <span className="pos">{p}</span>
              <span className="nome">{x.jogador.nome} <small>{x.ano}</small></span>
              <span className="nota">{notaEfetiva(x.jogador, p)}</span>
            </li>
          );
        })}
      </ul>

      <button className="link-discreto" onClick={inicio}>Início</button>
    </div>
  );
}

/** Confete leve, só em CSS (desligado para quem prefere menos movimento). */
function Confete({ cores }: { cores: string[] }) {
  const pedacos = useMemo(
    () => Array.from({ length: 36 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      dur: 2.5 + Math.random() * 2,
      cor: cores[i % cores.length],
      giro: Math.random() * 360,
    })),
    [cores],
  );
  return (
    <div className="confete" aria-hidden>
      {pedacos.map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, background: p.cor, transform: `rotate(${p.giro}deg)` }} />
      ))}
    </div>
  );
}
