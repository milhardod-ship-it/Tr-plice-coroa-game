import type { ClubeJogavel } from '../core/tipos';
import { CLUBES } from '../dados';

export const clubePorId = (id: string): ClubeJogavel => CLUBES.find((c) => c.id === id)!;

/** "Juninho Pernambucano" → "Juninho P."; nomes curtos ficam inteiros. */
export function nomeCurto(nome: string): string {
  if (nome.length <= 11) return nome;
  const partes = nome.split(' ');
  if (partes.length === 1) return nome;
  return `${partes[0]} ${partes[partes.length - 1][0]}.`;
}

export const varsClube = (c: ClubeJogavel) =>
  ({ '--clube-1': c.cores.primaria, '--clube-2': c.cores.secundaria }) as React.CSSProperties;
