import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { montarPool } from '../src/core/pool';
import { jogarTorneio } from '../src/core/torneio';
import { analisarCampanha } from '../src/core/campanha';
import { FORMACOES } from '../src/core/formacoes';
import type { Time } from '../src/core/motor';

const DATA = join(__dirname, '..', 'data');
const ler = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const pool = montarPool(readdirSync(join(DATA, 'clubes')).map((f) => ler(join(DATA, 'clubes', f))), ler(join(DATA, 'adversarios.json')), ler(join(DATA, 'finalistas-libertadores.json')));
const confrontos = ler(join(DATA, 'confrontos.json')).confrontos;
const meu = (nota: number): Time => ({
  id: 'm', nome: 'Meu', estilo: 'equilibrado',
  escalacao: FORMACOES['4-3-3'].vagas.map((v, i) => ({ jogador: { nome: `J${i}`, posicao: v, alternativas: [], nota }, vaga: v })),
});

describe('análise da campanha', () => {
  it('mensagens coerentes com o desfecho em centenas de campanhas', () => {
    let pen = 0, invictos = 0, grupos = 0;
    for (let s = 1; s <= 400; s++) {
      const t = jogarTorneio({ meu: meu(s % 2 ? 84 : 90), meuClubeId: 'x', pool, confrontos, seed: s });
      const a = analisarCampanha(t);
      const ult = t.jogos[t.jogos.length - 1];
      expect(a.v + a.e + a.d).toBe(t.jogos.length);
      expect(a.quase.length).toBeGreaterThan(0);
      if (a.campeao) {
        expect(a.titulo).toMatch(/Campeão/);
        if (a.invicto) { invictos++; expect(t.jogos.every((j) => j.r.golsA >= j.r.golsB)).toBe(true); }
      } else if (t.faseFinal === 'grupos') {
        grupos++;
        expect(a.posicaoGrupo).toBeGreaterThan(2);
      } else if (ult.r.penaltis) {
        pen++;
        expect(a.quase[0]).toContain(`pênaltis por ${ult.r.penaltis.golsB} a ${ult.r.penaltis.golsA}`);
      }
      if (a.artilheiro) expect(a.artilheiro.gols).toBeGreaterThan(0);
    }
    expect(pen).toBeGreaterThan(0);
    expect(invictos).toBeGreaterThan(0);
    expect(grupos).toBeGreaterThan(0);
  });
});
