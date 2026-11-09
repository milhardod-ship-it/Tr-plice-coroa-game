import type { EstadoDraft } from '../core/draft';
import { FORMACOES } from '../core/formacoes';
import type { Torneio } from '../core/torneio';
import { CLUBES } from '../dados';

const CHAVE = 'tc:partida:v1';

/** Uma partida = draft + (depois) torneio já simulado + quantos jogos o jogador já assistiu. */
export interface PartidaSalva {
  draft: EstadoDraft;
  torneio?: Torneio;
  vistos: number;
}

export function salvarPartida(p: PartidaSalva | null) {
  try {
    if (p) localStorage.setItem(CHAVE, JSON.stringify(p));
    else localStorage.removeItem(CHAVE);
  } catch {
    /* modo privado / armazenamento cheio: o jogo segue sem salvar */
  }
}

export function carregarPartida(): PartidaSalva | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const obj = JSON.parse(bruto);
    // Formato antigo (etapa 2): só o draft.
    const p: PartidaSalva = obj.escalacao ? { draft: obj, vistos: 0 } : obj;
    const d = p.draft;
    const f = FORMACOES[d?.formacao];
    const ok = f && CLUBES.some((c) => c.id === d.clubeId) && d.escalacao?.length === f.vagas.length;
    if (!ok) return null;
    if (p.torneio && !Array.isArray(p.torneio.jogos)) return { draft: d, vistos: 0 };
    return { draft: d, torneio: p.torneio, vistos: p.vistos ?? 0 };
  } catch {
    return null;
  }
}

export function novaSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
