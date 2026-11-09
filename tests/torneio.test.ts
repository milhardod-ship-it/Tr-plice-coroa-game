import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { montarPool } from '../src/core/pool';
import { anunciarConfronto, jogarTorneio, resumoCampanha, type Torneio } from '../src/core/torneio';
import { narrarPartida } from '../src/core/narracao';
import { escalarAutomatico, type Time } from '../src/core/motor';
import { ehIdolo } from '../src/core/idolos';
import type { ClubeJogavel } from '../src/core/tipos';

const DATA = join(__dirname, '..', 'data');
const ler = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const clubes: ClubeJogavel[] = readdirSync(join(DATA, 'clubes')).map((f) => ler(join(DATA, 'clubes', f)));
const pool = montarPool(clubes, ler(join(DATA, 'adversarios.json')), ler(join(DATA, 'finalistas-libertadores.json')));
const confrontos = ler(join(DATA, 'confrontos.json')).confrontos;
const vasco = clubes.find((c) => c.id === 'vasco')!;

/** Um "time do jogador" com os melhores do Vasco 1998 (força ~80). */
const meu = (nota?: number): Time => {
  const esc = escalarAutomatico(vasco.temporadas.find((t) => t.ano === 1998)!.jogadores);
  return { id: 'meu', nome: 'Vasco', estilo: 'equilibrado', escalacao: nota ? esc.map((e) => ({ ...e, jogador: { ...e.jogador, nota } })) : esc };
};
const torneio = (seed: number, nota?: number) => jogarTorneio({ meu: meu(nota), meuClubeId: 'vasco', pool, confrontos, seed });

describe('torneio', () => {
  it('é determinístico pela seed', () => {
    expect(torneio(5)).toEqual(torneio(5));
  });

  it('grupo: 3 adversários diferentes, pelo menos 2 estrangeiros, nunca o próprio clube', () => {
    for (let s = 1; s <= 200; s++) {
      const t = torneio(s);
      expect(new Set(t.grupo.map((g) => g.clubeId)).size).toBe(3);
      expect(t.grupo.filter((g) => g.pais !== 'Brasil').length).toBeGreaterThanOrEqual(2);
      for (const j of t.jogos) expect(j.adv.clubeId).not.toBe('vasco');
    }
  });

  it('fase de grupos tem 6 jogos (3 em casa, 3 fora) e tabela coerente', () => {
    const t = torneio(11);
    const g = t.jogos.filter((j) => j.fase === 'grupos');
    expect(g).toHaveLength(6);
    expect(g.filter((j) => j.mando === 'casa')).toHaveLength(3);
    const final = t.tabelas[5];
    expect(final).toHaveLength(4);
    for (const l of final) {
      expect(l.j).toBe(6);
      expect(l.pts).toBe(l.v * 3 + l.e);
    }
    const totalGp = final.reduce((s, l) => s + l.gp, 0);
    expect(totalGp).toBe(final.reduce((s, l) => s + l.gc, 0));
  });

  it('só avança quem fica entre os 2 primeiros; mata-mata em sequência; final contra campeão', () => {
    let campeoes = 0;
    for (let s = 1; s <= 200; s++) {
      const t: Torneio = torneio(s);
      const pos = t.tabelas[5].findIndex((l) => l.eu);
      const mm = t.jogos.filter((j) => j.fase !== 'grupos');
      if (pos >= 2) {
        expect(mm).toHaveLength(0);
        expect(t.desfecho).toBe('eliminado');
        continue;
      }
      expect(mm.map((j) => j.fase)).toEqual(['oitavas', 'quartas', 'semi', 'final'].slice(0, mm.length));
      mm.slice(0, -1).forEach((j) => expect(j.r.vencedor).toBe('a'));
      const fin = mm.find((j) => j.fase === 'final');
      if (fin) expect(fin.adv.campeaoLibertadores).toBe(true);
      if (t.desfecho === 'campeao') {
        campeoes++;
        expect(mm).toHaveLength(4);
      }
    }
    // Um time de força ~80 às vezes é campeão, mas não sempre.
    expect(campeoes).toBeGreaterThan(5);
    expect(campeoes).toBeLessThan(150);
  });

  it('dificuldade cresce: semifinal é em média mais forte que o grupo', () => {
    let grupo = 0, ng = 0, semi = 0, ns = 0;
    for (let s = 1; s <= 300; s++) {
      for (const j of torneio(s, 95).jogos) {
        if (j.fase === 'grupos') { grupo += j.adv.forca; ng++; }
        if (j.fase === 'semi') { semi += j.adv.forca; ns++; }
      }
    }
    expect(semi / ns).toBeGreaterThan(grupo / ng + 2);
  });

  it('time muito forte é campeão quase sempre; resumo da campanha bate', () => {
    let c = 0;
    for (let s = 1; s <= 100; s++) {
      const t = torneio(s, 97);
      if (t.desfecho === 'campeao') c++;
      const r = resumoCampanha(t);
      expect(r.v + r.e + r.d).toBe(t.jogos.length);
    }
    expect(c).toBeGreaterThan(60);
  });
});

describe('confrontos e narração', () => {
  it('vingança para quem perdeu; clássico para quem ganhou', () => {
    expect(anunciarConfronto('palmeiras', 'boca-juniors', confrontos)?.tipo).toBe('vinganca');
    expect(anunciarConfronto('vasco', 'barcelona-sc', confrontos)?.tipo).toBe('classico');
    expect(anunciarConfronto('vasco', 'flamengo', confrontos)?.titulo).toBe('Clássico dos Milhões');
    expect(anunciarConfronto('vasco', 'tigres', confrontos)).toBeUndefined();
  });

  it('narração conta exatamente os gols do resultado e é determinística', () => {
    const t = torneio(21);
    for (const j of t.jogos) {
      const adv = pool.find((p) => p.chave === j.adv.chave)!.time;
      const ev = narrarPartida(j.r, meu(), adv, j.seedNarracao, { A: 'Vasco', B: j.adv.nome });
      expect(ev).toEqual(narrarPartida(j.r, meu(), adv, j.seedNarracao, { A: 'Vasco', B: j.adv.nome }));
      expect(ev.filter((e) => e.tipo === 'gol')).toHaveLength(j.r.golsA + j.r.golsB);
      const fim = ev.find((e) => e.tipo === 'fim')!;
      expect(fim.placar).toEqual([j.r.golsA, j.r.golsB]);
      expect(ev.filter((e) => e.tipo === 'cobranca')).toHaveLength(j.r.penaltis?.cobrancas.length ?? 0);
      for (const e of ev) expect(e.texto).not.toMatch(/\{\w+\}/);
    }
  });

  it('ídolo = nota 85+ em temporada com título', () => {
    const t1998 = vasco.temporadas.find((t) => t.ano === 1998)!;
    expect(ehIdolo(t1998.jogadores.find((j) => j.nome === 'Juninho Pernambucano')!, t1998)).toBe(true);
    const t2024 = vasco.temporadas.find((t) => t.ano === 2024)!;
    expect(t2024.jogadores.some((j) => ehIdolo(j, t2024))).toBe(false);
  });
});
