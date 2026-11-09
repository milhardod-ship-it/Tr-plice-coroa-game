import { raridade, NOME_RARIDADE } from '../../core/raridade';
import type { Jogador } from '../../core/tipos';

export function Carta({
  jogador, oculta, usada, atraso, onClick,
}: { jogador: Jogador; oculta: boolean; usada: boolean; atraso: number; onClick?: () => void }) {
  const r = raridade(jogador.nota);
  const classe = oculta ? 'r-oculta' : `r-${r}`;
  return (
    <button
      className={`carta ${classe} ${usada ? 'usada' : ''}`}
      style={{ animationDelay: `${atraso}ms` }}
      disabled={usada}
      onClick={onClick}
    >
      <span className="carta-topo">
        <span className="carta-pos">{jogador.posicao}</span>
        {!oculta && <span className="carta-nota">{jogador.nota}</span>}
      </span>
      <span className="carta-nome">{jogador.nome}</span>
      <span className="carta-rodape">
        {usada ? 'já escalado' : jogador.alternativas.length ? `também ${jogador.alternativas.join(', ')}` : ' '}
        {!oculta && !usada && <em>{NOME_RARIDADE[r]}</em>}
      </span>
    </button>
  );
}
