import type { EstadoDraft } from '../core/draft';
import { FORMACOES } from '../core/formacoes';
import { CLUBES } from '../dados';

const CHAVE = 'tc:partida:v1';

export function salvarPartida(d: EstadoDraft | null) {
  try {
    if (d) localStorage.setItem(CHAVE, JSON.stringify(d));
    else localStorage.removeItem(CHAVE);
  } catch {
    /* modo privado / armazenamento cheio: o jogo segue sem salvar */
  }
}

export function carregarPartida(): EstadoDraft | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const d = JSON.parse(bruto) as EstadoDraft;
    const f = FORMACOES[d.formacao];
    const ok = f && CLUBES.some((c) => c.id === d.clubeId) && d.escalacao?.length === f.vagas.length;
    return ok ? d : null;
  } catch {
    return null;
  }
}

export function novaSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
