// Robô de coleta: busca as ofertas nos sites dos mercados e salva em data/brutos/.
// Uso:  npm run coletar               (todos)
//       npm run coletar -- guanabara  (só um)
// Depois rode `npm run importar` (o build já faz isso) para atualizar data/ofertas.json.
import { readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { coletarGuanabara } from '../src/coleta/guanabara';
import { criarBaixar } from '../src/coleta/http';
import { coletarMundial } from '../src/coleta/mundial';

const BRUTOS = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'brutos');
const pedidos = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const quer = (m: string) => pedidos.length === 0 || pedidos.includes(m);
const baixar = criarBaixar();
const hoje = new Date().toISOString().slice(0, 10);
let falhas = 0;

function salvar(nome: string, dados: unknown) {
  writeFileSync(join(BRUTOS, nome), JSON.stringify(dados, null, 1) + '\n');
  console.log(`  salvo data/brutos/${nome}`);
}

if (quer('guanabara')) {
  try {
    console.log('Guanabara…');
    const c = coletarGuanabara(baixar);
    console.log(`  ${c.itens.length} ofertas, válidas de ${c.inicio} a ${c.fim}`);
    // Um arquivo por encarte: coletar de novo o mesmo encarte só atualiza o arquivo.
    salvar(`guanabara-site-${c.inicio}.json`, c);
  } catch (e) {
    falhas++;
    console.error(`  ERRO: ${(e as Error).message}`);
  }
}

if (quer('mundial')) {
  try {
    console.log('Mundial…');
    const c = coletarMundial(baixar);
    console.log(`  ${c.ofertas.length} ofertas; encartes: ${c.encartes.map((e) => e.descricao).join(' | ')}`);
    // A lista do Mundial é o retrato do momento: fica só a coleta mais recente.
    for (const f of readdirSync(BRUTOS)) if (f.startsWith('mundial-site-')) unlinkSync(join(BRUTOS, f));
    salvar(`mundial-site-${hoje}.json`, c);
  } catch (e) {
    falhas++;
    console.error(`  ERRO: ${(e as Error).message}`);
  }
}

if (falhas) process.exit(1);
