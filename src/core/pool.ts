/**
 * Pool de times históricos que podem ser adversários no torneio:
 * - elencos de data/adversarios.json (finalistas fora dos 12 clubes);
 * - temporadas cadastradas dos clubes jogáveis (escaladas automaticamente).
 */
import { escalarAutomatico, type Time } from './motor';
import { notaEfetiva } from './posicoes';
import type { ArquivoAdversarios, ArquivoFinalistas, ClubeJogavel } from './tipos';


export interface TimeHistorico {
  /** Chave única, ex.: "boca-juniors-2000". */
  chave: string;
  clubeId: string;
  nome: string;
  ano: number;
  pais: string;
  /** Foi campeão da Libertadores naquele ano. */
  campeaoLibertadores: boolean;
  /** É um dos 12 clubes jogáveis. */
  jogavel: boolean;
  /** Média das notas efetivas dos titulares. */
  forca: number;
  time: Time;
}

const mediaTitulares = (t: Time) =>
  Math.round(t.escalacao.reduce((s, e) => s + notaEfetiva(e.jogador, e.vaga), 0) / t.escalacao.length);

export function montarPool(clubes: ClubeJogavel[], adv: ArquivoAdversarios, fin: ArquivoFinalistas): TimeHistorico[] {
  const campeoes = new Set(fin.finais.map((f) => `${f.campeao.id}-${f.ano}`));
  const pool: TimeHistorico[] = [];

  for (const a of adv.adversarios) {
    const chave = `${a.id}-${a.ano}`;
    const time: Time = {
      id: chave, nome: `${a.nome} ${a.ano}`, ano: a.ano, estilo: 'equilibrado',
      escalacao: a.titulares.map((j) => ({ jogador: j, vaga: j.posicao })),
      reservas: a.reservas,
    };
    pool.push({ chave, clubeId: a.id, nome: a.nome, ano: a.ano, pais: a.pais, campeaoLibertadores: campeoes.has(chave), jogavel: false, forca: mediaTitulares(time), time });
  }

  for (const c of clubes) {
    for (const t of c.temporadas) {
      const chave = `${c.id}-${t.ano}`;
      const time: Time = { id: chave, nome: `${c.nome} ${t.ano}`, ano: t.ano, estilo: 'equilibrado', escalacao: escalarAutomatico(t.jogadores) };
      pool.push({ chave, clubeId: c.id, nome: c.nome, ano: t.ano, pais: 'Brasil', campeaoLibertadores: campeoes.has(chave), jogavel: true, forca: mediaTitulares(time), time });
    }
  }
  return pool.sort((x, y) => x.ano - y.ano || x.nome.localeCompare(y.nome));
}
