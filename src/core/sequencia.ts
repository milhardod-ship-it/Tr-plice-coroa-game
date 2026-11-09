/**
 * Sequência de dias jogando o Desafio, com 1 dia de folga permitido:
 * pular um dia não quebra; pular dois dias seguidos quebra.
 * O dia de hoje ainda não jogado não conta como falta (ainda dá tempo).
 */
import { paraDias } from './datas';

export function sequencia(jogados: string[], hoje: string): { atual: number; melhor: number } {
  const dias = new Set(jogados.map(paraDias));
  const h = paraDias(hoje);

  let atual = 0;
  let faltas = 0;
  for (let d = h; d >= h - 3660; d--) {
    if (dias.has(d)) { atual++; faltas = 0; }
    else if (d !== h) { faltas++; if (faltas >= 2) break; }
  }

  let melhor = 0;
  const ordenados = [...dias].sort((a, b) => a - b);
  let corrente = 0;
  for (let i = 0; i < ordenados.length; i++) {
    corrente = i > 0 && ordenados[i] - ordenados[i - 1] <= 2 ? corrente + 1 : 1;
    melhor = Math.max(melhor, corrente);
  }
  return { atual, melhor: Math.max(melhor, atual) };
}
