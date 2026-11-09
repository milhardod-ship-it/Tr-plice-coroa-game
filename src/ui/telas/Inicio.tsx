import { rodadaAtual, draftCompleto, RODADAS } from '../../core/draft';
import { Faixa } from '../componentes/Faixa';
import { clubePorId } from '../util';
import type { PartidaSalva } from '../persistencia';
import { NOME_FASE } from '../../core/torneio';

export function Inicio({
  salvo, novoJogo, continuar, abrirDados,
}: { salvo: PartidaSalva | null; novoJogo: () => void; continuar: () => void; abrirDados: () => void }) {
  const clube = salvo ? clubePorId(salvo.draft.clubeId) : null;
  const status = () => {
    if (!salvo) return '';
    const { draft, torneio, vistos } = salvo;
    if (!draftCompleto(draft)) return `draft · rodada ${rodadaAtual(draft)} de ${RODADAS}`;
    if (!torneio) return 'time completo';
    if (vistos >= torneio.jogos.length) return 'campanha encerrada';
    return `Libertadores · ${NOME_FASE[torneio.jogos[vistos].fase]}`;
  };
  return (
    <div className="tela inicio">
      <div className="marca">
        <span className="coroa">♛</span>
        <h1>Tríplice Coroa</h1>
        <p>Monte um time com os ídolos de todas as eras do seu clube e conquiste a Libertadores.</p>
      </div>

      {salvo && clube && (
        <button className="botao-grande secundario continuar" onClick={continuar}>
          <Faixa clube={clube} />
          <span>
            Continuar partida
            <small>
              {clube.nome} · {status()}
            </small>
          </span>
        </button>
      )}

      <button className="botao-grande primario" onClick={novoJogo}>
        {salvo ? 'Novo jogo' : 'Jogar'}
      </button>

      <button className="link-discreto" onClick={abrirDados}>Conferir dados</button>
    </div>
  );
}
