import { useEffect, useState } from 'react';
import { draftCompleto, iniciarDraft, type EstadoDraft } from '../core/draft';
import { timeDoDraft } from '../core/motor';
import { seedDeTexto } from '../core/rng';
import { jogarTorneio } from '../core/torneio';
import { CONFRONTOS, POOL } from '../dados';
import { carregarPartida, novaSeed, salvarPartida, type PartidaSalva } from './persistencia';
import { Configurar, type Escolhas } from './telas/Configurar';
import { Dados } from './telas/Dados';
import { Draft } from './telas/Draft';
import { Inicio } from './telas/Inicio';
import { TimeCompleto } from './telas/TimeCompleto';
import { TorneioTela } from './telas/Torneio';
import { clubePorId } from './util';

type Tela = 'inicio' | 'dados' | 'configurar' | 'jogo';

export function App() {
  const [tela, setTela] = useState<Tela>('inicio');
  const [partida, setPartida] = useState<PartidaSalva | null>(() => carregarPartida());
  const [preConfig, setPreConfig] = useState<Partial<Escolhas> | undefined>();

  useEffect(() => { salvarPartida(partida); }, [partida]);
  useEffect(() => { window.scrollTo(0, 0); }, [tela]);

  const comecar = (e: Escolhas) => {
    const draft = iniciarDraft(clubePorId(e.clubeId), { modo: e.modo, formacao: e.formacao, estilo: e.estilo, seed: novaSeed() });
    setPartida({ draft, vistos: 0 });
    setTela('jogo');
  };
  const mesmoClube = (d: EstadoDraft) => comecar({ clubeId: d.clubeId, modo: d.modo, formacao: d.formacao, estilo: d.estilo });

  const comecarTorneio = () => {
    if (!partida) return;
    const d = partida.draft;
    const clube = clubePorId(d.clubeId);
    const torneio = jogarTorneio({
      meu: timeDoDraft(d, 'meu', clube.nome),
      meuClubeId: d.clubeId,
      pool: POOL,
      confrontos: CONFRONTOS,
      // Derivada da seed do draft: mesma seed ⇒ mesmos adversários (base do Desafio do Dia).
      seed: seedDeTexto(`${d.seed}-libertadores`),
    });
    setPartida({ ...partida, torneio, vistos: 0 });
    window.scrollTo(0, 0);
  };

  const d = partida?.draft;
  return (
    <div className="app">
      {tela === 'inicio' && (
        <Inicio salvo={partida} novoJogo={() => { setPreConfig(undefined); setTela('configurar'); }} continuar={() => setTela('jogo')} abrirDados={() => setTela('dados')} />
      )}
      {tela === 'dados' && <Dados voltar={() => setTela('inicio')} />}
      {tela === 'configurar' && <Configurar inicial={preConfig} comecar={comecar} voltar={() => setTela('inicio')} />}
      {tela === 'jogo' && partida && d && !draftCompleto(d) && (
        <Draft estado={d} mudar={(nd) => setPartida({ ...partida, draft: nd })} sair={() => setTela('inicio')} />
      )}
      {tela === 'jogo' && partida && d && draftCompleto(d) && !partida.torneio && (
        <TimeCompleto estado={d} disputar={comecarTorneio} novoMesmoClube={() => mesmoClube(d)} inicio={() => setTela('inicio')} />
      )}
      {tela === 'jogo' && partida && d && partida.torneio && (
        <TorneioTela
          draft={d}
          torneio={partida.torneio}
          vistos={partida.vistos}
          marcarVistos={(n) => setPartida({ ...partida, vistos: n })}
          novoMesmoClube={() => mesmoClube(d)}
          inicio={() => setTela('inicio')}
        />
      )}
    </div>
  );
}
