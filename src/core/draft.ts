/**
 * Regras do draft — puras e determinísticas (mesma seed ⇒ mesmos sorteios).
 * Cada função recebe um estado e devolve um NOVO estado (nada é mutado),
 * o que facilita salvar no localStorage e, no futuro, validar no servidor.
 */
import { FORMACOES, type FormacaoId } from './formacoes';
import { notaEfetiva } from './posicoes';
import { Rng } from './rng';
import type { ClubeJogavel, Jogador, Temporada } from './tipos';

export type Modo = 'classico' | 'almanaque';
export type Estilo = 'defensivo' | 'equilibrado' | 'ofensivo';

export const RESORTEIOS: Record<Modo, number> = { classico: 3, almanaque: 1 };
export const RODADAS = 11;

export interface Escolha {
  jogador: Jogador;
  /** Temporada de onde o jogador veio. */
  ano: number;
}

export interface ConfigDraft {
  modo: Modo;
  formacao: FormacaoId;
  estilo: Estilo;
  seed: number;
}

export interface EstadoDraft extends ConfigDraft {
  clubeId: string;
  /** Estado do gerador aleatório (para retomar exatamente de onde parou). */
  rng: number;
  /** Uma posição por vaga da formação; null = vaga livre. */
  escalacao: (Escolha | null)[];
  /** Ano da temporada sorteada na rodada atual (null quando o draft acabou). */
  temporadaAtual: number | null;
  /** Todos os anos sorteados, em ordem (inclui re-sorteios). */
  sorteios: number[];
  resorteiosRestantes: number;
}

export class ErroDraft extends Error {}

export const jogadoresUsados = (e: EstadoDraft) =>
  new Set(e.escalacao.filter((x): x is Escolha => !!x).map((x) => x.jogador.nome));

export const rodadaAtual = (e: EstadoDraft) => e.escalacao.filter(Boolean).length + 1;
export const draftCompleto = (e: EstadoDraft) => e.escalacao.every(Boolean);

export function temporadaAtual(e: EstadoDraft, clube: ClubeJogavel): Temporada | null {
  return clube.temporadas.find((t) => t.ano === e.temporadaAtual) ?? null;
}

/**
 * Sorteia uma temporada (todas com a mesma chance), respeitando:
 * - não repetir a temporada que acabou de sair;
 * - ter pelo menos 1 jogador ainda não escalado.
 * Se o clube tiver só 1 temporada, a regra de não repetir é relaxada.
 */
function sortear(e: EstadoDraft, clube: ClubeJogavel, rng: Rng): number {
  const usados = jogadoresUsados(e);
  const comJogador = clube.temporadas.filter((t) => t.jogadores.some((j) => !usados.has(j.nome)));
  const candidatas = comJogador.filter((t) => t.ano !== e.temporadaAtual);
  const pool = candidatas.length ? candidatas : comJogador;
  if (!pool.length) throw new ErroDraft('Não há temporadas com jogadores disponíveis.');
  return rng.item(pool).ano;
}

export function iniciarDraft(clube: ClubeJogavel, cfg: ConfigDraft): EstadoDraft {
  if (!clube.temporadas.length) throw new ErroDraft(`${clube.nome} ainda não tem temporadas.`);
  const base: EstadoDraft = {
    ...cfg,
    clubeId: clube.id,
    rng: cfg.seed >>> 0,
    escalacao: FORMACOES[cfg.formacao].vagas.map(() => null),
    temporadaAtual: null,
    sorteios: [],
    resorteiosRestantes: RESORTEIOS[cfg.modo],
  };
  const rng = new Rng(base.rng);
  const ano = sortear(base, clube, rng);
  return { ...base, rng: rng.estado, temporadaAtual: ano, sorteios: [ano] };
}

export function resortear(e: EstadoDraft, clube: ClubeJogavel): EstadoDraft {
  if (draftCompleto(e)) throw new ErroDraft('O draft já terminou.');
  if (e.resorteiosRestantes <= 0) throw new ErroDraft('Sem re-sorteios.');
  const rng = new Rng(e.rng);
  const ano = sortear(e, clube, rng);
  return {
    ...e,
    rng: rng.estado,
    temporadaAtual: ano,
    sorteios: [...e.sorteios, ano],
    resorteiosRestantes: e.resorteiosRestantes - 1,
  };
}

export function escolher(e: EstadoDraft, clube: ClubeJogavel, nomeJogador: string, vaga: number): EstadoDraft {
  const t = temporadaAtual(e, clube);
  if (!t) throw new ErroDraft('Nenhuma temporada sorteada.');
  const jogador = t.jogadores.find((j) => j.nome === nomeJogador);
  if (!jogador) throw new ErroDraft(`${nomeJogador} não está no elenco de ${t.ano}.`);
  if (jogadoresUsados(e).has(jogador.nome)) throw new ErroDraft(`${jogador.nome} já foi escalado.`);
  if (vaga < 0 || vaga >= e.escalacao.length || e.escalacao[vaga]) throw new ErroDraft('Vaga indisponível.');

  const escalacao = e.escalacao.slice();
  escalacao[vaga] = { jogador, ano: t.ano };
  const depois: EstadoDraft = { ...e, escalacao };
  if (draftCompleto(depois)) return { ...depois, temporadaAtual: null };

  const rng = new Rng(e.rng);
  const ano = sortear(depois, clube, rng);
  return { ...depois, rng: rng.estado, temporadaAtual: ano, sorteios: [...e.sorteios, ano] };
}

/** Nota que o jogador teria em cada vaga livre (para sugerir a melhor). */
export function vagasLivres(e: EstadoDraft, jogador: Jogador) {
  const vagas = FORMACOES[e.formacao].vagas;
  return vagas
    .map((posicao, indice) => ({ indice, posicao, nota: notaEfetiva(jogador, posicao) }))
    .filter((v) => !e.escalacao[v.indice]);
}

/** Força geral do time: média das notas efetivas das vagas preenchidas. */
export function forcaGeral(e: Pick<EstadoDraft, 'formacao' | 'escalacao'>): number {
  const vagas = FORMACOES[e.formacao].vagas;
  const notas = e.escalacao.flatMap((x, i) => (x ? [notaEfetiva(x.jogador, vagas[i])] : []));
  return notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : 0;
}
