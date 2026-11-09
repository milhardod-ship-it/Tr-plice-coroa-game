import type { EstadoDraft } from '../../core/draft';
import { rodadaAtual, draftCompleto, RODADAS } from '../../core/draft';
import { Faixa } from '../componentes/Faixa';
import { clubePorId } from '../util';

export function Inicio({
  salvo, novoJogo, continuar, abrirDados,
}: { salvo: EstadoDraft | null; novoJogo: () => void; continuar: () => void; abrirDados: () => void }) {
  const clube = salvo ? clubePorId(salvo.clubeId) : null;
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
              {clube.nome} · {draftCompleto(salvo) ? 'time completo' : `rodada ${rodadaAtual(salvo)} de ${RODADAS}`}
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
