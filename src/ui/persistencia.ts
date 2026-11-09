import type { EstadoDraft } from '../core/draft';
import { FORMACOES } from '../core/formacoes';
import { progressoVazio, type Novidades, type Progresso } from '../core/progresso';
import type { Torneio } from '../core/torneio';
import { CLUBES } from '../dados';

/** Duas partidas independentes: o modo livre e o Desafio do Dia. */
export type Slot = 'livre' | 'desafio';
const CHAVES: Record<Slot, string> = { livre: 'tc:partida:v1', desafio: 'tc:desafio:v1' };
const CHAVE_PROGRESSO = 'tc:progresso:v1';

/** Uma partida = draft + (depois) torneio já simulado + quantos jogos o jogador já assistiu. */
export interface PartidaSalva {
  draft: EstadoDraft;
  torneio?: Torneio;
  vistos: number;
  /** Só no Desafio do Dia. */
  desafio?: { data: string; numero: number };
  /** Já contou para álbum/recordes/conquistas (evita contar duas vezes). */
  registrada?: boolean;
  novidades?: Novidades;
}

const ler = (chave: string) => {
  try { return localStorage.getItem(chave); } catch { return null; }
};
const gravar = (chave: string, valor: string | null) => {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
  } catch { /* modo privado / armazenamento cheio: o jogo segue sem salvar */ }
};

export function salvarPartida(slot: Slot, p: PartidaSalva | null) {
  gravar(CHAVES[slot], p ? JSON.stringify(p) : null);
}

export function carregarPartida(slot: Slot): PartidaSalva | null {
  try {
    const bruto = ler(CHAVES[slot]);
    if (!bruto) return null;
    const obj = JSON.parse(bruto);
    // Formato antigo (etapa 2): só o draft.
    const p: PartidaSalva = obj.escalacao ? { draft: obj, vistos: 0 } : obj;
    const d = p.draft;
    const f = FORMACOES[d?.formacao];
    const ok = f && CLUBES.some((c) => c.id === d.clubeId) && d.escalacao?.length === f.vagas.length;
    if (!ok) return null;
    if (p.torneio && !Array.isArray(p.torneio.jogos)) return { ...p, torneio: undefined, vistos: 0 };
    return { ...p, vistos: p.vistos ?? 0 };
  } catch {
    return null;
  }
}

export function carregarProgresso(): Progresso {
  try {
    const bruto = ler(CHAVE_PROGRESSO);
    if (!bruto) return progressoVazio();
    const p = JSON.parse(bruto) as Progresso;
    const base = progressoVazio();
    return { ...base, ...p, recordes: { ...base.recordes, ...p.recordes } };
  } catch {
    return progressoVazio();
  }
}

export const salvarProgresso = (p: Progresso) => gravar(CHAVE_PROGRESSO, JSON.stringify(p));

export function novaSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

/** Data local de hoje, "AAAA-MM-DD". */
export function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
