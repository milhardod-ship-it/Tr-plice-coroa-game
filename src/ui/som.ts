/**
 * Sons curtos sintetizados na hora com Web Audio (sem arquivos, sem músicas nem hinos).
 * O botão de silenciar desliga sons e vibração.
 */
let ctx: AudioContext | null = null;
let ligado = true;

export const setSomLigado = (v: boolean) => { ligado = v; };
export const somLigado = () => ligado;

function audio(): AudioContext | null {
  if (!ligado) return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tom(freq: number, inicio: number, dur: number, tipo: OscillatorType = 'sine', vol = 0.15, freqFim?: number) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + inicio;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(freq, t0);
  if (freqFim) o.frequency.exponentialRampToValueAtTime(freqFim, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function ruido(inicio: number, dur: number, vol = 0.12) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + inicio;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filtro = a.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.value = 1200;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(filtro).connect(g).connect(a.destination);
  src.start(t0);
}

export const sons = {
  /** Cliques da roleta, desacelerando como a animação (duração em ms). */
  roleta(duracao = 1700) {
    const n = 18;
    for (let i = 0; i < n; i++) {
      const p = i / (n - 1);
      const t = (1 - Math.pow(1 - p, 0.45)) * (duracao / 1000) * 0.95;
      tom(1400, t, 0.03, 'square', 0.04);
    }
  },
  lendaria() { [523, 659, 784, 1047].forEach((f, i) => tom(f, i * 0.09, 0.35, 'triangle', 0.12)); },
  lenda() { [784, 988, 1175, 1568].forEach((f, i) => tom(f, 0.05 + i * 0.07, 0.4, 'sine', 0.1)); tom(2093, 0.4, 0.6, 'sine', 0.06); },
  escolha() { tom(660, 0, 0.08, 'triangle', 0.08); },
  gol() { ruido(0, 1.2, 0.16); tom(392, 0, 0.25, 'sawtooth', 0.06, 784); tom(523, 0.25, 0.5, 'triangle', 0.1); },
  golContra() { tom(330, 0, 0.35, 'triangle', 0.1, 196); },
  apito() { tom(2900, 0, 0.18, 'square', 0.05); tom(2900, 0.25, 0.18, 'square', 0.05); tom(2900, 0.5, 0.6, 'square', 0.05); },
  conquista() { [880, 1109, 1319].forEach((f, i) => tom(f, i * 0.08, 0.3, 'sine', 0.08)); },
};

export function vibrar(ms: number | number[]) {
  if (ligado) navigator.vibrate?.(ms);
}
