import { useEffect, useState } from 'react';
import { draftCompleto, iniciarDraft, type EstadoDraft } from '../core/draft';
import { carregarPartida, novaSeed, salvarPartida } from './persistencia';
import { Configurar, type Escolhas } from './telas/Configurar';
import { Dados } from './telas/Dados';
import { Draft } from './telas/Draft';
import { Inicio } from './telas/Inicio';
import { TimeCompleto } from './telas/TimeCompleto';
import { clubePorId } from './util';

type Tela = 'inicio' | 'dados' | 'configurar' | 'jogo';

export function App() {
  const [tela, setTela] = useState<Tela>('inicio');
  const [partida, setPartida] = useState<EstadoDraft | null>(() => carregarPartida());
  const [preConfig, setPreConfig] = useState<Partial<Escolhas> | undefined>();

  useEffect(() => { salvarPartida(partida); }, [partida]);
  useEffect(() => { window.scrollTo(0, 0); }, [tela]);

  const comecar = (e: Escolhas) => {
    setPartida(iniciarDraft(clubePorId(e.clubeId), { modo: e.modo, formacao: e.formacao, estilo: e.estilo, seed: novaSeed() }));
    setTela('jogo');
  };

  const novoJogo = (mesmoClube?: EstadoDraft) => {
    setPreConfig(mesmoClube && { clubeId: mesmoClube.clubeId, modo: mesmoClube.modo, formacao: mesmoClube.formacao, estilo: mesmoClube.estilo });
    setTela('configurar');
  };

  return (
    <div className="app">
      {tela === 'inicio' && (
        <Inicio salvo={partida} novoJogo={() => novoJogo()} continuar={() => setTela('jogo')} abrirDados={() => setTela('dados')} />
      )}
      {tela === 'dados' && <Dados voltar={() => setTela('inicio')} />}
      {tela === 'configurar' && <Configurar inicial={preConfig} comecar={comecar} voltar={() => setTela('inicio')} />}
      {tela === 'jogo' && partida && !draftCompleto(partida) && (
        <Draft estado={partida} mudar={setPartida} sair={() => setTela('inicio')} />
      )}
      {tela === 'jogo' && partida && draftCompleto(partida) && (
        <TimeCompleto estado={partida} novoMesmoClube={() => comecar({ clubeId: partida.clubeId, modo: partida.modo, formacao: partida.formacao, estilo: partida.estilo })} inicio={() => setTela('inicio')} />
      )}
    </div>
  );
}
