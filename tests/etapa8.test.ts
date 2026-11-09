import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { desafioDoDia, numeroDesafio, quadrados, textoCompartilharDesafio } from '../src/core/desafio';
import { sequencia } from '../src/core/sequencia';
import { somarDias } from '../src/core/datas';
import { montarPool } from '../src/core/pool';
import { jogarTorneio, type Torneio } from '../src/core/torneio';
import { FORMACOES } from '../src/core/formacoes';
import { conquistasDaCampanha } from '../src/core/conquistas';
import { progressoVazio, registrarAlbum, registrarCampanha } from '../src/core/progresso';
import { iniciarDraft, escolher, draftCompleto, temporadaAtual, jogadoresUsados, vagasLivres, type EstadoDraft } from '../src/core/draft';
import { timeDoDraft, type Time } from '../src/core/motor';
import type { ClubeJogavel } from '../src/core/tipos';

const DATA = join(__dirname, '..', 'data');
const ler = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const clubes: ClubeJogavel[] = readdirSync(join(DATA, 'clubes')).map((f) => ler(join(DATA, 'clubes', f)));
const pool = montarPool(clubes, ler(join(DATA, 'adversarios.json')), ler(join(DATA, 'finalistas-libertadores.json')));
const confrontos = ler(join(DATA, 'confrontos.json')).confrontos;
const time = (nota: number): Time => ({
  id: 'm', nome: 'Meu', estilo: 'equilibrado',
  escalacao: FORMACOES['4-3-3'].vagas.map((v, i) => ({ jogador: { nome: `J${i}`, posicao: v, alternativas: [], nota }, vaga: v })),
});

function draftAuto(clube: ClubeJogavel, seed: number, pior = false): EstadoDraft {
  let d = iniciarDraft(clube, { modo: 'classico', formacao: '4-3-3', estilo: 'equilibrado', seed });
  while (!draftCompleto(d)) {
    const u = jogadoresUsados(d);
    const ls = temporadaAtual(d, clube)!.jogadores.filter((x) => !u.has(x.nome)).sort((a, b) => (pior ? a.nota - b.nota : b.nota - a.nota));
    const j = ls[0];
    d = escolher(d, clube, j.nome, vagasLivres(d, j).sort((a, b) => b.nota - a.nota)[0].indice);
  }
  return d;
}

describe('Desafio do Dia', () => {
  const ids = clubes.map((c) => c.id);
  it('numeração a partir de 1/11/2026', () => {
    expect(numeroDesafio('2026-11-01')).toBe(1);
    expect(numeroDesafio('2026-11-12')).toBe(12);
    expect(numeroDesafio('2027-01-01')).toBe(62);
  });
  it('mesma data ⇒ mesmo desafio; datas diferentes variam', () => {
    expect(desafioDoDia('2026-11-09', ids)).toEqual(desafioDoDia('2026-11-09', [...ids].reverse()));
    const seeds = new Set(Array.from({ length: 30 }, (_, i) => desafioDoDia(somarDias('2026-11-01', i), ids).seed));
    expect(seeds.size).toBe(30);
    const clubesSorteados = new Set(Array.from({ length: 60 }, (_, i) => desafioDoDia(somarDias('2026-11-01', i), ids).clubeId));
    expect(clubesSorteados.size).toBeGreaterThan(6);
  });
  it('mesma seed ⇒ mesmos rivais para times diferentes', () => {
    for (let s = 1; s <= 50; s++) {
      const fraco = jogarTorneio({ meu: time(70), meuClubeId: 'vasco', pool, confrontos, seed: s });
      const forte = jogarTorneio({ meu: time(95), meuClubeId: 'vasco', pool, confrontos, seed: s });
      expect(fraco.grupo).toEqual(forte.grupo);
      const n = Math.min(fraco.jogos.length, forte.jogos.length);
      for (let i = 0; i < n; i++) expect(fraco.jogos[i].adv.chave).toBe(forte.jogos[i].adv.chave);
    }
  });
  it('mesma seed de draft ⇒ mesmos sorteios de temporada', () => {
    const vasco = clubes.find((c) => c.id === 'vasco')!;
    expect(draftAuto(vasco, 77).sorteios).toEqual(draftAuto(vasco, 77, true).sorteios);
  });
  it('texto compacto para WhatsApp', () => {
    const t = jogarTorneio({ meu: time(85), meuClubeId: 'vasco', pool, confrontos, seed: 3 });
    const q = quadrados(t);
    expect([...q.replace(' ', '')].length).toBe(t.jogos.length);
    const txt = textoCompartilharDesafio(12, 'Vasco', 'Campeão', t, 'x.app');
    expect(txt).toContain('Desafio #12');
    expect(txt.split('\n')).toHaveLength(4);
  });
});

describe('sequência', () => {
  it('conta dias seguidos e tolera 1 dia de folga', () => {
    expect(sequencia([], '2026-11-10').atual).toBe(0);
    expect(sequencia(['2026-11-08', '2026-11-09', '2026-11-10'], '2026-11-10').atual).toBe(3);
    // hoje ainda não jogado não quebra
    expect(sequencia(['2026-11-08', '2026-11-09'], '2026-11-10').atual).toBe(2);
    // pulou o dia 9 (folga): continua
    expect(sequencia(['2026-11-07', '2026-11-08', '2026-11-10'], '2026-11-10').atual).toBe(3);
    // pulou 8 e 9: quebrou
    expect(sequencia(['2026-11-06', '2026-11-07', '2026-11-10'], '2026-11-10').atual).toBe(1);
    expect(sequencia(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-10'], '2026-11-10').melhor).toBe(4);
  });
});

describe('conquistas e progresso', () => {
  const vasco = clubes.find((c) => c.id === 'vasco')!;
  it('7 a 0, invicto e muralha a partir de campanhas reais', () => {
    const vistas = new Set<string>();
    for (let s = 1; s <= 300; s++) {
      const d = draftAuto(vasco, s);
      const t = jogarTorneio({ meu: { ...timeDoDraft(d, 'm', 'Vasco'), escalacao: timeDoDraft(d, 'm', 'Vasco').escalacao.map((e) => ({ ...e, jogador: { ...e.jogador, nota: 96 } })) }, meuClubeId: 'vasco', pool, confrontos, seed: s });
      conquistasDaCampanha({ draft: d, torneio: t }).forEach((c) => vistas.add(c));
    }
    for (const c of ['campeao', 'invicto', 'virada', 'muralha', 'sete-a-zero']) expect(vistas.has(c), c).toBe(true);
  });
  it('registrar campanha: conta, desbloqueia uma vez, guarda desafio e artilharia', () => {
    const d = draftAuto(vasco, 5);
    let t: Torneio | null = null;
    for (let s = 1; !t; s++) { const x = jogarTorneio({ meu: timeDoDraft(d, 'm', 'Vasco'), meuClubeId: 'vasco', pool, confrontos, seed: s }); if (x.desfecho === 'campeao') t = x; }
    const a = registrarCampanha(progressoVazio(), { draft: d, torneio: t, clubeNome: 'Vasco', data: '2026-11-09', desafio: { data: '2026-11-09', numero: 9 } });
    expect(a.progresso.recordes.campanhas).toBe(1);
    expect(a.progresso.recordes.titulos).toBe(1);
    expect(a.novidades.conquistas.map((c) => c.id)).toContain('campeao');
    expect(a.progresso.desafios['2026-11-09'].numero).toBe(9);
    const gols = Object.values(a.progresso.recordes.artilharia).reduce((x, y) => x + y, 0);
    expect(gols).toBe(t.jogos.reduce((s, j) => s + j.r.gols.filter((g) => g.time === 'a' && !g.contra).length, 0));
    const b = registrarCampanha(a.progresso, { draft: d, torneio: t, clubeNome: 'Vasco', data: '2026-11-10' });
    expect(b.novidades.conquistas.map((c) => c.id)).not.toContain('campeao');
    expect(b.progresso.recordes.campanhas).toBe(2);
  });
  it('álbum não duplica nomes', () => {
    let p = registrarAlbum(progressoVazio(), 'vasco', ['Romário', 'Edmundo']);
    p = registrarAlbum(p, 'vasco', ['Romário', 'Juninho Pernambucano']);
    expect(p.album.vasco.sort()).toEqual(['Edmundo', 'Juninho Pernambucano', 'Romário']);
  });
});
