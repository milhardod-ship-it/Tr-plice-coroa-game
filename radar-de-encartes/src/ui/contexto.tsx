import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { estaValida } from '../core/precos';
import { agruparProdutos, type Produto } from '../core/produtos';
import type { Categoria, ItemLista, Oferta, Perfil, ProgramaId } from '../core/tipos';
import { MAPA_ENCARTES, TODAS_OFERTAS } from '../dados';

export type Aba = 'inicio' | 'buscar' | 'lista' | 'encartes' | 'perfil';

/** Item salvo na lista: guarda o nome para mostrar mesmo quando a oferta vencer. */
export interface ItemSalvo extends ItemLista {
  rotulo: string;
}

interface Contexto {
  hoje: string;
  perfil: Perfil;
  alternarPrograma: (p: ProgramaId) => void;
  ofertas: Oferta[];
  produtos: Map<string, Produto>;
  lista: ItemSalvo[];
  adicionar: (produto: Produto) => void;
  mudarQuantidade: (produto: string, delta: number) => void;
  remover: (produto: string) => void;
  limparLista: () => void;
  aba: Aba;
  irPara: (aba: Aba, opcoes?: { categoria?: Categoria | null; focarBusca?: boolean }) => void;
  categoriaBusca: Categoria | null;
  focarBusca: boolean;
  produtoAberto: string | null;
  abrirProduto: (id: string) => void;
  fecharProduto: () => void;
  avisar: (texto: string) => void;
  aviso: string | null;
}

const Ctx = createContext<Contexto | null>(null);

export function useApp(): Contexto {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp fora do provedor');
  return c;
}

function lerLocal<T>(chave: string, inicial: T): T {
  try {
    const v = localStorage.getItem(chave);
    return v ? (JSON.parse(v) as T) : inicial;
  } catch {
    return inicial;
  }
}
function salvarLocal(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* modo privado: segue sem salvar */
  }
}

/** Modo de teste: fixa a data para ver os encartes desta versão mesmo depois que vencerem. */
export const CHAVE_DATA_TESTE = 'radar:data-teste:v1';
export const DATA_DE_TESTE = '2026-11-23';

export function definirDataDeTeste(ligar: boolean) {
  if (ligar) salvarLocal(CHAVE_DATA_TESTE, DATA_DE_TESTE);
  else
    try {
      localStorage.removeItem(CHAVE_DATA_TESTE);
    } catch {
      /* ignora */
    }
  location.reload();
}

/** Data de hoje no aparelho (AAAA-MM-DD). Para testes: ?data=2026-11-23 na URL. */
function dataDeHoje(): string {
  const p = new URLSearchParams(location.search).get('data') ?? lerLocal<string | null>(CHAVE_DATA_TESTE, null);
  if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ProvedorApp({ children }: { children: ReactNode }) {
  const [hoje] = useState(dataDeHoje);
  const [perfil, setPerfil] = useState<Perfil>(() => lerLocal('radar:perfil:v1', { programas: [] }));
  const [lista, setLista] = useState<ItemSalvo[]>(() => lerLocal('radar:lista:v1', []));
  const [aba, setAba] = useState<Aba>('inicio');
  const [categoriaBusca, setCategoriaBusca] = useState<Categoria | null>(null);
  const [focarBusca, setFocarBusca] = useState(false);
  const [produtoAberto, setProdutoAberto] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const historicoOk = useRef(false);

  useEffect(() => salvarLocal('radar:perfil:v1', perfil), [perfil]);
  useEffect(() => salvarLocal('radar:lista:v1', lista), [lista]);

  const ofertas = useMemo(() => TODAS_OFERTAS.filter((o) => estaValida(o, MAPA_ENCARTES, hoje)), [hoje]);
  const produtos = useMemo(() => agruparProdutos(ofertas), [ofertas]);

  // Botão "voltar" do celular fecha a tela de produto.
  useEffect(() => {
    const aoVoltar = () => setProdutoAberto(null);
    addEventListener('popstate', aoVoltar);
    return () => removeEventListener('popstate', aoVoltar);
  }, []);

  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    setTimeout(() => setAviso((a) => (a === texto ? null : a)), 2200);
  }, []);

  const valor: Contexto = {
    hoje,
    perfil,
    alternarPrograma: (p) =>
      setPerfil((atual) => ({
        programas: atual.programas.includes(p) ? atual.programas.filter((x) => x !== p) : [...atual.programas, p],
      })),
    ofertas,
    produtos,
    lista,
    adicionar: (produto) => {
      setLista((l) =>
        l.some((i) => i.produto === produto.id)
          ? l.map((i) => (i.produto === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i))
          : [...l, { produto: produto.id, quantidade: 1, rotulo: rotuloProduto(produto) }],
      );
      avisar('Adicionado à lista');
    },
    mudarQuantidade: (produto, delta) =>
      setLista((l) =>
        l
          .map((i) => (i.produto === produto ? { ...i, quantidade: i.quantidade + delta } : i))
          .filter((i) => i.quantidade > 0),
      ),
    remover: (produto) => setLista((l) => l.filter((i) => i.produto !== produto)),
    limparLista: () => setLista([]),
    aba,
    irPara: (novaAba, opcoes) => {
      setAba(novaAba);
      setCategoriaBusca(opcoes?.categoria ?? null);
      setFocarBusca(!!opcoes?.focarBusca);
      setProdutoAberto(null);
      scrollTo(0, 0);
    },
    categoriaBusca,
    focarBusca,
    produtoAberto,
    abrirProduto: (id) => {
      try {
        history.pushState({ produto: id }, '');
        historicoOk.current = true;
      } catch {
        historicoOk.current = false; // visualizador sem histórico: o botão Voltar fecha direto
      }
      setProdutoAberto(id);
      scrollTo(0, 0);
    },
    fecharProduto: () => {
      if (historicoOk.current) history.back();
      else setProdutoAberto(null);
    },
    avisar,
    aviso,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function rotuloProduto(p: Pick<Produto, 'nome' | 'marca'>): string {
  return [p.nome, p.marca].filter(Boolean).join(' ');
}
