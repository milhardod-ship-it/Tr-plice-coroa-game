/**
 * Progresso do jogador (álbum, conquistas, recordes, desafios). Funções puras:
 * recebem o progresso atual e devolvem um novo; a UI só salva no localStorage.
 */
import { analisarCampanha } from './campanha';
import { conquistasDaCampanha, CONQUISTAS, type Conquista } from './conquistas';
import { quadrados } from './desafio';
import type { EstadoDraft } from './draft';
import type { Torneio } from './torneio';

export interface ResultadoDesafio {
  numero: number;
  clubeId: string;
  titulo: string;
  quadrados: string;
  campeao: boolean;
}

export interface Recordes {
  campanhas: number;
  titulos: number;
  melhor?: { nivel: number; texto: string; clubeId: string; data: string };
  maiorGoleada?: { golsA: number; golsB: number; adv: string; clubeId: string };
  /** Gols por jogador, chave "clubeId|nome". */
  artilharia: Record<string, number>;
}

export interface Progresso {
  versao: 1;
  /** Nomes já escalados por clube. */
  album: Record<string, string[]>;
  /** id da conquista → data em que foi desbloqueada. */
  conquistas: Record<string, string>;
  recordes: Recordes;
  /** data → resultado do Desafio daquele dia. */
  desafios: Record<string, ResultadoDesafio>;
  som: boolean;
}

export const progressoVazio = (): Progresso => ({
  versao: 1, album: {}, conquistas: {}, recordes: { campanhas: 0, titulos: 0, artilharia: {} }, desafios: {}, som: true,
});

export function registrarAlbum(p: Progresso, clubeId: string, nomes: string[]): Progresso {
  const atual = new Set(p.album[clubeId] ?? []);
  nomes.forEach((n) => atual.add(n));
  return { ...p, album: { ...p.album, [clubeId]: [...atual] } };
}

/** 1 = grupos ... 6 = campeão, 7 = campeão invicto. */
export function nivelCampanha(t: Torneio): number {
  if (t.desfecho === 'campeao') return analisarCampanha(t).invicto ? 7 : 6;
  return { grupos: 1, oitavas: 2, quartas: 3, semi: 4, final: 5 }[t.faseFinal];
}

export interface Novidades {
  conquistas: Conquista[];
  recordes: string[];
}

export function registrarCampanha(
  p: Progresso,
  e: { draft: EstadoDraft; torneio: Torneio; clubeNome: string; data: string; desafio?: { data: string; numero: number } },
): { progresso: Progresso; novidades: Novidades } {
  const { draft, torneio, clubeNome, data } = e;
  const a = analisarCampanha(torneio);
  const r: Recordes = { ...p.recordes, artilharia: { ...p.recordes.artilharia } };
  const novosRecordes: string[] = [];
  const primeira = r.campanhas === 0;

  r.campanhas++;
  if (a.campeao) r.titulos++;

  const nivel = nivelCampanha(torneio);
  if (!r.melhor || nivel > r.melhor.nivel) {
    r.melhor = { nivel, texto: `${a.titulo.replace(/!$/, '')} com o ${clubeNome}`, clubeId: draft.clubeId, data };
    if (!primeira) novosRecordes.push(`Melhor campanha: ${r.melhor.texto}`);
  }

  for (const j of torneio.jogos) {
    const saldo = j.r.golsA - j.r.golsB;
    const atual = r.maiorGoleada ? r.maiorGoleada.golsA - r.maiorGoleada.golsB : 0;
    if (saldo > 0 && (saldo > atual || (saldo === atual && j.r.golsA > (r.maiorGoleada?.golsA ?? 0)))) {
      r.maiorGoleada = { golsA: j.r.golsA, golsB: j.r.golsB, adv: `${j.adv.nome} ${j.adv.ano}`, clubeId: draft.clubeId };
      if (!primeira && !novosRecordes.some((x) => x.startsWith('Maior goleada'))) novosRecordes.push(`Maior goleada: ${j.r.golsA} a ${j.r.golsB} no ${j.adv.nome} ${j.adv.ano}`);
    }
    for (const g of j.r.gols) {
      if (g.time !== 'a' || g.contra) continue;
      const k = `${draft.clubeId}|${g.autor}`;
      r.artilharia[k] = (r.artilharia[k] ?? 0) + 1;
    }
  }

  const conquistas = { ...p.conquistas };
  const novas = conquistasDaCampanha({ draft, torneio })
    .filter((id) => !conquistas[id])
    .map((id) => {
      conquistas[id] = data;
      return CONQUISTAS.find((c) => c.id === id)!;
    });

  let desafios = p.desafios;
  if (e.desafio && !desafios[e.desafio.data]) {
    desafios = {
      ...desafios,
      [e.desafio.data]: { numero: e.desafio.numero, clubeId: draft.clubeId, titulo: a.titulo, quadrados: quadrados(torneio), campeao: a.campeao },
    };
  }

  return { progresso: { ...p, recordes: r, conquistas, desafios }, novidades: { conquistas: novas, recordes: novosRecordes } };
}

/** Top artilheiros do jogador (todos os clubes). */
export function artilheiros(p: Progresso, n = 5) {
  return Object.entries(p.recordes.artilharia)
    .map(([k, gols]) => { const [clubeId, nome] = k.split('|'); return { clubeId, nome, gols }; })
    .sort((a, b) => b.gols - a.gols)
    .slice(0, n);
}
