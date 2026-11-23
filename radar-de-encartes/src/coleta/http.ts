// Download simples via curl (respeita o proxy da máquina e funciona igual no GitHub Actions).
import { execFileSync } from 'node:child_process';

const AGENTE = 'Mozilla/5.0 (compatible; RadarDeEncartes/0.1; coleta de encartes publicos)';

export type Baixar = (url: string) => string;

/** Baixa uma página como texto. Tenta de novo até 3 vezes; espera entre pedidos para não sobrecarregar o site. */
export function criarBaixar(pausaMs = 1200): Baixar {
  let ultimo = 0;
  return (url: string) => {
    for (let tentativa = 1; ; tentativa++) {
      const espera = ultimo + pausaMs - Date.now();
      if (espera > 0) dormir(espera);
      ultimo = Date.now();
      try {
        return execFileSync('curl', ['-sSL', '--fail', '-m', '40', '-A', AGENTE, url], {
          encoding: 'utf8',
          maxBuffer: 64 * 1024 * 1024,
        });
      } catch (e) {
        if (tentativa >= 3) throw new Error(`Falha ao baixar ${url}: ${(e as Error).message.split('\n')[0]}`);
        dormir(2000 * tentativa);
      }
    }
  };
}

function dormir(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
