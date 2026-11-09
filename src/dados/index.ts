/**
 * Carrega os JSONs de /data no bundle do navegador.
 * Basta criar/editar arquivos em data/clubes/*.json — o glob pega tudo.
 */
import type { ArquivoAdversarios, ArquivoConfrontos, ArquivoFinalistas, ClubeJogavel } from '../core/tipos';
import confrontosJson from '../../data/confrontos.json';
import adversariosJson from '../../data/adversarios.json';
import finalistasJson from '../../data/finalistas-libertadores.json';

const modulos = import.meta.glob<ClubeJogavel>('../../data/clubes/*.json', { eager: true, import: 'default' });

/** Ordem de exibição na tela de escolha. */
export const ORDEM_CLUBES = [
  'flamengo', 'fluminense', 'vasco', 'botafogo',
  'corinthians', 'palmeiras', 'sao-paulo', 'santos',
  'atletico-mg', 'cruzeiro', 'gremio', 'internacional',
];

export const CLUBES: ClubeJogavel[] = Object.values(modulos).sort(
  (a, b) => ORDEM_CLUBES.indexOf(a.id) - ORDEM_CLUBES.indexOf(b.id),
);
export const ADVERSARIOS = adversariosJson as ArquivoAdversarios;
export const FINALISTAS = finalistasJson as ArquivoFinalistas;

import { montarPool } from '../core/pool';
/** Todos os times históricos (adversários + temporadas dos clubes jogáveis). */
export const POOL = montarPool(CLUBES, ADVERSARIOS, FINALISTAS);

export const CONFRONTOS = (confrontosJson as ArquivoConfrontos).confrontos;
