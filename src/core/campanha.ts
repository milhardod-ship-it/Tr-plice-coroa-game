/**
 * Análise da campanha para a tela final: título, quão perto chegou e destaques.
 * Puro: só lê o Torneio já simulado.
 */
import { resumoCampanha, type Fase, type JogoTorneio, type Torneio } from './torneio';

export interface AnaliseCampanha {
  titulo: string;
  campeao: boolean;
  invicto: boolean;
  /** Mensagens de "quase" (ex.: "Faltou 1 gol para o invicto"). */
  quase: string[];
  v: number; e: number; d: number; gp: number; gc: number;
  artilheiro?: { nome: string; gols: number };
  maiorVitoria?: JogoTorneio;
  /** Posição no grupo (1–4). */
  posicaoGrupo: number;
}

const TITULO_ELIM: Record<Fase, string> = {
  grupos: 'Eliminado na fase de grupos',
  oitavas: 'Eliminado nas oitavas',
  quartas: 'Eliminado nas quartas',
  semi: 'Eliminado na semifinal',
  final: 'Vice-campeão da Libertadores',
};

const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

export function analisarCampanha(t: Torneio): AnaliseCampanha {
  const r = resumoCampanha(t);
  const campeao = t.desfecho === 'campeao';
  const ultimo = t.jogos[t.jogos.length - 1];
  const tabela = t.tabelas[t.tabelas.length - 1];
  const posicaoGrupo = tabela.findIndex((l) => l.eu) + 1;
  const quase: string[] = [];

  if (campeao) {
    const derrotas = t.jogos.filter((j) => j.r.golsA < j.r.golsB);
    if (r.invicto) {
      if (r.e === 0) quase.push(`${plural(r.v, 'vitória', 'vitórias')} em ${plural(r.jogos, 'jogo', 'jogos')}: 100% de aproveitamento!`);
      else quase.push(`Invicto: ${plural(r.v, 'vitória', 'vitórias')} e ${plural(r.e, 'empate', 'empates')}.`);
    } else if (derrotas.length === 1 && derrotas[0].r.golsB - derrotas[0].r.golsA === 1) {
      const dj = derrotas[0];
      quase.push(`Faltou 1 gol para o invicto: a única derrota foi ${dj.r.golsA} a ${dj.r.golsB} para o ${dj.adv.nome} ${dj.adv.ano}.`);
    } else if (derrotas.length) {
      quase.push(`Campeão com ${plural(derrotas.length, 'derrota', 'derrotas')} no caminho.`);
    }
    const penaltis = t.jogos.filter((j) => j.r.penaltis);
    if (penaltis.length) quase.push(`Sobreviveu a ${plural(penaltis.length, 'disputa', 'disputas')} de pênaltis.`);
  } else if (t.faseFinal === 'grupos') {
    const corte = tabela[1];
    const eu = tabela[posicaoGrupo - 1];
    const faltam = corte.pts - eu.pts;
    if (faltam === 0) quase.push(`Ficou fora no desempate com o ${corte.nome}: mesmos ${corte.pts} pontos.`);
    else quase.push(`${posicaoGrupo}º no grupo: ${faltam === 1 ? 'faltou 1 ponto' : `faltaram ${faltam} pontos`} para a classificação.`);
  } else {
    const p = ultimo.r.penaltis;
    const placar = `${ultimo.r.golsA} a ${ultimo.r.golsB}`;
    if (p) {
      quase.push(`Eliminado nos pênaltis por ${p.golsB} a ${p.golsA}, depois do ${placar} contra o ${ultimo.adv.nome} ${ultimo.adv.ano}.`);
    } else if (ultimo.r.golsB - ultimo.r.golsA === 1) {
      quase.push(`Faltou 1 gol para levar aos pênaltis: ${placar} para o ${ultimo.adv.nome} ${ultimo.adv.ano}.`);
    } else {
      quase.push(`Parou no ${ultimo.adv.nome} ${ultimo.adv.ano}: ${placar}.`);
    }
    if (t.faseFinal === 'final') quase.push('A um jogo da glória eterna.');
    else if (t.faseFinal === 'semi') quase.push('A dois jogos do título.');
  }

  // Artilheiro da campanha (só gols do time do jogador, sem gols contra).
  const gols = new Map<string, number>();
  for (const j of t.jogos) for (const g of j.r.gols) if (g.time === 'a' && !g.contra) gols.set(g.autor, (gols.get(g.autor) ?? 0) + 1);
  const art = [...gols.entries()].sort((a, b) => b[1] - a[1])[0];

  const vitorias = t.jogos.filter((j) => j.r.golsA > j.r.golsB);
  const maiorVitoria = vitorias.sort((a, b) => b.r.golsA - b.r.golsB - (a.r.golsA - a.r.golsB) || b.r.golsA - a.r.golsA)[0];

  return {
    titulo: campeao ? (r.invicto ? 'Campeão invicto!' : 'Campeão da Libertadores!') : TITULO_ELIM[t.faseFinal],
    campeao, invicto: campeao && r.invicto, quase,
    v: r.v, e: r.e, d: r.d, gp: r.gp, gc: r.gc,
    artilheiro: art ? { nome: art[0], gols: art[1] } : undefined,
    maiorVitoria, posicaoGrupo,
  };
}
