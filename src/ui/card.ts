/**
 * Card de compartilhamento 1080×1350 desenhado num <canvas> no próprio navegador.
 * Sem escudos nem fotos: só nome, cores do clube, o time escalado e a campanha.
 */
import type { AnaliseCampanha } from '../core/campanha';
import type { EstadoDraft } from '../core/draft';
import { FORMACOES } from '../core/formacoes';
import { notaEfetiva } from '../core/posicoes';
import { raridade } from '../core/raridade';
import type { ClubeJogavel } from '../core/tipos';
import type { JogoTorneio, Torneio } from '../core/torneio';
import { LAYOUT } from './componentes/Campo';
import { nomeCurto } from './util';

const W = 1080;
const H = 1350;
const FONTE = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const COR_RAR = { bronze: '#c07a43', prata: '#b8c2cc', ouro: '#f5c542', lenda: '#c084fc' };

const ROTULO: Record<string, string> = { oitavas: 'Oitavas', quartas: 'Quartas', semi: 'Semi', final: 'Final' };
const rotuloCurto = (j: JogoTorneio) => (j.fase === 'grupos' ? `G${j.rodada}` : ROTULO[j.fase]);

function texto(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, tam: number, cor: string, peso = 700, alinhar: CanvasTextAlign = 'left', larguraMax?: number) {
  let tamanho = tam;
  ctx.font = `${peso} ${tamanho}px ${FONTE}`;
  if (larguraMax) {
    while (ctx.measureText(t).width > larguraMax && tamanho > 14) {
      tamanho -= 2;
      ctx.font = `${peso} ${tamanho}px ${FONTE}`;
    }
  }
  ctx.fillStyle = cor;
  ctx.textAlign = alinhar;
  ctx.fillText(t, x, y);
}

export async function gerarCard(draft: EstadoDraft, clube: ClubeJogavel, torneio: Torneio, a: AnaliseCampanha): Promise<Blob> {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;

  // Fundo
  ctx.fillStyle = '#0b0f14';
  ctx.fillRect(0, 0, W, H);
  const brilho = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, 900);
  brilho.addColorStop(0, a.campeao ? '#4a3510' : '#1d2530');
  brilho.addColorStop(1, '#0b0f1400');
  ctx.fillStyle = brilho;
  ctx.fillRect(0, 0, W, H);

  // Faixa com as cores do clube
  ctx.fillStyle = clube.cores.primaria;
  ctx.fillRect(0, 0, W / 2, 16);
  ctx.fillStyle = clube.cores.secundaria;
  ctx.fillRect(W / 2, 0, W / 2, 16);

  // Cabeçalho
  ctx.letterSpacing = '6px';
  texto(ctx, 'TRÍPLICE COROA · LIBERTADORES', W / 2, 80, 28, '#f5c542', 800, 'center');
  ctx.letterSpacing = '0px';
  texto(ctx, (a.campeao ? '♛ ' : '') + a.titulo.toUpperCase(), W / 2, 165, 76, a.campeao ? '#f5c542' : '#e8edf3', 900, 'center', 980);
  texto(ctx, `${clube.nome} de todas as eras · ${draft.formacao} · ${draft.estilo}`, W / 2, 220, 34, '#8b98a9', 600, 'center', 980);
  if (a.quase[0]) texto(ctx, a.quase[0], W / 2, 272, 30, '#e8edf3', 700, 'center', 990);

  // Campo
  const cx = 60, cy = 310, cw = 960, ch = 540;
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i % 2 ? '#166534' : '#14532d';
    ctx.fillRect(cx, cy + (ch / 10) * i, cw, ch / 10 + 1);
  }
  ctx.strokeStyle = '#ffffff33';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx, cy, cw, ch);
  ctx.beginPath(); ctx.moveTo(cx, cy + ch / 2); ctx.lineTo(cx + cw, cy + ch / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + cw / 2, cy + ch / 2, 70, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(cx + cw * 0.3, cy, cw * 0.4, ch * 0.13);
  ctx.strokeRect(cx + cw * 0.3, cy + ch * 0.87, cw * 0.4, ch * 0.13);

  const vagas = FORMACOES[draft.formacao].vagas;
  LAYOUT[draft.formacao].forEach(([px, py], i) => {
    const e = draft.escalacao[i];
    if (!e) return;
    // O campo do card é mais largo que alto: estica as linhas na vertical para não sobrepor nomes.
    const x = cx + (px / 100) * cw;
    const y = cy + 40 + ((py - 11) / (90 - 11)) * (ch - 110);
    const nota = notaEfetiva(e.jogador, vagas[i]);
    const cor = COR_RAR[raridade(e.jogador.nota)];
    ctx.beginPath();
    ctx.arc(x, y, 33, 0, Math.PI * 2);
    ctx.fillStyle = '#0b0f14ee';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = cor;
    ctx.stroke();
    texto(ctx, String(nota), x, y + 11, 32, cor, 900, 'center');
    const nome = nomeCurto(e.jogador.nome);
    ctx.font = `700 22px ${FONTE}`;
    const largura = Math.min(170, ctx.measureText(nome).width + 16);
    ctx.fillStyle = '#0b0f14dd';
    ctx.fillRect(x - largura / 2, y + 38, largura, 30);
    texto(ctx, nome, x, y + 60, 22, '#ffffff', 700, 'center', 160);
  });

  // Campanha em duas colunas: grupos à esquerda, mata-mata à direita
  const colunas = [torneio.jogos.filter((j) => j.fase === 'grupos'), torneio.jogos.filter((j) => j.fase !== 'grupos')];
  colunas.forEach((lista, c) => {
    const x0 = 60 + c * 495;
    texto(ctx, c === 0 ? 'FASE DE GRUPOS' : 'MATA-MATA', x0, 905, 22, '#8b98a9', 800);
    lista.forEach((j, i) => {
      const y = 950 + i * (c === 0 ? 46 : 62);
      const venceu = j.r.vencedor === 'a', perdeu = j.r.vencedor === 'b';
      ctx.fillStyle = venceu ? '#22c55e' : perdeu ? '#ef4444' : '#f5c542';
      ctx.beginPath(); ctx.arc(x0 + 8, y - 9, 8, 0, Math.PI * 2); ctx.fill();
      texto(ctx, rotuloCurto(j), x0 + 26, y, 24, '#8b98a9', 700);
      texto(ctx, `${j.r.golsA}×${j.r.golsB}`, x0 + 150, y, 28, '#ffffff', 900, 'center');
      texto(ctx, `${j.adv.nome} ${j.adv.ano}`, x0 + 195, y, 24, '#e8edf3', 600, 'left', 280);
      if (j.r.penaltis) texto(ctx, `pênaltis ${j.r.penaltis.golsA}×${j.r.penaltis.golsB}`, x0 + 195, y + 24, 19, '#f5c542', 700);
    });
  });

  // Rodapé
  ctx.fillStyle = '#ffffff14';
  ctx.fillRect(0, H - 92, W, 92);
  const art = a.artilheiro ? ` · Artilheiro: ${a.artilheiro.nome} (${a.artilheiro.gols})` : '';
  texto(ctx, `${a.v}V ${a.e}E ${a.d}D · ${a.gp} gols${art}`, 60, H - 36, 28, '#e8edf3', 700, 'left', 640);
  texto(ctx, 'triplice-coroa.vercel.app', W - 60, H - 36, 26, '#f5c542', 800, 'right');

  return new Promise((ok, erro) => cv.toBlob((b) => (b ? ok(b) : erro(new Error('falha ao gerar imagem'))), 'image/png'));
}
