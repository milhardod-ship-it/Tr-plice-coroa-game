import { useEffect, useMemo, useRef, useState } from 'react';
import { buscar, menorPrecoDoProduto, mercadosDistintos } from '../../core/produtos';
import { CATEGORIAS, type Categoria } from '../../core/tipos';
import { LinhaProduto } from '../componentes';
import { useApp } from '../contexto';
import { Icone } from '../Icone';

const SUGESTOES = ['arroz', 'feijão', 'café', 'leite', 'frango', 'azeite', 'cerveja', 'sabão'];
const LIMITE = 60;

export function Buscar() {
  const { produtos, perfil, categoriaBusca, focarBusca } = useApp();
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState<Categoria | null>(categoriaBusca);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => setCategoria(categoriaBusca), [categoriaBusca]);
  useEffect(() => {
    if (focarBusca) campo.current?.focus();
  }, [focarBusca]);

  const resultados = useMemo(() => {
    let lista = texto.trim() ? buscar(produtos.values(), texto, perfil) : [...produtos.values()];
    if (categoria) lista = lista.filter((p) => p.categoria === categoria);
    if (!texto.trim()) {
      // Sem texto: produtos comparáveis primeiro, depois os mais baratos.
      lista.sort(
        (a, b) =>
          mercadosDistintos(b) - mercadosDistintos(a) ||
          (menorPrecoDoProduto(a, perfil) ?? 0) - (menorPrecoDoProduto(b, perfil) ?? 0),
      );
    }
    return lista;
  }, [produtos, texto, categoria, perfil]);

  const mostrarResultados = texto.trim() || categoria;

  return (
    <>
      <h1 className="titulo-tela">Buscar</h1>
      <label className="busca">
        <Icone nome="buscar" tamanho={20} />
        <span className="so-leitor">Buscar produto</span>
        <input
          ref={campo}
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Quanto tá o… (ex.: arroz 5kg)"
          enterKeyHint="search"
        />
      </label>

      <div className="rolagem-h" role="group" aria-label="Categoria">
        <button className="filtro" aria-pressed={categoria === null} onClick={() => setCategoria(null)}>
          Todas
        </button>
        {CATEGORIAS.map((c) => (
          <button key={c} className="filtro" aria-pressed={categoria === c} onClick={() => setCategoria(c)}>
            {c}
          </button>
        ))}
      </div>

      {!mostrarResultados && (
        <section className="secao">
          <h2>Experimente</h2>
          <div className="rolagem-h" style={{ flexWrap: 'wrap' }}>
            {SUGESTOES.map((s) => (
              <button key={s} className="filtro" onClick={() => setTexto(s)}>
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {mostrarResultados && (
        <section className="secao" aria-live="polite">
          <p className="apoio">
            {resultados.length === 0
              ? 'Nada encontrado nos encartes válidos hoje.'
              : `${resultados.length} produto${resultados.length > 1 ? 's' : ''}${resultados.length > LIMITE ? ` (mostrando ${LIMITE})` : ''}`}
          </p>
          {resultados.slice(0, LIMITE).map((p) => (
            <LinhaProduto key={p.id} produto={p} />
          ))}
        </section>
      )}
    </>
  );
}
