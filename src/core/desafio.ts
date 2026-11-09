/**
 * Desafio do Dia: uma seed por data, igual para todos (estilo Wordle).
 * Mesma data ⇒ mesmo clube, mesmos sorteios do draft e mesmos rivais na Libertadores.
 */
import { paraDias } from './datas';
import { Rng, seedDeTexto } from './rng';
import type { Torneio } from './torneio';

/** Dia do Desafio #1. */
export const INICIO_DESAFIOS = '2026-11-01';

export const numeroDesafio = (data: string) => paraDias(data) - paraDias(INICIO_DESAFIOS) + 1;

export interface DesafioDoDia {
  data: string;
  numero: number;
  seed: number;
  clubeId: string;
}

/** `clubes`: ids dos clubes com temporadas cadastradas, em ordem fixa. */
export function desafioDoDia(data: string, clubes: string[]): DesafioDoDia {
  const seed = seedDeTexto(`tc-desafio-${data}`);
  const clubeId = new Rng(seed).item([...clubes].sort());
  return { data, numero: numeroDesafio(data), seed, clubeId };
}

/** Um quadradinho por jogo: verde vitória, amarelo empate, vermelho derrota; pênaltis em azul/laranja. */
export function quadrados(t: Torneio): string {
  const q = (j: Torneio['jogos'][number]) => {
    if (j.r.penaltis) return j.r.vencedor === 'a' ? '🟦' : '🟧';
    return j.r.golsA > j.r.golsB ? '🟩' : j.r.golsA < j.r.golsB ? '🟥' : '🟨';
  };
  const grupos = t.jogos.filter((j) => j.fase === 'grupos').map(q).join('');
  const mm = t.jogos.filter((j) => j.fase !== 'grupos').map(q).join('');
  return mm ? `${grupos} ${mm}` : grupos;
}

export function textoCompartilharDesafio(numero: number, clubeNome: string, titulo: string, t: Torneio, url: string): string {
  const trofeu = t.desfecho === 'campeao' ? '🏆' : '⚽';
  return `Tríplice Coroa · Desafio #${numero}\n${clubeNome} · ${trofeu} ${titulo}\n${quadrados(t)}\n${url}`;
}
