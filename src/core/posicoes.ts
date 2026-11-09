import type { Jogador, Posicao } from './tipos';

/**
 * Penalidade por jogar fora da posição.
 * - natural: 0
 * - alternativa (posição que o jogador também fazia): -3
 * - improvisado: depende da distância entre os setores do campo
 *   (mesmo setor -8, setor vizinho -14, setores opostos -22);
 *   goleiro na linha ou jogador de linha no gol: -35.
 */
export type Encaixe = 'natural' | 'alternativa' | 'improvisado';

const SETOR: Record<Posicao, number> = {
  GOL: 0,
  LD: 1, ZAG: 1, LE: 1,
  VOL: 2, MC: 2, MEI: 2,
  PD: 3, PE: 3, ATA: 3,
};

export const NOTA_EFETIVA_MIN = 30;

export function encaixe(j: Jogador, vaga: Posicao): Encaixe {
  if (j.posicao === vaga) return 'natural';
  if (j.alternativas.includes(vaga)) return 'alternativa';
  return 'improvisado';
}

export function penalidade(j: Jogador, vaga: Posicao): number {
  const e = encaixe(j, vaga);
  if (e === 'natural') return 0;
  if (e === 'alternativa') return 3;
  if (j.posicao === 'GOL' || vaga === 'GOL') return 35;
  const dist = Math.abs(SETOR[j.posicao] - SETOR[vaga]);
  return [8, 14, 22][dist];
}

export function notaEfetiva(j: Jogador, vaga: Posicao): number {
  return Math.max(NOTA_EFETIVA_MIN, j.nota - penalidade(j, vaga));
}
