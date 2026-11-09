/** Datas como texto "AAAA-MM-DD" (dia do calendário, sem fuso), para serem puras e comparáveis. */
const DIA = 86_400_000;

export const paraDias = (data: string) => {
  const [a, m, d] = data.split('-').map(Number);
  return Math.round(Date.UTC(a, m - 1, d) / DIA);
};

export const deDias = (n: number) => new Date(n * DIA).toISOString().slice(0, 10);

export const somarDias = (data: string, n: number) => deDias(paraDias(data) + n);
