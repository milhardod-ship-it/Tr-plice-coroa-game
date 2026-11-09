/**
 * Torneio "Libertadores" — puro e determinístico a partir de uma seed.
 *
 * O torneio inteiro é simulado de uma vez quando começa (até o título ou a eliminação).
 * A interface só REVELA os jogos, um por um: o resultado nunca depende de como ou quando
 * o jogador assiste, e pular para o fim mostra exatamente o mesmo desfecho.
 */
import { simularPartida, type Mando, type ResultadoPartida, type Time } from './motor';
import type { TimeHistorico } from './pool';
import { Rng } from './rng';
import type { Confronto } from './tipos';

export type Fase = 'grupos' | 'oitavas' | 'quartas' | 'semi' | 'final';
export const FASES: Fase[] = ['grupos', 'oitavas', 'quartas', 'semi', 'final'];
export const NOME_FASE: Record<Fase, string> = {
  grupos: 'Fase de grupos', oitavas: 'Oitavas de final', quartas: 'Quartas de final', semi: 'Semifinal', final: 'Final',
};

export interface InfoAdv {
  chave: string;
  clubeId: string;
  nome: string;
  ano: number;
  pais: string;
  forca: number;
  campeaoLibertadores: boolean;
}

export interface AnuncioConfronto {
  tipo: 'vinganca' | 'classico';
  titulo: string;
  texto: string;
}

export interface JogoTorneio {
  fase: Fase;
  /** Rodada da fase de grupos (1–6). */
  rodada?: number;
  rotulo: string;
  adv: InfoAdv;
  mando: 'casa' | 'fora' | 'neutro';
  /** Lado "a" é sempre o time do jogador. */
  r: ResultadoPartida;
  confronto?: AnuncioConfronto;
  /** Seed para a narração deste jogo (frases determinísticas). */
  seedNarracao: number;
}

export interface LinhaTabela {
  chave: string;
  nome: string;
  eu: boolean;
  j: number; v: number; e: number; d: number; gp: number; gc: number; pts: number;
}

export interface JogoParalelo {
  rodada: number;
  casa: string;
  fora: string;
  golsCasa: number;
  golsFora: number;
}

export type Desfecho = 'campeao' | 'eliminado';

export interface Torneio {
  seed: number;
  grupo: InfoAdv[];
  jogos: JogoTorneio[];
  /** Outros jogos do grupo (entre os adversários). */
  paralelos: JogoParalelo[];
  /** Tabela do grupo após cada rodada (índice 0 = após a 1ª rodada). */
  tabelas: LinhaTabela[][];
  desfecho: Desfecho;
  /** Fase em que o torneio terminou para o jogador. */
  faseFinal: Fase;
}

const info = (p: TimeHistorico): InfoAdv => ({
  chave: p.chave, clubeId: p.clubeId, nome: p.nome, ano: p.ano, pais: p.pais, forca: p.forca, campeaoLibertadores: p.campeaoLibertadores,
});

/** Procura um confronto histórico entre o clube do jogador e o adversário. */
export function anunciarConfronto(meuClube: string, advClube: string, confrontos: Confronto[]): AnuncioConfronto | undefined {
  const achados = confrontos.filter((c) => c.clubes.includes(meuClube) && c.clubes.includes(advClube) && meuClube !== advClube);
  if (!achados.length) return undefined;
  const prioridade = (c: Confronto) => (c.perdedor === meuClube ? 0 : c.tipo !== 'classico' ? 1 : 2);
  const c = [...achados].sort((x, y) => prioridade(x) - prioridade(y))[0];
  return { tipo: c.perdedor === meuClube ? 'vinganca' : 'classico', titulo: c.titulo, texto: c.texto };
}

/**
 * Janela de dificuldade por fase, em percentis de força do pool (0 = mais fraco).
 * Cresce a cada fase; a final é sempre contra um campeão da Libertadores.
 */
const JANELA: Record<Exclude<Fase, 'final'>, [number, number]> = {
  grupos: [0, 0.55],
  oitavas: [0.15, 0.65],
  quartas: [0.3, 0.8],
  semi: [0.45, 0.95],
};

export interface EntradaTorneio {
  meu: Time;
  meuClubeId: string;
  pool: TimeHistorico[];
  confrontos: Confronto[];
  seed: number;
}

export function jogarTorneio({ meu, meuClubeId, pool, confrontos, seed }: EntradaTorneio): Torneio {
  // Dois geradores: um só para SORTEAR os rivais (todos sorteados antes de qualquer jogo, então
  // a mesma seed dá os mesmos rivais para qualquer time — base do Desafio do Dia) e outro para os jogos.
  const sorteio = new Rng(seed);
  const rng = new Rng((seed ^ 0x9e3779b9) >>> 0);
  // Pool elegível: fora o próprio clube, ordenado por força (desempate estável pela chave).
  const elegiveis = pool
    .filter((p) => p.clubeId !== meuClubeId)
    .sort((a, b) => a.forca - b.forca || a.chave.localeCompare(b.chave));
  const usadosClube = new Set<string>();

  const faixa = ([ini, fim]: [number, number]) => {
    const n = elegiveis.length;
    return elegiveis.slice(Math.floor(ini * n), Math.max(Math.floor(ini * n) + 1, Math.ceil(fim * n)));
  };
  const sortear = (candidatos: TimeHistorico[]): TimeHistorico => {
    const livres = candidatos.filter((p) => !usadosClube.has(p.clubeId));
    const lista = livres.length ? livres : elegiveis.filter((p) => !usadosClube.has(p.clubeId));
    const escolhido = sorteio.item(lista.length ? lista : elegiveis);
    usadosClube.add(escolhido.clubeId);
    return escolhido;
  };

  // ---- Grupo: 3 adversários, pelo menos 2 estrangeiros ----
  const janelaGrupo = faixa(JANELA.grupos);
  const estrangeiros = janelaGrupo.filter((p) => p.pais !== 'Brasil');
  const grupoHist = [sortear(estrangeiros), sortear(estrangeiros), sortear(janelaGrupo)];
  // Ordem aleatória no grupo (para o 3º não ser sempre o eventual brasileiro).
  for (let i = grupoHist.length - 1; i > 0; i--) {
    const j = sorteio.inteiro(i + 1);
    [grupoHist[i], grupoHist[j]] = [grupoHist[j], grupoHist[i]];
  }
  const [A, B, C] = grupoHist;

  // Rivais do mata-mata, já definidos (o jogador só os enfrenta se avançar).
  const rivaisMataMata = {} as Record<Exclude<Fase, 'grupos'>, TimeHistorico>;
  for (const fase of ['oitavas', 'quartas', 'semi'] as const) rivaisMataMata[fase] = sortear(faixa(JANELA[fase]));
  {
    const n = elegiveis.length;
    const campeoes = elegiveis.filter((p, i) => p.campeaoLibertadores && i >= Math.floor(0.35 * n));
    rivaisMataMata.final = sortear(campeoes.length ? campeoes : elegiveis.filter((p) => p.campeaoLibertadores));
  }

  const jogos: JogoTorneio[] = [];
  const paralelos: JogoParalelo[] = [];
  const linhas = new Map<string, LinhaTabela>();
  const linha = (chave: string, nome: string, eu: boolean) =>
    linhas.set(chave, { chave, nome, eu, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0 });
  linha('eu', meu.nome, true);
  for (const p of grupoHist) linha(p.chave, `${p.nome} ${p.ano}`, false);
  const somar = (casa: string, fora: string, gc: number, gf: number) => {
    const a = linhas.get(casa)!, b = linhas.get(fora)!;
    a.j++; b.j++; a.gp += gc; a.gc += gf; b.gp += gf; b.gc += gc;
    if (gc > gf) { a.v++; a.pts += 3; b.d++; } else if (gc < gf) { b.v++; b.pts += 3; a.d++; } else { a.e++; b.e++; a.pts++; b.pts++; }
  };
  // Desempate final (após pontos, saldo e gols pró): sorteio, feito uma vez só.
  const desempate = new Map<string, number>([...linhas.keys()].map((k) => [k, sorteio.proximo()]));
  const ordenar = () =>
    [...linhas.values()]
      .map((l) => ({ ...l }))
      .sort((x, y) => y.pts - x.pts || (y.gp - y.gc) - (x.gp - x.gc) || y.gp - x.gp || desempate.get(y.chave)! - desempate.get(x.chave)!);

  // Turno e returno: em cada rodada o jogador enfrenta um adversário e os outros dois se enfrentam.
  const calendario: [TimeHistorico, 'casa' | 'fora', TimeHistorico, TimeHistorico][] = [
    [A, 'casa', B, C], [B, 'fora', C, A], [C, 'casa', A, B],
    [A, 'fora', C, B], [B, 'casa', A, C], [C, 'fora', B, A],
  ];
  const tabelas: LinhaTabela[][] = [];
  calendario.forEach(([adv, mando, pc, pf], i) => {
    const rodada = i + 1;
    const m: Mando = mando === 'casa' ? 'a' : 'b';
    const r = simularPartida(meu, adv.time, rng, { mando: m });
    jogos.push({
      fase: 'grupos', rodada, rotulo: `Fase de grupos · ${rodada}ª rodada`, adv: info(adv), mando, r,
      confronto: anunciarConfronto(meuClubeId, adv.clubeId, confrontos), seedNarracao: rng.inteiro(2 ** 31),
    });
    if (mando === 'casa') somar('eu', adv.chave, r.golsA, r.golsB);
    else somar(adv.chave, 'eu', r.golsB, r.golsA);
    const rp = simularPartida(pc.time, pf.time, rng, { mando: 'a' });
    paralelos.push({ rodada, casa: pc.chave, fora: pf.chave, golsCasa: rp.golsA, golsFora: rp.golsB });
    somar(pc.chave, pf.chave, rp.golsA, rp.golsB);
    tabelas.push(ordenar());
  });

  const classificado = tabelas[5].findIndex((l) => l.eu) < 2;
  if (!classificado) return { seed, grupo: grupoHist.map(info), jogos, paralelos, tabelas, desfecho: 'eliminado', faseFinal: 'grupos' };

  // ---- Mata-mata: jogo único em campo neutro, pênaltis se empatar ----
  for (const fase of ['oitavas', 'quartas', 'semi', 'final'] as const) {
    const adv = rivaisMataMata[fase];
    const r = simularPartida(meu, adv.time, rng, { mando: 'neutro', mataMata: true });
    jogos.push({
      fase, rotulo: NOME_FASE[fase], adv: info(adv), mando: 'neutro', r,
      confronto: anunciarConfronto(meuClubeId, adv.clubeId, confrontos), seedNarracao: rng.inteiro(2 ** 31),
    });
    if (r.vencedor !== 'a') return { seed, grupo: grupoHist.map(info), jogos, paralelos, tabelas, desfecho: 'eliminado', faseFinal: fase };
  }
  return { seed, grupo: grupoHist.map(info), jogos, paralelos, tabelas, desfecho: 'campeao', faseFinal: 'final' };
}

/** Resumo da campanha (para a tela final e para recordes futuros). */
export function resumoCampanha(t: Torneio) {
  let v = 0, e = 0, d = 0, gp = 0, gc = 0;
  for (const j of t.jogos) {
    gp += j.r.golsA; gc += j.r.golsB;
    if (j.r.golsA > j.r.golsB) v++;
    else if (j.r.golsA < j.r.golsB) d++;
    else e++;
  }
  return { jogos: t.jogos.length, v, e, d, gp, gc, invicto: d === 0 && t.jogos.every((j) => j.r.vencedor !== 'b') };
}
