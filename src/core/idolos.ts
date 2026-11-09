/**
 * Ídolos: jogadores de nota alta (85+) numa temporada com título grande.
 * Ao serem escolhidos no draft, ganham um texto de entrada especial.
 */
import { Rng } from './rng';
import type { Jogador, Temporada } from './tipos';

export const NOTA_IDOLO = 85;

export const ehIdolo = (j: Jogador, t: Temporada) => j.nota >= NOTA_IDOLO && t.titulos.length > 0;

const FRASES = [
  'O ÍDOLO CHEGOU! {nome}, do {clube} campeão da {titulo} em {ano}!',
  'A torcida canta o nome dele: {nome}! Herói da {titulo} de {ano}!',
  'Respeita a história: {nome}, {clube} {ano}, campeão da {titulo}!',
  'Arrepiou! {nome} veste a camisa de novo. {titulo} {ano} no currículo!',
];

export function textoIdolo(j: Jogador, t: Temporada, clube: string, seed: number): string {
  const rng = new Rng(seed);
  const titulo = t.titulos[0].replace(/^Copa /, '');
  return rng.item(FRASES).replace('{nome}', j.nome).replace('{clube}', clube).replace('{titulo}', titulo).replace(/\{ano\}/g, String(t.ano));
}
