/**
 * Gerador de números aleatórios com seed (mulberry32).
 * O estado é um único número inteiro, fácil de salvar e retomar.
 * Mesma seed ⇒ mesmos sorteios (base do Desafio do Dia e do multiplayer).
 */
export class Rng {
  constructor(public estado: number) {
    this.estado = estado >>> 0;
  }

  /** Número em [0, 1). */
  proximo(): number {
    this.estado = (this.estado + 0x6d2b79f5) >>> 0;
    let t = this.estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Inteiro em [0, n). */
  inteiro(n: number): number {
    return Math.floor(this.proximo() * n);
  }

  item<T>(lista: readonly T[]): T {
    return lista[this.inteiro(lista.length)];
  }
}

/** Transforma um texto (ex.: "desafio-2026-11-09") numa seed numérica. */
export function seedDeTexto(texto: string): number {
  let h = 1779033703 ^ texto.length;
  for (let i = 0; i < texto.length; i++) {
    h = Math.imul(h ^ texto.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}
