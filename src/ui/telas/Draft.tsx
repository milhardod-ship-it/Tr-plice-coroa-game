import { useEffect, useMemo, useState } from 'react';
import {
  escolher, forcaGeral, jogadoresUsados, resortear, rodadaAtual, temporadaAtual, vagasLivres, RODADAS,
  type EstadoDraft,
} from '../../core/draft';
import { FORMACOES } from '../../core/formacoes';
import { encaixe, notaEfetiva } from '../../core/posicoes';
import { raridade } from '../../core/raridade';
import { POSICOES, type Jogador } from '../../core/tipos';
import { ehIdolo, textoIdolo } from '../../core/idolos';
import { Campo, type ItemCampo } from '../componentes/Campo';
import { Carta } from '../componentes/Carta';
import { Faixa } from '../componentes/Faixa';
import { Roleta } from '../componentes/Roleta';
import { clubePorId, nomeCurto, varsClube } from '../util';

const SIMBOLO = { natural: '✓', alternativa: '≈', improvisado: '!' } as const;

export function Draft({ estado, mudar, sair }: { estado: EstadoDraft; mudar: (e: EstadoDraft) => void; sair: () => void }) {
  const clube = clubePorId(estado.clubeId);
  const temporada = temporadaAtual(estado, clube)!;
  const almanaque = estado.modo === 'almanaque';
  const lendaria = temporada.titulos.length > 0;
  const anos = useMemo(() => clube.temporadas.map((t) => t.ano), [clube]);
  const usados = jogadoresUsados(estado);

  // Cada sorteio (inclusive re-sorteio) tem uma chave nova → roleta toca de novo.
  const chave = estado.sorteios.length;
  const [revelada, setRevelada] = useState<number>(-1);
  const [selecionado, setSelecionado] = useState<Jogador | null>(null);
  const [verTime, setVerTime] = useState(false);
  const mostrando = revelada === chave;

  const ordenados = useMemo(
    () => [...temporada.jogadores].sort((a, b) => POSICOES.indexOf(a.posicao) - POSICOES.indexOf(b.posicao)),
    [temporada],
  );

  const [idolo, setIdolo] = useState<string | null>(null);
  useEffect(() => {
    if (!idolo) return;
    const t = setTimeout(() => setIdolo(null), 2800);
    return () => clearTimeout(t);
  }, [idolo]);

  const colocar = (vaga: number) => {
    if (!selecionado) return;
    // Entrada especial para ídolos (só no Clássico: no Almanaque entregaria a nota).
    if (!almanaque && ehIdolo(selecionado, temporada)) setIdolo(textoIdolo(selecionado, temporada, clube.nome, estado.rng));
    mudar(escolher(estado, clube, selecionado.nome, vaga));
    setSelecionado(null);
  };

  return (
    <div className="tela draft" style={varsClube(clube)}>
      <header className="barra-draft">
        <button className="voltar" onClick={sair}>‹ Sair</button>
        <div className="rodada">
          <small>Rodada</small>
          <b>{rodadaAtual(estado)}<span>/{RODADAS}</span></b>
        </div>
        <button className="btn-time" onClick={() => setVerTime(true)}>
          Meu time{!almanaque && <b>{forcaGeral(estado) || '–'}</b>}
        </button>
      </header>
      <div className="progresso">
        {estado.escalacao.map((x, i) => <i key={i} className={x ? 'on' : ''} />)}
      </div>

      <Roleta key={chave} anos={anos} alvo={temporada.ano} lendaria={lendaria} onFim={() => setRevelada(chave)} />

      {mostrando && (
        <>
          <div className={`banner-temporada ${lendaria ? 'lendaria' : ''}`} key={`b${chave}`}>
            {lendaria && <span className="selo-lendaria">★ Temporada Lendária ★</span>}
            <h2><Faixa clube={clube} /> {clube.nome} {temporada.ano}</h2>
            <p>{temporada.observacao}</p>
          </div>

          <div className="acoes-rodada">
            <span>Escolha 1 jogador</span>
            <button
              className="btn-resortear"
              disabled={estado.resorteiosRestantes === 0}
              onClick={() => mudar(resortear(estado, clube))}
            >
              ↻ Re-sortear <b>{estado.resorteiosRestantes}</b>
            </button>
          </div>

          <div className="cartas" key={`c${chave}`}>
            {ordenados.map((j, i) => {
              const r = raridade(j.nota);
              const extra = !almanaque && r === 'lenda' ? 250 : 0;
              return (
                <Carta
                  key={j.nome}
                  jogador={j}
                  oculta={almanaque}
                  usada={usados.has(j.nome)}
                  atraso={i * 55 + extra}
                  onClick={() => setSelecionado(j)}
                />
              );
            })}
          </div>
        </>
      )}

      {idolo && (
        <div className="idolo" onClick={() => setIdolo(null)}>
          <span className="estrela">★</span>
          <p>{idolo}</p>
        </div>
      )}

      {selecionado && (
        <Folha fechar={() => setSelecionado(null)}>
          <EscolherVaga estado={estado} jogador={selecionado} ano={temporada.ano} colocar={colocar} />
        </Folha>
      )}

      {verTime && (
        <Folha fechar={() => setVerTime(false)}>
          <h3 className="titulo-folha">Meu time · {estado.formacao}</h3>
          <Campo formacao={estado.formacao} itens={itensTime(estado)} />
          <button className="botao-grande secundario" onClick={() => setVerTime(false)}>Fechar</button>
        </Folha>
      )}
    </div>
  );
}

function itensTime(estado: EstadoDraft): ItemCampo[] {
  const vagas = FORMACOES[estado.formacao].vagas;
  const almanaque = estado.modo === 'almanaque';
  return vagas.map((p, i) => {
    const x = estado.escalacao[i];
    if (!x) return { topo: p, classe: 'vazio' };
    return {
      topo: p,
      centro: almanaque ? `'${String(x.ano).slice(2)}` : String(notaEfetiva(x.jogador, p)),
      nome: nomeCurto(x.jogador.nome),
      classe: almanaque ? 'cheio' : `cheio r-${raridade(x.jogador.nota)}`,
    };
  });
}

function EscolherVaga({
  estado, jogador, ano, colocar,
}: { estado: EstadoDraft; jogador: Jogador; ano: number; colocar: (v: number) => void }) {
  const almanaque = estado.modo === 'almanaque';
  const vagas = FORMACOES[estado.formacao].vagas;
  const livres = vagasLivres(estado, jogador);
  const melhor = livres.reduce((a, b) => (b.nota > a.nota ? b : a), livres[0]);

  const itens: ItemCampo[] = vagas.map((p, i) => {
    const x = estado.escalacao[i];
    if (x) return { topo: p, nome: nomeCurto(x.jogador.nome), classe: 'ocupado' };
    const enc = encaixe(jogador, p);
    const nota = livres.find((v) => v.indice === i)!.nota;
    return {
      topo: p,
      centro: almanaque ? SIMBOLO[enc] : String(nota),
      classe: `livre e-${enc} ${melhor.indice === i ? 'melhor' : ''}`,
      onClick: () => colocar(i),
    };
  });

  return (
    <>
      <div className="cab-folha">
        <span className="carta-pos">{jogador.posicao}</span>
        <div>
          <h3>{jogador.nome}</h3>
          <small>{ano}{jogador.alternativas.length ? ` · também ${jogador.alternativas.join(', ')}` : ''}</small>
        </div>
      </div>
      <p className="dica">Toque numa vaga livre.{' '}
        <span className="e-natural">✓ posição natural</span> · <span className="e-alternativa">≈ alternativa</span> ·{' '}
        <span className="e-improvisado">! improvisado</span>
      </p>
      <Campo formacao={estado.formacao} itens={itens} />
    </>
  );
}

function Folha({ children, fechar }: { children: React.ReactNode; fechar: () => void }) {
  return (
    <div className="fundo-folha" onClick={fechar}>
      <div className="folha" onClick={(e) => e.stopPropagation()}>
        <button className="fechar-folha" onClick={fechar} aria-label="Fechar">✕</button>
        {children}
      </div>
    </div>
  );
}
