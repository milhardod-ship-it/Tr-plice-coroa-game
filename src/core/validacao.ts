/**
 * Validação dos dados. Função pura: recebe os JSONs já lidos e devolve
 * erros (quebram o jogo) e avisos (dados incompletos, mas o jogo funciona).
 * Usada pelo script `npm run validar` e pela tela "Dados" do app.
 */
import { LISTA_FORMACOES } from './formacoes';
import {
  NOTA_MAX,
  NOTA_MIN,
  POSICOES,
  type ArquivoAdversarios,
  type ArquivoFinalistas,
  type ClubeJogavel,
  type Jogador,
  type Posicao,
} from './tipos';

export const MIN_JOGADORES_TEMPORADA = 11;
export const RECOMENDADO_JOGADORES_TEMPORADA = 16;

export interface ResultadoValidacao {
  erros: string[];
  avisos: string[];
  /** Finalistas da lista que ainda não têm elenco cadastrado. */
  pendentes: string[];
}

const posicaoValida = (p: unknown): p is Posicao => POSICOES.includes(p as Posicao);

function validarJogador(j: Jogador, onde: string, erros: string[]) {
  if (!j || typeof j.nome !== 'string' || !j.nome.trim()) {
    erros.push(`${onde}: jogador sem nome.`);
    return;
  }
  const quem = `${onde} › ${j.nome}`;
  if (!posicaoValida(j.posicao)) erros.push(`${quem}: posição "${j.posicao}" inválida.`);
  if (!Array.isArray(j.alternativas)) {
    erros.push(`${quem}: "alternativas" deve ser uma lista (pode ser vazia).`);
  } else {
    for (const a of j.alternativas) {
      if (!posicaoValida(a)) erros.push(`${quem}: posição alternativa "${a}" inválida.`);
      if (a === j.posicao) erros.push(`${quem}: alternativa repete a posição principal.`);
    }
  }
  if (j.duvida !== undefined && typeof j.duvida !== 'boolean') erros.push(`${quem}: "duvida" deve ser true ou false.`);
  if (!Number.isInteger(j.nota) || j.nota < NOTA_MIN || j.nota > NOTA_MAX) {
    erros.push(`${quem}: nota ${j.nota} fora do intervalo ${NOTA_MIN}–${NOTA_MAX}.`);
  }
}

/**
 * Verifica se dá para preencher todas as vagas da formação usando só
 * posições naturais (principal ou alternativa), sem repetir jogador.
 * Emparelhamento bipartido simples (algoritmo de caminhos aumentantes).
 */
export function cobreFormacao(jogadores: Jogador[], vagas: Posicao[]): boolean {
  const donoDaVaga: number[] = new Array(vagas.length).fill(-1);
  const serve = (j: Jogador, p: Posicao) => j.posicao === p || j.alternativas?.includes(p);

  const tentar = (ji: number, visitadas: boolean[]): boolean => {
    for (let v = 0; v < vagas.length; v++) {
      if (visitadas[v] || !serve(jogadores[ji], vagas[v])) continue;
      visitadas[v] = true;
      if (donoDaVaga[v] === -1 || tentar(donoDaVaga[v], visitadas)) {
        donoDaVaga[v] = ji;
        return true;
      }
    }
    return false;
  };

  for (let ji = 0; ji < jogadores.length; ji++) tentar(ji, new Array(vagas.length).fill(false));
  return donoDaVaga.every((d) => d !== -1);
}

export function validarDados(
  clubes: ClubeJogavel[],
  adversarios: ArquivoAdversarios,
  finalistas: ArquivoFinalistas,
): ResultadoValidacao {
  const erros: string[] = [];
  const avisos: string[] = [];
  const pendentes: string[] = [];

  // ---- Clubes jogáveis ----
  const idsClubes = new Set<string>();
  for (const c of clubes) {
    if (idsClubes.has(c.id)) erros.push(`Clube "${c.id}" duplicado.`);
    idsClubes.add(c.id);
    if (!c.cores?.primaria || !c.cores?.secundaria) erros.push(`${c.nome}: faltam as cores.`);
    if (!c.temporadas?.length) {
      avisos.push(`${c.nome}: nenhuma temporada cadastrada ainda (aparece como "em breve").`);
      continue;
    }
    const anos = new Set<number>();
    for (const t of c.temporadas) {
      const onde = `${c.nome} ${t.ano}`;
      if (anos.has(t.ano)) erros.push(`${onde}: temporada duplicada.`);
      anos.add(t.ano);
      if (!Number.isInteger(t.ano) || t.ano < 1980 || t.ano > 2025) erros.push(`${onde}: ano fora de 1980–2025.`);
      if (typeof t.revisado !== 'boolean') erros.push(`${onde}: falta "revisado".`);
      if (typeof t.observacao !== 'string') erros.push(`${onde}: falta "observacao".`);
      if (!Array.isArray(t.titulos)) erros.push(`${onde}: "titulos" deve ser uma lista.`);
      const js = t.jogadores ?? [];
      js.forEach((j) => validarJogador(j, onde, erros));
      const duv = js.filter((j) => j.duvida).length;
      if (duv) avisos.push(`${onde}: ${duv} jogador(es) marcados como dúvida.`);

      const nomes = new Set<string>();
      for (const j of js) {
        if (nomes.has(j.nome)) erros.push(`${onde}: jogador "${j.nome}" repetido no elenco.`);
        nomes.add(j.nome);
      }
      if (!js.some((j) => j.posicao === 'GOL')) erros.push(`${onde}: nenhum goleiro.`);
      if (js.length < MIN_JOGADORES_TEMPORADA) {
        erros.push(`${onde}: só ${js.length} jogadores (mínimo ${MIN_JOGADORES_TEMPORADA}).`);
      } else if (js.length < RECOMENDADO_JOGADORES_TEMPORADA) {
        avisos.push(`${onde}: ${js.length} jogadores (recomendado ${RECOMENDADO_JOGADORES_TEMPORADA}–20).`);
      }
      // Todas as posições precisam ter ao menos 1 jogador (principal ou alternativa).
      const faltando = POSICOES.filter((p) => !js.some((j) => j.posicao === p || j.alternativas?.includes(p)));
      if (faltando.length) erros.push(`${onde}: nenhum jogador para ${faltando.join(', ')}.`);
      // Formações completas sem improviso: desejável, mas não obrigatório,
      // porque no draft cada rodada sorteia uma temporada diferente.
      const incompletas = LISTA_FORMACOES.filter((f) => !cobreFormacao(js, f.vagas)).map((f) => f.id);
      if (incompletas.length) avisos.push(`${onde}: sozinho não monta ${incompletas.join(', ')} sem improvisar.`);
    }
  }

  // ---- Adversários ----
  const chaveAdv = new Set<string>();
  for (const a of adversarios.adversarios ?? []) {
    const onde = `${a.nome} ${a.ano}`;
    const chave = `${a.id}|${a.ano}`;
    if (chaveAdv.has(chave)) erros.push(`${onde}: adversário duplicado.`);
    chaveAdv.add(chave);
    if (idsClubes.has(a.id)) {
      erros.push(`${onde}: é clube jogável — o elenco deve ficar no arquivo do clube, não em adversários.`);
    }
    if (typeof a.revisado !== 'boolean') erros.push(`${onde}: falta "revisado".`);
    if (a.titulares?.length !== 11) erros.push(`${onde}: tem ${a.titulares?.length ?? 0} titulares (precisa de 11).`);
    if ((a.reservas?.length ?? 0) > 3) erros.push(`${onde}: mais de 3 reservas.`);
    const todos = [...(a.titulares ?? []), ...(a.reservas ?? [])];
    todos.forEach((j) => validarJogador(j, onde, erros));
    const goleiros = (a.titulares ?? []).filter((j) => j.posicao === 'GOL').length;
    if (goleiros !== 1) erros.push(`${onde}: precisa de exatamente 1 goleiro titular (tem ${goleiros}).`);
    const nomes = todos.map((j) => j.nome);
    if (new Set(nomes).size !== nomes.length) erros.push(`${onde}: jogador repetido no elenco.`);
    const duvidas = todos.filter((j) => j.duvida).length;
    if (duvidas) avisos.push(`${onde}: ${duvidas} jogador(es) marcados como dúvida.`);
  }

  // ---- Finalistas ----
  const anosFinal = new Set<number>();
  for (const f of finalistas.finais ?? []) {
    if (anosFinal.has(f.ano)) erros.push(`Finalistas: ano ${f.ano} duplicado.`);
    anosFinal.add(f.ano);
    for (const [papel, cf] of [['campeão', f.campeao], ['vice', f.vice]] as const) {
      const rotulo = `${cf.nome} ${f.ano} (${papel})`;
      const clube = clubes.find((c) => c.id === cf.id);
      if (clube) {
        if (!clube.temporadas.some((t) => t.ano === f.ano)) {
          pendentes.push(`${rotulo}: falta a temporada ${f.ano} no arquivo de ${clube.nome}.`);
        }
      } else if (!chaveAdv.has(`${cf.id}|${f.ano}`)) {
        pendentes.push(`${rotulo}: falta o elenco em adversarios.json.`);
      }
    }
  }
  for (let ano = 1980; ano <= 2025; ano++) {
    if (!anosFinal.has(ano)) erros.push(`Finalistas: falta o ano ${ano}.`);
  }

  return { erros, avisos, pendentes };
}
