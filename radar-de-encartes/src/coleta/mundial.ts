// Coleta do Mundial: o site (Next.js) traz as ofertas prontas em JSON dentro da página
// (__NEXT_DATA__), em https://www.supermercadosmundial.com.br/departamentos/categoria/ofertas?page=N.
import type { Baixar } from './http';

export const SITE_MUNDIAL = 'https://www.supermercadosmundial.com.br';

export interface EncarteMundial {
  id: string;
  descricao: string;
  pdf: string | null;
  publicadoEm: string;
  despublicadoEm: string;
}

export interface ColetaMundial {
  fonte: 'mundial-site';
  coletadoEm: string;
  encartes: EncarteMundial[];
  /** Ofertas como vieram do site (formato do Mundial). */
  ofertas: unknown[];
}

/** Extrai o JSON __NEXT_DATA__ (props.pageProps) de uma página do site. */
export function lerPageProps(html: string): Record<string, any> {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('Mundial: página sem __NEXT_DATA__ (o site mudou?)');
  return JSON.parse(m[1]).props?.pageProps ?? {};
}

export function lerEncartesMundial(pageProps: Record<string, any>): EncarteMundial[] {
  return (pageProps.encartes ?? []).map((e: any) => ({
    id: String(e.id),
    descricao: String(e.description ?? ''),
    pdf: e.file?.url ?? null,
    publicadoEm: e.publishedIn,
    despublicadoEm: e.unpublishedIn,
  }));
}

export function coletarMundial(baixar: Baixar, agora = new Date()): ColetaMundial {
  const encartes = lerEncartesMundial(lerPageProps(baixar(`${SITE_MUNDIAL}/encarte`)));
  const ofertas: unknown[] = [];
  let paginas = 1;
  for (let p = 1; p <= paginas && p <= 80; p++) {
    const props = lerPageProps(baixar(`${SITE_MUNDIAL}/departamentos/categoria/ofertas?page=${p}`));
    paginas = Number(props.numberOfPages ?? 1);
    ofertas.push(...(props.offers ?? []));
  }
  if (ofertas.length === 0) throw new Error('Mundial: nenhuma oferta encontrada (o site mudou?)');
  return { fonte: 'mundial-site', coletadoEm: agora.toISOString(), encartes, ofertas };
}
