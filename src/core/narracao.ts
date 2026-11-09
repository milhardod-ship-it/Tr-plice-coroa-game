/**
 * Narração no estilo de rádio brasileiro, gerada a partir do resultado JÁ simulado.
 * Determinística (seed por jogo): as frases mudam de jogo para jogo, mas não ao recarregar.
 * Não altera nada do resultado — só conta o que o motor decidiu.
 */
import type { Lado, ResultadoPartida, Time } from './motor';
import { Rng } from './rng';
import type { AnuncioConfronto } from './torneio';

export type TipoEvento = 'inicio' | 'lance' | 'gol' | 'intervalo' | 'tensao' | 'fim' | 'penaltis' | 'cobranca';

export interface EventoNarracao {
  minuto: number;
  tipo: TipoEvento;
  texto: string;
  /** Placar depois do evento [meu, adversário]. */
  placar: [number, number];
  lado?: Lado;
  /** Cobrança: texto do resultado, revelado depois de uma pausa. */
  resultado?: string;
  convertido?: boolean;
  /** Placar dos pênaltis depois da cobrança. */
  placarPenaltis?: [number, number];
}

const F = {
  inicio: [
    'Rola a bola! Começa o jogo entre {A} e {B}!',
    'Autoriza o árbitro, bola rolando para {A} e {B}!',
    'Tá valendo! {A} e {B} em campo, estádio cheio!',
  ],
  golMeu: [
    'GOOOOOOL! É do {A}! {autor}, aos {min}!',
    'Lá vai ele... chutou... GOOOOOL! {autor} não perdoa!',
    'GOOOOL! Explode a torcida! {autor} balança a rede!',
    'É GOL, É GOL, É GOL! {autor} manda pro fundo do barbante!',
    'GOOOOOL! Que pintura, {autor}! {A} na frente!',
  ],
  golMeuEmpata: ['GOOOOL! {autor} EMPATA o jogo para o {A}!', 'GOOOOL! Tudo igual! {autor} deixa tudo como começou!'],
  golMeuVira: ['GOOOOOOL DA VIRADA! {autor}! O {A} vira o jogo!', 'VIROOOU! {autor} coloca o {A} na frente!'],
  golDeles: [
    'Gol do {B}. {autor} marca e cala a torcida.',
    'Não deu... {autor} faz para o {B}.',
    'Bola na rede, mas do lado errado: {autor}, do {B}.',
    'Castigo! {autor} aproveita e o {B} marca.',
  ],
  contraMeu: ['GOOOOL! Gol contra de {autor}! Conta pro {A}!'],
  contraDeles: ['Que azar! {autor} desvia contra o próprio gol. Gol do {B}.'],
  trave: ['NA TRAAAVE! {jog} quase marca!', 'Explode no poste! Que susto, {jog}!', 'Carimbou a trave! {jog} por centímetros!'],
  defesa: ['Que defesa de {gol}! {jog} parou no goleiro!', '{jog} bateu firme, mas {gol} buscou lá no ângulo!', 'Milagre de {gol} no chute de {jog}!'],
  chance: ['Uuuh! {jog} chutou pra fora!', 'Por cima do travessão! {jog} desperdiça.', '{jog} cara a cara... e isola! Inacreditável!', 'Passou raspando! {jog} quase!'],
  intervalo: ['Fim do primeiro tempo: {A} {x} × {y} {B}.', 'Apita o árbitro, intervalo. {A} {x} × {y} {B}.'],
  tensaoEmpate: ['Reta final e tudo igual! Coração na mão!', 'Minutos finais, jogo aberto! Quem marcar leva!'],
  tensaoGanhando: ['Segura, {A}! Os minutos finais são de sofrimento!', 'O {B} vem com tudo para cima! Aguenta, {A}!'],
  tensaoPerdendo: ['O {A} se lança ao ataque! Ainda dá tempo!', 'Todo mundo na frente! O {A} precisa do gol!'],
  fimVitoria: ['Apita o árbitro! FIM DE JOGO! Vitória do {A}: {x} × {y}!', 'Acabou! O {A} vence por {x} × {y}!'],
  fimEmpate: ['Fim de jogo! Empate em {x} × {y}.', 'Apita o árbitro: {x} × {y}, tudo igual.'],
  fimDerrota: ['Fim de jogo. O {B} vence por {y} × {x}.', 'Acabou. Derrota do {A}: {x} × {y}.'],
  penaltis: ['Vai para os pênaltis! Haja coração!', 'Empate no tempo normal... a decisão vai para as penalidades!'],
  cobranca: ['{jog} ajeita a bola...', '{jog} vai para a cobrança...', 'Corre {jog}...', '{jog} na marca da cal...'],
  convertido: ['GOL! Bateu firme!', 'É GOL! Deslocou o goleiro!', 'Converteu! Sem chance para o goleiro!'],
  defendido: ['DEFENDEU {gol}!', 'PEGOU! {gol} voou no canto!'],
  fora: ['PRA FORA! Desperdiçou!', 'Na trave e pra fora!'],
  vinganca: ['Hoje é dia de vingança! {titulo}: a torcida não esqueceu.'],
  classico: ['Clássico histórico! {titulo}. O estádio ferve!'],
  vingancaGol: ['É A REVANCHE, TORCIDA! '],
  vingancaFim: ['VINGANÇA CONSUMADA! '],
};

function preencher(t: string, v: Record<string, string | number>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
}

const fmtMin = (m: number) => (m > 90 ? `90+${m - 90}` : `${m}`);

export function narrarPartida(
  r: ResultadoPartida, meu: Time, adv: Time, seed: number,
  nomes: { A: string; B: string }, confronto?: AnuncioConfronto,
): EventoNarracao[] {
  const rng = new Rng(seed);
  const pick = (lista: string[]) => rng.item(lista);
  const gk = (t: Time) => t.escalacao.find((e) => e.vaga === 'GOL')?.jogador.nome ?? 'o goleiro';
  const ev: EventoNarracao[] = [];
  const base = { A: nomes.A, B: nomes.B };
  let placar: [number, number] = [0, 0];

  const abertura = preencher(pick(F.inicio), base);
  const anuncio = confronto ? preencher(pick(confronto.tipo === 'vinganca' ? F.vinganca : F.classico), { titulo: confronto.titulo }) + ' ' : '';
  ev.push({ minuto: 0, tipo: 'inicio', texto: anuncio + abertura, placar: [0, 0] });

  type Bruto = { minuto: number; gol?: (typeof r.gols)[number]; lance?: (typeof r.lances)[number] };
  const brutos: Bruto[] = [...r.gols.map((gol): Bruto => ({ minuto: gol.minuto, gol })), ...r.lances.map((lance): Bruto => ({ minuto: lance.minuto, lance }))]
    .sort((x, y) => x.minuto - y.minuto || (x.gol ? 1 : 0) - (y.gol ? 1 : 0));

  let intervalo = false;
  let tensao = false;
  let estevePerdendo = false;
  for (const b of brutos) {
    if (!intervalo && b.minuto > 45) {
      intervalo = true;
      ev.push({ minuto: 45, tipo: 'intervalo', texto: preencher(pick(F.intervalo), { ...base, x: placar[0], y: placar[1] }), placar });
    }
    if (!tensao && b.minuto >= 80 && Math.abs(placar[0] - placar[1]) <= 1) {
      tensao = true;
      const lista = placar[0] === placar[1] ? F.tensaoEmpate : placar[0] > placar[1] ? F.tensaoGanhando : F.tensaoPerdendo;
      ev.push({ minuto: 80, tipo: 'tensao', texto: preencher(pick(lista), base), placar });
    }
    if (b.gol) {
      const g = b.gol;
      const antes = placar;
      placar = g.time === 'a' ? [antes[0] + 1, antes[1]] : [antes[0], antes[1] + 1];
      let lista: string[];
      if (g.time === 'a') {
        const virou = estevePerdendo && antes[0] === antes[1];
        lista = g.contra ? F.contraMeu : placar[0] === placar[1] ? F.golMeuEmpata : virou ? F.golMeuVira : F.golMeu;
      } else {
        lista = g.contra ? F.contraDeles : F.golDeles;
      }
      let texto = preencher(pick(lista), { ...base, autor: g.autor, min: fmtMin(g.minuto) });
      if (g.time === 'a' && confronto?.tipo === 'vinganca' && rng.proximo() < 0.5) texto = F.vingancaGol[0] + texto;
      ev.push({ minuto: g.minuto, tipo: 'gol', texto, placar, lado: g.time });
      if (placar[0] < placar[1]) estevePerdendo = true;
    } else if (b.lance) {
      const l = b.lance;
      const goleiroQueDefende = l.time === 'a' ? gk(adv) : gk(meu);
      ev.push({ minuto: l.minuto, tipo: 'lance', texto: preencher(pick(F[l.tipo]), { jog: l.jogador, gol: goleiroQueDefende }), placar, lado: l.time });
    }
  }
  if (!intervalo) ev.push({ minuto: 45, tipo: 'intervalo', texto: preencher(pick(F.intervalo), { ...base, x: placar[0], y: placar[1] }), placar });
  if (!tensao && Math.abs(placar[0] - placar[1]) <= 1) {
    const lista = placar[0] === placar[1] ? F.tensaoEmpate : placar[0] > placar[1] ? F.tensaoGanhando : F.tensaoPerdendo;
    ev.push({ minuto: 80, tipo: 'tensao', texto: preencher(pick(lista), base), placar });
  }
  ev.sort((x, y) => x.minuto - y.minuto);

  const fimMin = Math.max(90, ...r.gols.map((g) => g.minuto), ...r.lances.map((l) => l.minuto));
  const vars = { ...base, x: placar[0], y: placar[1] };
  const fimLista = placar[0] > placar[1] ? F.fimVitoria : placar[0] < placar[1] ? F.fimDerrota : F.fimEmpate;
  let fimTexto = preencher(pick(fimLista), vars);
  if (confronto?.tipo === 'vinganca' && placar[0] > placar[1]) fimTexto = F.vingancaFim[0] + fimTexto;
  ev.push({ minuto: fimMin, tipo: 'fim', texto: fimTexto, placar });

  if (r.penaltis) {
    ev.push({ minuto: fimMin, tipo: 'penaltis', texto: pick(F.penaltis), placar });
    const pp: [number, number] = [0, 0];
    for (const c of r.penaltis.cobrancas) {
      if (c.convertido) pp[c.time === 'a' ? 0 : 1]++;
      const goleiro = c.time === 'a' ? gk(adv) : gk(meu);
      const resultado = c.convertido ? pick(F.convertido) : rng.proximo() < 0.6 ? preencher(pick(F.defendido), { gol: goleiro }) : pick(F.fora);
      ev.push({
        minuto: fimMin, tipo: 'cobranca', texto: preencher(pick(F.cobranca), { jog: c.cobrador }), resultado,
        convertido: c.convertido, lado: c.time, placar, placarPenaltis: [pp[0], pp[1]],
      });
    }
  }
  return ev;
}
