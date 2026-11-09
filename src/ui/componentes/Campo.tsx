import type { FormacaoId } from '../../core/formacoes';
import { FORMACOES } from '../../core/formacoes';

/** Coordenadas (x%, y%) de cada vaga, na mesma ordem de FORMACOES[f].vagas. Ataque para cima. */
export const LAYOUT: Record<FormacaoId, [number, number][]> = {
  '4-4-2': [[50, 90], [86, 68], [62, 73], [38, 73], [14, 68], [62, 53], [38, 53], [76, 35], [24, 35], [62, 14], [38, 14]],
  '4-3-3': [[50, 90], [86, 68], [62, 73], [38, 73], [14, 68], [50, 55], [72, 40], [28, 40], [84, 17], [16, 17], [50, 11]],
  '3-5-2': [[50, 90], [74, 73], [50, 75], [26, 73], [88, 46], [12, 46], [50, 57], [70, 39], [30, 39], [62, 14], [38, 14]],
  '4-2-3-1': [[50, 90], [86, 68], [62, 73], [38, 73], [14, 68], [64, 55], [36, 55], [84, 33], [50, 35], [16, 33], [50, 12]],
};

export interface ItemCampo {
  /** Texto dentro do círculo (posição, nota...). */
  topo: string;
  centro?: string;
  nome?: string;
  classe?: string;
  onClick?: () => void;
  estilo?: React.CSSProperties;
}

export function Campo({ formacao, itens, pequeno }: { formacao: FormacaoId; itens: ItemCampo[]; pequeno?: boolean }) {
  const pos = LAYOUT[formacao];
  return (
    <div className={`campo ${pequeno ? 'pequeno' : ''}`}>
      <div className="linhas">
        <span className="meio" />
        <span className="circulo" />
        <span className="area cima" />
        <span className="area baixo" />
      </div>
      {FORMACOES[formacao].vagas.map((_, i) => {
        const it = itens[i];
        const [x, y] = pos[i];
        const Tag = it.onClick ? 'button' : 'div';
        return (
          <Tag
            key={i}
            className={`no ${it.classe ?? ''}`}
            style={{ left: `${x}%`, top: `${y}%`, ...it.estilo }}
            onClick={it.onClick}
          >
            <span className="bola">
              <small>{it.topo}</small>
              {it.centro && <b>{it.centro}</b>}
            </span>
            {it.nome && <span className="rotulo">{it.nome}</span>}
          </Tag>
        );
      })}
    </div>
  );
}
