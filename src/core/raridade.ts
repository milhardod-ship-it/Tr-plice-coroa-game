export type Raridade = 'bronze' | 'prata' | 'ouro' | 'lenda';

export function raridade(nota: number): Raridade {
  if (nota >= 88) return 'lenda';
  if (nota >= 80) return 'ouro';
  if (nota >= 70) return 'prata';
  return 'bronze';
}

export const NOME_RARIDADE: Record<Raridade, string> = {
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
  lenda: 'Lenda',
};
