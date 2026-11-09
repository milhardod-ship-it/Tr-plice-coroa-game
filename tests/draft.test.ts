import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  draftCompleto, escolher, iniciarDraft, jogadoresUsados, resortear, temporadaAtual, vagasLivres,
  type ConfigDraft, type EstadoDraft,
} from '../src/core/draft';
import { notaEfetiva, penalidade } from '../src/core/posicoes';
import type { ClubeJogavel, Jogador } from '../src/core/tipos';

const vasco: ClubeJogavel = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'clubes', 'vasco.json'), 'utf8'));
const cfg: ConfigDraft = { modo: 'classico', formacao: '4-3-3', estilo: 'equilibrado', seed: 12345 };

/** Joga um draft inteiro escolhendo sempre o primeiro jogador disponível na melhor vaga. */
function jogarDraft(c: ConfigDraft): EstadoDraft {
  let e = iniciarDraft(vasco, c);
  while (!draftCompleto(e)) {
    const usados = jogadoresUsados(e);
    const j = temporadaAtual(e, vasco)!.jogadores.find((x) => !usados.has(x.nome))!;
    const melhor = vagasLivres(e, j).sort((a, b) => b.nota - a.nota)[0];
    e = escolher(e, vasco, j.nome, melhor.indice);
  }
  return e;
}

describe('draft', () => {
  it('completa as 11 vagas sem repetir jogador', () => {
    const e = jogarDraft(cfg);
    const nomes = e.escalacao.map((x) => x!.jogador.nome);
    expect(nomes).toHaveLength(11);
    expect(new Set(nomes).size).toBe(11);
    expect(e.temporadaAtual).toBeNull();
  });

  it('é determinístico pela seed', () => {
    expect(jogarDraft(cfg).sorteios).toEqual(jogarDraft(cfg).sorteios);
    expect(jogarDraft(cfg).sorteios).not.toEqual(jogarDraft({ ...cfg, seed: 999 }).sorteios);
  });

  it('nunca sorteia a mesma temporada duas vezes seguidas', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = jogarDraft({ ...cfg, seed }).sorteios;
      for (let i = 1; i < s.length; i++) expect(s[i]).not.toBe(s[i - 1]);
    }
  });

  it('limita os re-sorteios por modo', () => {
    let e = iniciarDraft(vasco, { ...cfg, modo: 'almanaque' });
    e = resortear(e, vasco);
    expect(e.resorteiosRestantes).toBe(0);
    expect(() => resortear(e, vasco)).toThrow();
    expect(iniciarDraft(vasco, cfg).resorteiosRestantes).toBe(3);
  });

  it('recusa jogador repetido e vaga ocupada', () => {
    let e = iniciarDraft(vasco, cfg);
    const j = temporadaAtual(e, vasco)!.jogadores[0];
    e = escolher(e, vasco, j.nome, 0);
    expect(() => escolher(e, vasco, temporadaAtual(e, vasco)!.jogadores[1].nome, 0)).toThrow();
  });
});

describe('penalidade de posição', () => {
  const j: Jogador = { nome: 'X', posicao: 'ZAG', alternativas: ['LD'], nota: 80 };
  it('natural, alternativa e improvisado', () => {
    expect(penalidade(j, 'ZAG')).toBe(0);
    expect(penalidade(j, 'LD')).toBe(3);
    expect(penalidade(j, 'VOL')).toBe(14);
    expect(penalidade(j, 'ATA')).toBe(22);
    expect(notaEfetiva(j, 'GOL')).toBe(45);
  });
});
