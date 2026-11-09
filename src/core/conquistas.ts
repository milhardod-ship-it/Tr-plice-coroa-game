/** Conquistas: verificadas ao fim de cada campanha, a partir do que aconteceu de fato. */
import { analisarCampanha } from './campanha';
import type { EstadoDraft } from './draft';
import { raridade } from './raridade';
import type { Torneio } from './torneio';

export interface Conquista {
  id: string;
  nome: string;
  emoji: string;
  descricao: string;
}

interface Contexto { draft: EstadoDraft; torneio: Torneio }

const venceuDeVirada = (t: Torneio) =>
  t.jogos.some((j) => {
    if (j.r.vencedor !== 'a' || j.r.golsA <= j.r.golsB) return false;
    let a = 0, b = 0;
    for (const g of j.r.gols) {
      if (g.time === 'a') a++; else b++;
      if (b > a) return true;
    }
    return false;
  });

const REGRAS: (Conquista & { ok: (c: Contexto) => boolean })[] = [
  { id: 'campeao', emoji: '🏆', nome: 'Campeão da América', descricao: 'Ganhe a Libertadores.', ok: ({ torneio }) => torneio.desfecho === 'campeao' },
  { id: 'invicto', emoji: '🛡️', nome: 'Invicto', descricao: 'Seja campeão sem perder nenhum jogo.', ok: ({ torneio }) => analisarCampanha(torneio).invicto },
  { id: 'sete-a-zero', emoji: '7️⃣', nome: '7 a 0', descricao: 'Vença um jogo por 7 ou mais gols de diferença.', ok: ({ torneio }) => torneio.jogos.some((j) => j.r.golsA - j.r.golsB >= 7) },
  { id: 'so-anos-80', emoji: '📼', nome: 'Só anos 80', descricao: 'Seja campeão com os 11 jogadores de temporadas de 1980 a 1989.', ok: ({ torneio, draft }) => torneio.desfecho === 'campeao' && draft.escalacao.every((x) => x && x.ano >= 1980 && x.ano <= 1989) },
  { id: 'virada', emoji: '🔄', nome: 'Virada', descricao: 'Vença um jogo depois de estar perdendo.', ok: ({ torneio }) => venceuDeVirada(torneio) },
  { id: 'muralha', emoji: '🧱', nome: 'Muralha', descricao: 'Seja campeão sofrendo no máximo 2 gols.', ok: ({ torneio }) => torneio.desfecho === 'campeao' && analisarCampanha(torneio).gc <= 2 },
  { id: 'frieza', emoji: '🧊', nome: 'Frieza', descricao: 'Vença uma disputa de pênaltis.', ok: ({ torneio }) => torneio.jogos.some((j) => j.r.penaltis && j.r.vencedor === 'a') },
  { id: 'vinganca', emoji: '⚔️', nome: 'Vingança', descricao: 'Vença um jogo de vingança.', ok: ({ torneio }) => torneio.jogos.some((j) => j.confronto?.tipo === 'vinganca' && j.r.vencedor === 'a') },
  { id: 'almanaque', emoji: '📖', nome: 'Almanaque vivo', descricao: 'Seja campeão no modo Almanaque.', ok: ({ torneio, draft }) => torneio.desfecho === 'campeao' && draft.modo === 'almanaque' },
  { id: 'lendas', emoji: '✨', nome: 'Galeria de lendas', descricao: 'Monte um time com 5 ou mais Lendas.', ok: ({ draft }) => draft.escalacao.filter((x) => x && raridade(x.jogador.nota) === 'lenda').length >= 5 },
];

export const CONQUISTAS: Conquista[] = REGRAS.map(({ id, nome, emoji, descricao }) => ({ id, nome, emoji, descricao }));

export function conquistasDaCampanha(c: Contexto): string[] {
  return REGRAS.filter((r) => r.ok(c)).map((r) => r.id);
}
