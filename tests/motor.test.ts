import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  disputaDePenaltis, escalarAutomatico, estatisticas, forcas, simularPartida, type Time,
} from '../src/core/motor';
import { Rng } from '../src/core/rng';
import { FORMACOES } from '../src/core/formacoes';
import type { Estilo } from '../src/core/draft';
import type { ClubeJogavel, Posicao } from '../src/core/tipos';

const VAGAS = FORMACOES['4-3-3'].vagas;

/** Time sintético: todos na posição natural com a mesma nota. */
function time(nome: string, nota: number, estilo: Estilo = 'equilibrado', vagas: Posicao[] = VAGAS): Time {
  return {
    id: nome,
    nome,
    estilo,
    escalacao: vagas.map((vaga, i) => ({ jogador: { nome: `${nome} ${i}`, posicao: VAGAS[i], alternativas: [], nota }, vaga })),
  };
}

describe('motor de simulação', () => {
  it('time de notas 90 vence time de notas 70 na grande maioria de 1000 jogos', () => {
    const e = estatisticas(time('Forte', 90), time('Fraco', 70), 1000, 1);
    expect(e.vitoriasA).toBeGreaterThan(0.85);
    expect(e.vitoriasB).toBeLessThan(0.05);
  });

  it('times iguais: resultados equilibrados e média de gols realista', () => {
    const e = estatisticas(time('A', 80), time('B', 80), 2000, 2);
    expect(Math.abs(e.vitoriasA - e.vitoriasB)).toBeLessThan(0.06);
    expect(e.empates).toBeGreaterThan(0.18);
    expect(e.empates).toBeLessThan(0.36);
    expect(e.mediaGols).toBeGreaterThan(2);
    expect(e.mediaGols).toBeLessThan(3.2);
  });

  it('pequenas diferenças não decidem tudo (zebra existe)', () => {
    const e = estatisticas(time('A', 84), time('B', 80), 2000, 3);
    expect(e.vitoriasA).toBeGreaterThan(e.vitoriasB);
    expect(e.vitoriasB).toBeGreaterThan(0.15);
  });

  it('mando de campo ajuda', () => {
    const casa = estatisticas(time('A', 80), time('B', 80), 3000, 4, 'a');
    expect(casa.vitoriasA).toBeGreaterThan(casa.vitoriasB);
  });

  it('ofensivo gera jogos com mais gols que defensivo', () => {
    const of = estatisticas(time('A', 80, 'ofensivo'), time('B', 80), 2000, 5);
    const de = estatisticas(time('A', 80, 'defensivo'), time('B', 80), 2000, 5);
    expect(of.mediaGols).toBeGreaterThan(de.mediaGols + 0.4);
  });

  it('jogadores improvisados enfraquecem o time', () => {
    const certo = time('Certo', 82);
    const bagunca = time('Bagunça', 82, 'equilibrado', [...VAGAS].reverse());
    expect(forcas(bagunca).ataque).toBeLessThan(forcas(certo).ataque);
    const e = estatisticas(certo, bagunca, 1000, 6);
    expect(e.vitoriasA).toBeGreaterThan(0.75);
  });

  it('é determinístico pela seed', () => {
    const a = time('A', 82), b = time('B', 79);
    expect(simularPartida(a, b, new Rng(42))).toEqual(simularPartida(a, b, new Rng(42)));
  });

  it('placar bate com a lista de gols, e gols têm minuto e autor', () => {
    const a = time('A', 85), b = time('B', 78);
    const rng = new Rng(7);
    for (let i = 0; i < 300; i++) {
      const r = simularPartida(a, b, rng);
      expect(r.gols.filter((g) => g.time === 'a')).toHaveLength(r.golsA);
      expect(r.gols.filter((g) => g.time === 'b')).toHaveLength(r.golsB);
      for (const g of r.gols) {
        expect(g.minuto).toBeGreaterThanOrEqual(1);
        expect(g.minuto).toBeLessThanOrEqual(95);
        expect(g.autor).toBeTruthy();
      }
    }
  });

  it('atacantes marcam muito mais que zagueiros', () => {
    const a = time('A', 80);
    const rng = new Rng(8);
    const porVaga: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) {
      for (const g of simularPartida(a, time('B', 80), rng).gols) {
        if (g.time !== 'a' || g.contra) continue;
        const vaga = a.escalacao.find((e) => e.jogador.nome === g.autor)!.vaga;
        porVaga[vaga] = (porVaga[vaga] ?? 0) + 1;
      }
    }
    expect(porVaga.ATA).toBeGreaterThan(3 * ((porVaga.ZAG ?? 0) / 2));
    expect(porVaga.GOL ?? 0).toBeLessThan(porVaga.ATA / 50);
  });

  it('mata-mata sempre tem vencedor; pênaltis são válidos', () => {
    const a = time('A', 80), b = time('B', 80);
    const rng = new Rng(9);
    let foramAosPenaltis = 0;
    for (let i = 0; i < 500; i++) {
      const r = simularPartida(a, b, rng, { mataMata: true });
      expect(r.vencedor).not.toBeNull();
      if (r.penaltis) {
        foramAosPenaltis++;
        const p = r.penaltis;
        expect(p.golsA).not.toBe(p.golsB);
        expect(p.cobrancas.filter((c) => c.time === 'a' && c.convertido)).toHaveLength(p.golsA);
        expect(p.cobrancas.length).toBeGreaterThanOrEqual(6);
      }
    }
    expect(foramAosPenaltis).toBeGreaterThan(50);
  });

  it('pênaltis encerram cedo quando já decididos', () => {
    const rng = new Rng(10);
    let curtas = 0;
    for (let i = 0; i < 500; i++) if (disputaDePenaltis(time('A', 80), time('B', 80), rng).cobrancas.length < 10) curtas++;
    expect(curtas).toBeGreaterThan(0);
  });

  it('escala automaticamente 11 de um elenco real, sem repetir', () => {
    const fla: ClubeJogavel = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'clubes', 'flamengo.json'), 'utf8'));
    for (const t of fla.temporadas) {
      const esc = escalarAutomatico(t.jogadores);
      expect(esc).toHaveLength(11);
      expect(new Set(esc.map((e) => e.jogador.nome)).size).toBe(11);
      expect(esc.filter((e) => e.vaga === 'GOL')).toHaveLength(1);
    }
  });
});
