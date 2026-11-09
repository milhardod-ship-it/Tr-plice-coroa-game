/**
 * Motor de simulação — puro e determinístico (usa só o Rng com seed).
 *
 * Modelo, em resumo:
 * 1. Cada vaga contribui para os setores (gol, defesa, meio, ataque) com pesos.
 *    Ex.: lateral é 80% defesa e 20% apoio; meia é 60% meio e 40% ataque.
 *    A nota usada é a EFETIVA (com penalidade de posição).
 * 2. Poder ofensivo = 65% ataque + 35% meio. Poder defensivo = 55% defesa + 25% meio + 20% goleiro.
 * 3. Média de gols (λ) de A = 1,25 × e^(d/25), com d = (ofensivo A − defensivo B) + ½(meio A − meio B).
 *    Times iguais: ~1,25 gol cada. Diferença de 20 pontos de nota: ~4 × 0,4.
 * 4. Estilo multiplica λ: ofensivo marca mais e sofre mais; defensivo o contrário.
 *    Mando de campo: +10% para quem joga em casa.
 * 5. Gols ~ Poisson(λ). Autor sorteado com peso por posição (atacantes e meias mais) e por nota.
 * 6. Pênaltis cobrança a cobrança, chance de conversão pela nota do cobrador vs. goleiro.
 */
import { FORMACOES, LISTA_FORMACOES } from './formacoes';
import { notaEfetiva } from './posicoes';
import { Rng } from './rng';
import type { Estilo } from './draft';
import type { Jogador, Posicao } from './tipos';

export interface Escalado {
  jogador: Jogador;
  /** Vaga em que joga (pode não ser a posição natural). */
  vaga: Posicao;
  /** Ano da temporada de origem (times montados no draft). */
  ano?: number;
}

export interface Time {
  id: string;
  nome: string;
  ano?: number;
  estilo: Estilo;
  escalacao: Escalado[];
  reservas?: Jogador[];
}

export interface Forcas {
  gol: number;
  defesa: number;
  meio: number;
  ataque: number;
}

type Setor = keyof Forcas;
const PESOS: Record<Posicao, Partial<Record<Setor, number>>> = {
  GOL: { gol: 1 },
  LD: { defesa: 0.8, meio: 0.1, ataque: 0.1 },
  LE: { defesa: 0.8, meio: 0.1, ataque: 0.1 },
  ZAG: { defesa: 1 },
  VOL: { defesa: 0.4, meio: 0.6 },
  MC: { meio: 1 },
  MEI: { meio: 0.6, ataque: 0.4 },
  PD: { ataque: 0.8, meio: 0.2 },
  PE: { ataque: 0.8, meio: 0.2 },
  ATA: { ataque: 1 },
};

/** Peso de cada vaga no sorteio do autor do gol. */
const PESO_GOL: Record<Posicao, number> = {
  ATA: 5, PD: 3.5, PE: 3.5, MEI: 3, MC: 1.6, VOL: 1, LD: 0.8, LE: 0.8, ZAG: 0.7, GOL: 0.02,
};

export const ESTILO_MULT: Record<Estilo, { marca: number; sofre: number }> = {
  ofensivo: { marca: 1.18, sofre: 1.1 },
  equilibrado: { marca: 1, sofre: 1 },
  defensivo: { marca: 0.85, sofre: 0.8 },
};

const LAMBDA_BASE = 1.25;
const ESCALA = 25;
const MANDO = 1.1;

export function forcas(t: Time): Forcas {
  const soma: Forcas = { gol: 0, defesa: 0, meio: 0, ataque: 0 };
  const peso: Forcas = { gol: 0, defesa: 0, meio: 0, ataque: 0 };
  for (const { jogador, vaga } of t.escalacao) {
    const n = notaEfetiva(jogador, vaga);
    for (const [s, w] of Object.entries(PESOS[vaga]) as [Setor, number][]) {
      soma[s] += n * w;
      peso[s] += w;
    }
  }
  const media = (s: Setor) => (peso[s] ? soma[s] / peso[s] : 40);
  return { gol: media('gol'), defesa: media('defesa'), meio: media('meio'), ataque: media('ataque') };
}

export const poderOfensivo = (f: Forcas) => 0.65 * f.ataque + 0.35 * f.meio;
export const poderDefensivo = (f: Forcas) => 0.55 * f.defesa + 0.25 * f.meio + 0.2 * f.gol;

export type Mando = 'a' | 'b' | 'neutro';

/** Médias de gols esperadas (λ) de cada lado. */
export function mediasDeGols(a: Time, b: Time, mando: Mando = 'neutro') {
  const fa = forcas(a);
  const fb = forcas(b);
  const lam = (of: Forcas, df: Forcas) =>
    LAMBDA_BASE * Math.exp((poderOfensivo(of) - poderDefensivo(df) + 0.5 * (of.meio - df.meio)) / ESCALA);
  let la = lam(fa, fb) * ESTILO_MULT[a.estilo].marca * ESTILO_MULT[b.estilo].sofre;
  let lb = lam(fb, fa) * ESTILO_MULT[b.estilo].marca * ESTILO_MULT[a.estilo].sofre;
  if (mando === 'a') la *= MANDO;
  if (mando === 'b') lb *= MANDO;
  const limitar = (x: number) => Math.min(6, Math.max(0.12, x));
  return { a: limitar(la), b: limitar(lb) };
}

export function poisson(rng: Rng, lambda: number): number {
  const limite = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng.proximo();
  } while (p > limite);
  return k - 1;
}

function sortearPeso<T>(rng: Rng, itens: T[], peso: (x: T) => number): T {
  const total = itens.reduce((s, x) => s + peso(x), 0);
  let r = rng.proximo() * total;
  for (const x of itens) {
    r -= peso(x);
    if (r <= 0) return x;
  }
  return itens[itens.length - 1];
}

const pesoArtilheiro = (e: Escalado) => PESO_GOL[e.vaga] * (notaEfetiva(e.jogador, e.vaga) / 80) ** 2;

export type Lado = 'a' | 'b';

export interface Gol {
  minuto: number;
  time: Lado;
  autor: string;
  contra?: boolean;
}

export interface Lance {
  minuto: number;
  time: Lado;
  tipo: 'chance' | 'trave' | 'defesa';
  jogador: string;
}

export interface Cobranca {
  time: Lado;
  cobrador: string;
  convertido: boolean;
}

export interface ResultadoPartida {
  golsA: number;
  golsB: number;
  gols: Gol[];
  /** Chances que não viraram gol (para a narração). */
  lances: Lance[];
  penaltis?: { golsA: number; golsB: number; cobrancas: Cobranca[] };
  /** null = empate (só possível fora do mata-mata). */
  vencedor: Lado | null;
  medias: { a: number; b: number };
}

export interface OpcoesPartida {
  mando?: Mando;
  /** Mata-mata: empate vai para os pênaltis. */
  mataMata?: boolean;
}

/** Minuto do lance: 1–90, com chance de acréscimo (90+1 a 90+5 vira 91–95). */
function minuto(rng: Rng): number {
  const m = 1 + rng.inteiro(90);
  return m === 90 ? 90 + rng.inteiro(6) : m;
}

export function simularPartida(a: Time, b: Time, rng: Rng, op: OpcoesPartida = {}): ResultadoPartida {
  const medias = mediasDeGols(a, b, op.mando ?? 'neutro');
  const golsA = poisson(rng, medias.a);
  const golsB = poisson(rng, medias.b);

  const gols: Gol[] = [];
  const marcar = (lado: Lado, n: number) => {
    const meu = lado === 'a' ? a : b;
    const outro = lado === 'a' ? b : a;
    for (let i = 0; i < n; i++) {
      if (rng.proximo() < 0.03) {
        const z = sortearPeso(rng, outro.escalacao, (e) => (e.vaga === 'GOL' ? 0.2 : 1));
        gols.push({ minuto: minuto(rng), time: lado, autor: z.jogador.nome, contra: true });
      } else {
        gols.push({ minuto: minuto(rng), time: lado, autor: sortearPeso(rng, meu.escalacao, pesoArtilheiro).jogador.nome });
      }
    }
  };
  marcar('a', golsA);
  marcar('b', golsB);
  gols.sort((x, y) => x.minuto - y.minuto);

  // Chances perdidas: proporcionais à média de gols (times que atacam mais criam mais).
  const lances: Lance[] = [];
  for (const lado of ['a', 'b'] as Lado[]) {
    const meu = lado === 'a' ? a : b;
    const n = poisson(rng, (lado === 'a' ? medias.a : medias.b) * 1.8 + 0.6);
    for (let i = 0; i < n; i++) {
      const r = rng.proximo();
      lances.push({
        minuto: minuto(rng),
        time: lado,
        tipo: r < 0.15 ? 'trave' : r < 0.55 ? 'defesa' : 'chance',
        jogador: sortearPeso(rng, meu.escalacao, pesoArtilheiro).jogador.nome,
      });
    }
  }
  lances.sort((x, y) => x.minuto - y.minuto);

  let vencedor: Lado | null = golsA > golsB ? 'a' : golsB > golsA ? 'b' : null;
  let penaltis: ResultadoPartida['penaltis'];
  if (vencedor === null && op.mataMata) {
    penaltis = disputaDePenaltis(a, b, rng);
    vencedor = penaltis.golsA > penaltis.golsB ? 'a' : 'b';
  }
  return { golsA, golsB, gols, lances, penaltis, vencedor, medias };
}

/** Ordem dos cobradores: melhores finalizadores primeiro, goleiro por último. */
function cobradores(t: Time): Escalado[] {
  return [...t.escalacao].sort((x, y) => pesoArtilheiro(y) - pesoArtilheiro(x));
}

const goleiro = (t: Time) => t.escalacao.find((e) => e.vaga === 'GOL') ?? t.escalacao[0];

export function chanceDeConverter(cobrador: Escalado, goleiroAdv: Escalado): number {
  const diff = notaEfetiva(cobrador.jogador, cobrador.vaga) - notaEfetiva(goleiroAdv.jogador, goleiroAdv.vaga);
  return Math.min(0.9, Math.max(0.55, 0.75 + diff / 200));
}

export function disputaDePenaltis(a: Time, b: Time, rng: Rng) {
  const ordem = { a: cobradores(a), b: cobradores(b) };
  const gk = { a: goleiro(b), b: goleiro(a) }; // goleiro que defende a cobrança de cada lado
  const placar = { a: 0, b: 0 };
  const batidas = { a: 0, b: 0 };
  const cobrancas: Cobranca[] = [];

  const chutar = (lado: Lado) => {
    const c = ordem[lado][batidas[lado] % ordem[lado].length];
    const convertido = rng.proximo() < chanceDeConverter(c, gk[lado]);
    batidas[lado]++;
    if (convertido) placar[lado]++;
    cobrancas.push({ time: lado, cobrador: c.jogador.nome, convertido });
  };

  // Série de 5, encerrando assim que um lado não puder mais alcançar o outro.
  for (let i = 0; i < 5; i++) {
    for (const lado of ['a', 'b'] as Lado[]) {
      chutar(lado);
      const restA = 5 - batidas.a;
      const restB = 5 - batidas.b;
      if (placar.a + restA < placar.b || placar.b + restB < placar.a) {
        return { golsA: placar.a, golsB: placar.b, cobrancas };
      }
    }
  }
  // Alternadas até alguém errar e o outro converter.
  while (placar.a === placar.b) {
    chutar('a');
    chutar('b');
  }
  return { golsA: placar.a, golsB: placar.b, cobrancas };
}

/**
 * Escala automaticamente o melhor 11 de um elenco (usado para adversários que vêm
 * dos arquivos dos clubes jogáveis). Testa as 4 formações e, em cada uma, preenche
 * as vagas pelos melhores encaixes (nota efetiva mais alta primeiro).
 */
export function escalarAutomatico(jogadores: Jogador[]): Escalado[] {
  let melhor: Escalado[] = [];
  let melhorSoma = -1;
  for (const f of LISTA_FORMACOES) {
    const pares = f.vagas
      .flatMap((vaga, vi) => jogadores.map((j, ji) => ({ vi, ji, vaga, nota: notaEfetiva(j, vaga) })))
      .sort((x, y) => y.nota - x.nota || x.ji - y.ji);
    const vagaOcupada = new Set<number>();
    const jogUsado = new Set<number>();
    const esc: Escalado[] = [];
    let soma = 0;
    for (const p of pares) {
      if (vagaOcupada.has(p.vi) || jogUsado.has(p.ji)) continue;
      vagaOcupada.add(p.vi);
      jogUsado.add(p.ji);
      esc[p.vi] = { jogador: jogadores[p.ji], vaga: p.vaga };
      soma += p.nota;
    }
    if (esc.filter(Boolean).length === f.vagas.length && soma > melhorSoma) {
      melhor = esc;
      melhorSoma = soma;
    }
  }
  return melhor;
}

/** Monta o Time do jogador a partir do draft concluído. */
export function timeDoDraft(
  d: { formacao: keyof typeof FORMACOES; estilo: Estilo; escalacao: ({ jogador: Jogador; ano: number } | null)[] },
  id: string,
  nome: string,
): Time {
  const vagas = FORMACOES[d.formacao].vagas;
  return {
    id,
    nome,
    estilo: d.estilo,
    escalacao: d.escalacao.map((x, i) => ({ jogador: x!.jogador, vaga: vagas[i], ano: x!.ano })),
  };
}

/** Estatística de muitas partidas (para testes e para o laboratório do motor). */
export function estatisticas(a: Time, b: Time, n: number, seed: number, mando: Mando = 'neutro') {
  const rng = new Rng(seed);
  let va = 0, vb = 0, emp = 0, gols = 0;
  for (let i = 0; i < n; i++) {
    const r = simularPartida(a, b, rng, { mando });
    if (r.vencedor === 'a') va++;
    else if (r.vencedor === 'b') vb++;
    else emp++;
    gols += r.golsA + r.golsB;
  }
  return { vitoriasA: va / n, empates: emp / n, vitoriasB: vb / n, mediaGols: gols / n };
}
