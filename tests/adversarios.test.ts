import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { montarPool } from '../src/core/pool';
import { simularPartida } from '../src/core/motor';
import { Rng } from '../src/core/rng';

const DATA = join(__dirname, '..', 'data');
const ler = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const clubes = readdirSync(join(DATA, 'clubes')).map((f) => ler(join(DATA, 'clubes', f)));
const adv = ler(join(DATA, 'adversarios.json'));
const fin = ler(join(DATA, 'finalistas-libertadores.json'));

describe('pool de adversários', () => {
  const pool = montarPool(clubes, adv, fin);

  it('todo finalista fora dos 12 clubes tem elenco', () => {
    const ids = new Set(clubes.map((c: { id: string }) => c.id));
    for (const f of fin.finais) {
      for (const c of [f.campeao, f.vice]) {
        if (ids.has(c.id)) continue;
        expect(pool.some((p) => p.chave === `${c.id}-${f.ano}`), `${c.nome} ${f.ano}`).toBe(true);
      }
    }
  });

  it('marca os campeões da Libertadores', () => {
    expect(pool.find((p) => p.chave === 'boca-juniors-2000')?.campeaoLibertadores).toBe(true);
    expect(pool.find((p) => p.chave === 'boca-juniors-2004')?.campeaoLibertadores).toBe(false);
    expect(pool.find((p) => p.chave === 'flamengo-1981')?.campeaoLibertadores).toBe(true);
  });

  it('todos os times do pool jogam uma partida sem erro', () => {
    const rng = new Rng(1);
    for (const p of pool) {
      expect(p.time.escalacao).toHaveLength(11);
      const r = simularPartida(p.time, pool[0].time, rng);
      expect(r.golsA).toBeGreaterThanOrEqual(0);
    }
  });

  it('forças ficam numa faixa plausível', () => {
    for (const p of pool) {
      expect(p.forca, p.chave).toBeGreaterThan(70);
      expect(p.forca, p.chave).toBeLessThan(90);
    }
  });
});
