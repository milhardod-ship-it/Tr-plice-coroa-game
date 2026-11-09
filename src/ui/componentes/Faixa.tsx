import type { ClubeJogavel } from '../../core/tipos';

/** Identidade do clube só pelas cores (sem escudo). */
export function Faixa({ clube, grande }: { clube: Pick<ClubeJogavel, 'cores'>; grande?: boolean }) {
  return (
    <span
      className={`faixa ${grande ? 'grande' : ''}`}
      style={{ background: `linear-gradient(135deg, ${clube.cores.primaria} 50%, ${clube.cores.secundaria} 50%)` }}
    />
  );
}
