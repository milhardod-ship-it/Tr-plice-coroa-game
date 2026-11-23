// Tipos centrais do Radar de Encartes.
// Tudo em src/core é puro (sem React, sem navegador): no futuro roda igual no servidor.

export type MercadoId = 'guanabara' | 'mundial' | 'atacadao' | 'prezunic' | 'supermarket' | 'assai';

export interface Mercado {
  id: MercadoId;
  nome: string;
  /** Programas de vantagem que o usuário pode marcar no perfil. */
  programas: Programa[];
}

/** Um app, clube ou cartão que dá preço especial. */
export interface Programa {
  id: ProgramaId;
  nome: string;
  descricao: string;
}

export type ProgramaId =
  | 'guana-clube'
  | 'mundial-total'
  | 'meu-atacadao'
  | 'cartao-atacadao';

/** Tamanho da embalagem já convertido para a unidade-base. */
export interface Tamanho {
  /** Quantidade total na embalagem, em g, ml ou unidades. */
  valor: number;
  unidade: 'g' | 'ml' | 'un';
}

/**
 * Um preço possível para a oferta. `exige` lista os programas que o cliente
 * precisa ter (vazio = qualquer pessoa paga esse preço no caixa).
 */
export interface Preco {
  valor: number;
  exige: ProgramaId[];
  /** Texto curto da condição: "Leve 4, pague 3", "no app Mundial Total"… */
  condicao?: string;
}

export interface Encarte {
  id: string;
  mercado: MercadoId;
  titulo: string;
  /** Datas no formato AAAA-MM-DD, inclusivas. */
  inicio: string;
  fim: string;
  /** Lojas onde vale. Vazio = todas as lojas da rede no estado. */
  lojas: string[];
  fonte: string;
}

export interface Oferta {
  id: string;
  mercado: MercadoId;
  encarte: string;
  /** Identificador do produto "canônico": ofertas iguais em mercados diferentes têm o mesmo. */
  produto: string;
  /** Nome para exibir, sem marca e sem tamanho. Ex.: "Arroz Parboilizado". */
  nome: string;
  marca: string;
  /** Texto do jeito que estava no encarte (para conferência). */
  original: string;
  categoria: Categoria;
  /** Tamanho da embalagem. Para produto vendido por quilo: { valor: 1000, unidade: 'g' }. */
  tamanho: Tamanho | null;
  porKg: boolean;
  precos: Preco[];
  /** Preço "de" (antes da promoção), se o encarte mostrar. */
  precoDe?: number;
  /** Data final desta oferta (pode ser antes do fim do encarte). */
  fim?: string;
  limite?: string;
  /** Foto do produto publicada pelo mercado (quando a fonte tem). */
  imagem?: string;
  revisado: boolean;
}

export type Categoria =
  | 'Açougue'
  | 'Hortifrúti'
  | 'Frios e Laticínios'
  | 'Mercearia'
  | 'Bebidas'
  | 'Limpeza'
  | 'Higiene'
  | 'Congelados'
  | 'Outros';

export const CATEGORIAS: Categoria[] = [
  'Açougue',
  'Hortifrúti',
  'Frios e Laticínios',
  'Mercearia',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Congelados',
  'Outros',
];

export interface Perfil {
  programas: ProgramaId[];
}

export interface ItemLista {
  produto: string;
  quantidade: number;
}
