import { useEffect, useMemo, useRef, useState } from 'react';

const LARGURA = 96;
const VOLTAS = 26;

/**
 * Roleta de anos que gira e desacelera até o ano JÁ sorteado pelo motor.
 * A animação é só apresentação: o resultado vem do sorteio honesto (com seed).
 */
export function Roleta({ anos, alvo, lendaria, onFim }: { anos: number[]; alvo: number; lendaria: boolean; onFim: () => void }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [parou, setParou] = useState(false);
  const fim = useRef(false);

  // Fita de anos aleatórios (apenas visual) terminando no ano sorteado.
  const fita = useMemo(() => {
    // Evita o mesmo ano lado a lado (e vizinhos iguais ao ano sorteado), que confundiria a leitura.
    const f: number[] = [];
    const proximo = (proibidos: number[]) => {
      const ok = anos.filter((a) => !proibidos.includes(a));
      const lista = ok.length ? ok : anos;
      return lista[Math.floor(Math.random() * lista.length)];
    };
    for (let i = 0; i < VOLTAS; i++) f.push(proximo(i === VOLTAS - 1 ? [f[i - 1], alvo] : [f[i - 1]]));
    f.push(alvo);
    for (let i = 0; i < 3; i++) f.push(proximo([f[f.length - 1], alvo]));
    return f;
  }, [anos, alvo]);

  const destino = () => {
    const w = caixa.current?.offsetWidth ?? 360;
    return w / 2 - LARGURA / 2 - VOLTAS * LARGURA;
  };

  const terminar = () => {
    if (fim.current) return;
    fim.current = true;
    setParou(true);
    setTimeout(onFim, lendaria ? 650 : 250);
  };

  useEffect(() => {
    const w = caixa.current?.offsetWidth ?? 360;
    setX(w / 2 - LARGURA / 2);
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setDuracao(reduzir ? 0 : 1700);
        setX(destino());
        if (reduzir) terminar();
      }),
    );
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pular = () => {
    setDuracao(0);
    setX(destino());
    terminar();
  };

  return (
    <div className={`roleta ${parou ? 'parou' : ''} ${parou && lendaria ? 'dourada' : ''}`} ref={caixa} onClick={pular}>
      <div
        className="fita"
        style={{ transform: `translateX(${x}px)`, transition: `transform ${duracao}ms cubic-bezier(.08,.75,.18,1)` }}
        onTransitionEnd={terminar}
      >
        {fita.map((a, i) => (
          <span key={i} className={`ano-roleta ${i === VOLTAS && parou ? 'alvo' : ''}`} style={{ width: LARGURA }}>
            {a}
          </span>
        ))}
      </div>
      <span className="ponteiro" />
    </div>
  );
}
