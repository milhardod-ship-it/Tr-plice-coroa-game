import type { DesafioDoDia } from '../../core/desafio';
import { draftCompleto, rodadaAtual, RODADAS } from '../../core/draft';
import type { Progresso } from '../../core/progresso';
import { sequencia } from '../../core/sequencia';
import { NOME_FASE } from '../../core/torneio';
import { Faixa } from '../componentes/Faixa';
import type { PartidaSalva, Slot } from '../persistencia';
import { clubePorId } from '../util';

function status(p: PartidaSalva) {
  const { draft, torneio, vistos } = p;
  if (!draftCompleto(draft)) return `draft · rodada ${rodadaAtual(draft)} de ${RODADAS}`;
  if (!torneio) return 'time completo';
  if (vistos >= torneio.jogos.length) return 'campanha encerrada';
  return `Libertadores · ${NOME_FASE[torneio.jogos[vistos].fase]}`;
}

const emAndamento = (p: PartidaSalva | null) => !!p && !(p.torneio && p.vistos >= p.torneio.jogos.length);

export function Inicio({
  livre, desafioSalvo, desafio, hoje, progresso, novoJogo, continuar, jogarDesafio, abrirColecao, abrirDados,
}: {
  livre: PartidaSalva | null; desafioSalvo: PartidaSalva | null; desafio: DesafioDoDia; hoje: string; progresso: Progresso;
  novoJogo: () => void; continuar: (s: Slot) => void; jogarDesafio: () => void; abrirColecao: () => void; abrirDados: () => void;
}) {
  const resultadoHoje = progresso.desafios[hoje];
  const desafioHojeSalvo = desafioSalvo?.desafio?.data === hoje ? desafioSalvo : null;
  const seq = sequencia(Object.keys(progresso.desafios), hoje);
  const clubeDesafio = clubePorId(desafio.clubeId);
  const clubeLivre = livre ? clubePorId(livre.draft.clubeId) : null;
  const conquistas = Object.keys(progresso.conquistas).length;

  return (
    <div className="tela inicio">
      <div className="marca">
        <span className="coroa">♛</span>
        <h1>Tríplice Coroa</h1>
        <p>Monte um time com os ídolos de todas as eras do seu clube e conquiste a Libertadores.</p>
      </div>

      <div className={`card-desafio ${resultadoHoje ? 'feito' : ''}`}>
        <div className="cd-topo">
          <span>Desafio #{desafio.numero}</span>
          {seq.atual > 0 && <span className="chama">🔥 {seq.atual} {seq.atual === 1 ? 'dia' : 'dias'}</span>}
        </div>
        <div className="cd-clube"><Faixa clube={clubeDesafio} /> {clubeDesafio.nome} <small>· igual para todos hoje</small></div>
        {resultadoHoje ? (
          <>
            <p className="cd-res">{resultadoHoje.titulo}</p>
            <p className="cd-quad">{resultadoHoje.quadrados}</p>
            <button className="botao-grande secundario" onClick={() => continuar('desafio')}>Ver campanha e compartilhar</button>
            <small className="cd-nota">Novo desafio amanhã. O modo livre continua liberado.</small>
          </>
        ) : (
          <button className="botao-grande primario" onClick={jogarDesafio}>
            {desafioHojeSalvo ? 'Continuar o desafio' : 'Jogar o desafio'}
            {desafioHojeSalvo && <small>{status(desafioHojeSalvo)}</small>}
          </button>
        )}
      </div>

      {emAndamento(livre) && clubeLivre && livre && (
        <button className="botao-grande secundario continuar" onClick={() => continuar('livre')}>
          <Faixa clube={clubeLivre} />
          <span>Continuar partida livre<small>{clubeLivre.nome} · {status(livre)}</small></span>
        </button>
      )}

      <button className="botao-grande primario" onClick={novoJogo}>Modo livre</button>

      <button className="botao-grande secundario" onClick={abrirColecao}>
        Álbum, conquistas e recordes
        <small>{conquistas} conquista{conquistas === 1 ? '' : 's'} · {progresso.recordes.titulos} título{progresso.recordes.titulos === 1 ? '' : 's'}</small>
      </button>

      <button className="link-discreto" onClick={abrirDados}>Conferir dados</button>
    </div>
  );
}
