import type { Posicao } from './tipos';

export type FormacaoId = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1';

export interface Formacao {
  id: FormacaoId;
  /** As 11 vagas, do goleiro para o ataque. */
  vagas: Posicao[];
}

export const FORMACOES: Record<FormacaoId, Formacao> = {
  '4-4-2': { id: '4-4-2', vagas: ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'VOL', 'MEI', 'MEI', 'ATA', 'ATA'] },
  '4-3-3': { id: '4-3-3', vagas: ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'MC', 'MEI', 'PD', 'PE', 'ATA'] },
  '3-5-2': { id: '3-5-2', vagas: ['GOL', 'ZAG', 'ZAG', 'ZAG', 'LD', 'LE', 'VOL', 'MC', 'MEI', 'ATA', 'ATA'] },
  '4-2-3-1': { id: '4-2-3-1', vagas: ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'VOL', 'PD', 'MEI', 'PE', 'ATA'] },
};

export const LISTA_FORMACOES = Object.values(FORMACOES);
