/**
 * npm run validar          → falha só com ERROS (dados que quebrariam o jogo)
 * npm run validar:estrito  → também falha se algum finalista estiver sem elenco
 * Roda antes de todo `npm run build`, então dados quebrados não chegam à Vercel.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validarDados } from '../src/core/validacao';
import type { ArquivoAdversarios, ArquivoFinalistas, ClubeJogavel } from '../src/core/tipos';

const DATA = join(import.meta.dirname, '..', 'data');
const ler = <T>(arq: string): T => {
  try {
    return JSON.parse(readFileSync(arq, 'utf8')) as T;
  } catch (e) {
    console.error(`✖ JSON inválido em ${arq}: ${(e as Error).message}`);
    process.exit(1);
  }
};

const clubes = readdirSync(join(DATA, 'clubes'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => ler<ClubeJogavel>(join(DATA, 'clubes', f)));
const adversarios = ler<ArquivoAdversarios>(join(DATA, 'adversarios.json'));
const finalistas = ler<ArquivoFinalistas>(join(DATA, 'finalistas-libertadores.json'));

const { erros, avisos, pendentes } = validarDados(clubes, adversarios, finalistas);
const estrito = process.argv.includes('--estrito');

const temporadas = clubes.reduce((s, c) => s + c.temporadas.length, 0);
const jogadores = clubes.reduce((s, c) => s + c.temporadas.reduce((t, x) => t + x.jogadores.length, 0), 0);
console.log(`Clubes: ${clubes.length} | temporadas: ${temporadas} | jogadores: ${jogadores} | adversários: ${adversarios.adversarios.length} | finais: ${finalistas.finais.length}`);

if (avisos.length) console.log(`\n⚠ ${avisos.length} aviso(s):\n  ` + avisos.join('\n  '));
if (pendentes.length) console.log(`\n… ${pendentes.length} finalista(s) sem elenco ainda:\n  ` + pendentes.join('\n  '));
if (erros.length) console.log(`\n✖ ${erros.length} erro(s):\n  ` + erros.join('\n  '));

const falhou = erros.length > 0 || (estrito && pendentes.length > 0);
console.log(falhou ? '\nValidação FALHOU.' : '\n✔ Validação OK.');
process.exit(falhou ? 1 : 0);
