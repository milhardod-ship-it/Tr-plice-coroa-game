/**
 * Tipos do domínio. Este arquivo (e tudo em src/core) não importa nada de UI,
 * para que o motor possa rodar no servidor no futuro (multiplayer).
 */

export const POSICOES = ['GOL', 'LD', 'ZAG', 'LE', 'VOL', 'MC', 'MEI', 'PD', 'PE', 'ATA'] as const;
export type Posicao = (typeof POSICOES)[number];

export const NOME_POSICAO: Record<Posicao, string> = {
  GOL: 'Goleiro',
  LD: 'Lateral-direito',
  ZAG: 'Zagueiro',
  LE: 'Lateral-esquerdo',
  VOL: 'Volante',
  MC: 'Meio-campista',
  MEI: 'Meia',
  PD: 'Ponta-direita',
  PE: 'Ponta-esquerda',
  ATA: 'Atacante',
};

export const NOTA_MIN = 40;
export const NOTA_MAX = 99;

export interface Jogador {
  nome: string;
  posicao: Posicao;
  alternativas: Posicao[];
  /** Nota do jogador NAQUELA temporada (40–99), não na carreira. */
  nota: number;
  /** true = baixa confiança de que estava neste elenco (revisar primeiro). */
  duvida?: boolean;
}

export interface Temporada {
  ano: number;
  /** Texto livre: "Campeão da Libertadores", "Vice da Copa do Brasil"... */
  observacao: string;
  /** Títulos conquistados. Lista não vazia = "Temporada Lendária" no draft. */
  titulos: string[];
  revisado: boolean;
  jogadores: Jogador[];
}

export interface Cores {
  primaria: string;
  secundaria: string;
}

export interface ClubeJogavel {
  id: string;
  nome: string;
  cores: Cores;
  temporadas: Temporada[];
}

export interface ElencoAdversario {
  /** Mesmo id usado na lista de finalistas (ex.: "boca-juniors"). */
  id: string;
  nome: string;
  pais: string;
  ano: number;
  observacao: string;
  revisado: boolean;
  /** Exatamente 11. */
  titulares: Jogador[];
  /** Até 3. */
  reservas: Jogador[];
}

export interface ArquivoAdversarios {
  adversarios: ElencoAdversario[];
}

export interface ClubeFinalista {
  /** Se for um dos 12 jogáveis, é o id do arquivo do clube (ex.: "vasco"). */
  id: string;
  nome: string;
  pais: string;
}

export interface Final {
  ano: number;
  campeao: ClubeFinalista;
  vice: ClubeFinalista;
  revisado: boolean;
}

export interface ArquivoFinalistas {
  descricao: string;
  finais: Final[];
}
