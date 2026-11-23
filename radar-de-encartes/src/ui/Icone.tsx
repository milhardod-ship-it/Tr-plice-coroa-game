const CAMINHOS: Record<string, string> = {
  inicio: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  buscar: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 2-4-4',
  lista: 'M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01',
  encartes: 'M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 5h8m-8 4h8m-8 4h5',
  perfil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9c0-4 4-6 8-6s8 2 8 6',
  voltar: 'm15 6-6 6 6 6',
  seta: 'm9 6 6 6-6 6',
  mais: 'M12 5v14M5 12h14',
  menos: 'M5 12h14',
  relogio: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-14v5l3 2',
  cartao: 'M3 6h18v13H3zM3 10h18M7 15h4',
  check: 'm5 12 5 5 9-10',
  lixeira: 'M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13',
  local: 'M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
};

export function Icone({ nome, tamanho = 22, grosso = false }: { nome: keyof typeof CAMINHOS | string; tamanho?: number; grosso?: boolean }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosso ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={CAMINHOS[nome] ?? ''} />
    </svg>
  );
}

export function Logo({ tamanho = 32 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="#0B7A55" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 12 19 5" />
      <circle cx="12" cy="12" r="1.8" fill="#FFD23F" stroke="#C9A227" />
    </svg>
  );
}
