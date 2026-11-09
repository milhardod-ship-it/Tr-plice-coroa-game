import { useEffect, useState } from 'react';
import type { Conquista } from '../core/conquistas';
import { desafioDoDia } from '../core/desafio';
import { draftCompleto, iniciarDraft, type EstadoDraft } from '../core/draft';
import { timeDoDraft } from '../core/motor';
import { registrarAlbum, registrarCampanha, type Progresso } from '../core/progresso';
import { seedDeTexto } from '../core/rng';
import { jogarTorneio } from '../core/torneio';
import { CLUBES, CONFRONTOS, POOL } from '../dados';
import {
  carregarPartida, carregarProgresso, hoje, novaSeed, salvarPartida, salvarProgresso, type PartidaSalva, type Slot,
} from './persistencia';
import { setSomLigado, sons } from './som';
import { Colecao } from './telas/Colecao';
import { Configurar, type Escolhas } from './telas/Configurar';
import { Dados } from './telas/Dados';
import { Draft } from './telas/Draft';
import { Inicio } from './telas/Inicio';
import { TimeCompleto } from './telas/TimeCompleto';
import { TorneioTela } from './telas/Torneio';
import { clubePorId } from './util';

type Tela = 'inicio' | 'dados' | 'colecao' | 'configurar' | 'jogo';

const CLUBES_COM_DADOS = CLUBES.filter((c) => c.temporadas.length).map((c) => c.id);

export function App() {
  const [tela, setTela] = useState<Tela>('inicio');
  const [partidas, setPartidas] = useState<Record<Slot, PartidaSalva | null>>(() => ({
    livre: carregarPartida('livre'),
    desafio: carregarPartida('desafio'),
  }));
  const [slot, setSlot] = useState<Slot>('livre');
  const [progresso, setProgresso] = useState<Progresso>(() => carregarProgresso());
  const [preConfig, setPreConfig] = useState<Partial<Escolhas> & { desafio?: boolean } | undefined>();
  const [aviso, setAviso] = useState<Conquista | null>(null);

  const dia = hoje();
  const desafio = desafioDoDia(dia, CLUBES_COM_DADOS);

  useEffect(() => { salvarPartida('livre', partidas.livre); }, [partidas.livre]);
  useEffect(() => { salvarPartida('desafio', partidas.desafio); }, [partidas.desafio]);
  useEffect(() => { salvarProgresso(progresso); setSomLigado(progresso.som); }, [progresso]);
  useEffect(() => { window.scrollTo(0, 0); }, [tela]);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const partida = partidas[slot];
  const setPartida = (p: PartidaSalva | null) => setPartidas((x) => ({ ...x, [slot]: p }));

  const comecar = (e: Escolhas & { desafio?: boolean }) => {
    const ehDesafio = !!e.desafio;
    const draft = iniciarDraft(clubePorId(e.clubeId), {
      modo: e.modo, formacao: e.formacao, estilo: e.estilo, seed: ehDesafio ? desafio.seed : novaSeed(),
    });
    const nova: PartidaSalva = { draft, vistos: 0, desafio: ehDesafio ? { data: desafio.data, numero: desafio.numero } : undefined };
    const s: Slot = ehDesafio ? 'desafio' : 'livre';
    setPartidas((x) => ({ ...x, [s]: nova }));
    setSlot(s);
    setTela('jogo');
  };
  const mesmoClube = (d: EstadoDraft) => comecar({ clubeId: d.clubeId, modo: d.modo, formacao: d.formacao, estilo: d.estilo });

  const mudarDraft = (nd: EstadoDraft) => {
    if (!partida) return;
    setPartida({ ...partida, draft: nd });
    // Álbum: registra os jogadores assim que o time fica completo.
    if (draftCompleto(nd)) setProgresso((p) => registrarAlbum(p, nd.clubeId, nd.escalacao.map((x) => x!.jogador.nome)));
  };

  const comecarTorneio = () => {
    if (!partida) return;
    const d = partida.draft;
    const torneio = jogarTorneio({
      meu: timeDoDraft(d, 'meu', clubePorId(d.clubeId).nome),
      meuClubeId: d.clubeId,
      pool: POOL,
      confrontos: CONFRONTOS,
      // Derivada da seed do draft: mesma seed ⇒ mesmos rivais (base do Desafio do Dia).
      seed: seedDeTexto(`${d.seed}-libertadores`),
    });
    setPartida({ ...partida, torneio, vistos: 0 });
    window.scrollTo(0, 0);
  };

  /** Ao chegar na tela final: conta a campanha uma única vez. */
  const registrar = () => {
    if (!partida?.torneio || partida.registrada) return;
    const { progresso: novo, novidades } = registrarCampanha(progresso, {
      draft: partida.draft, torneio: partida.torneio, clubeNome: clubePorId(partida.draft.clubeId).nome, data: dia, desafio: partida.desafio,
    });
    setProgresso(novo);
    setPartida({ ...partida, registrada: true, novidades });
    if (novidades.conquistas.length) {
      setAviso(novidades.conquistas[0]);
      sons.conquista();
    }
  };

  const abrirSlot = (s: Slot) => { setSlot(s); setTela('jogo'); };
  const jogarDesafio = () => {
    const atual = partidas.desafio;
    if (atual?.desafio?.data === dia) return abrirSlot('desafio');
    setPreConfig({ clubeId: desafio.clubeId, modo: 'classico', desafio: true });
    setTela('configurar');
  };

  const d = partida?.draft;
  return (
    <div className="app">
      <button
        className="btn-som"
        aria-label={progresso.som ? 'Silenciar' : 'Ligar som'}
        onClick={() => setProgresso((p) => ({ ...p, som: !p.som }))}
      >
        {progresso.som ? '🔊' : '🔇'}
      </button>

      {tela === 'inicio' && (
        <Inicio
          livre={partidas.livre}
          desafioSalvo={partidas.desafio}
          desafio={desafio}
          hoje={dia}
          progresso={progresso}
          novoJogo={() => { setPreConfig(undefined); setTela('configurar'); }}
          continuar={abrirSlot}
          jogarDesafio={jogarDesafio}
          abrirColecao={() => setTela('colecao')}
          abrirDados={() => setTela('dados')}
        />
      )}
      {tela === 'dados' && <Dados voltar={() => setTela('inicio')} />}
      {tela === 'colecao' && <Colecao progresso={progresso} voltar={() => setTela('inicio')} />}
      {tela === 'configurar' && (
        <Configurar inicial={preConfig} desafioNumero={preConfig?.desafio ? desafio.numero : undefined}
          comecar={(e) => comecar({ ...e, desafio: preConfig?.desafio })} voltar={() => setTela('inicio')} />
      )}
      {tela === 'jogo' && partida && d && !draftCompleto(d) && (
        <Draft estado={d} mudar={mudarDraft} sair={() => setTela('inicio')} />
      )}
      {tela === 'jogo' && partida && d && draftCompleto(d) && !partida.torneio && (
        <TimeCompleto estado={d} disputar={comecarTorneio} novoMesmoClube={partida.desafio ? undefined : () => mesmoClube(d)} inicio={() => setTela('inicio')} />
      )}
      {tela === 'jogo' && partida && d && partida.torneio && (
        <TorneioTela
          partida={partida}
          marcarVistos={(n) => setPartida({ ...partida, vistos: n })}
          registrar={registrar}
          novoMesmoClube={() => mesmoClube(d)}
          inicio={() => setTela('inicio')}
        />
      )}

      {aviso && (
        <div className="toast-conquista" onClick={() => setAviso(null)}>
          <span>{aviso.emoji}</span>
          <div><small>Conquista desbloqueada</small><b>{aviso.nome}</b></div>
        </div>
      )}
    </div>
  );
}

