import { useApp, type Aba } from './contexto';
import { Icone } from './Icone';
import { Buscar } from './telas/Buscar';
import { Encartes } from './telas/Encartes';
import { Inicio } from './telas/Inicio';
import { Lista } from './telas/Lista';
import { Perfil } from './telas/Perfil';
import { Produto } from './telas/Produto';

const ABAS: { id: Aba; rotulo: string; icone: string }[] = [
  { id: 'inicio', rotulo: 'Início', icone: 'inicio' },
  { id: 'buscar', rotulo: 'Buscar', icone: 'buscar' },
  { id: 'lista', rotulo: 'Lista', icone: 'lista' },
  { id: 'encartes', rotulo: 'Encartes', icone: 'encartes' },
  { id: 'perfil', rotulo: 'Perfil', icone: 'perfil' },
];

export function App() {
  const { aba, irPara, produtoAberto, lista, aviso } = useApp();

  return (
    <div className="app">
      <main className="conteudo">
        {produtoAberto ? (
          <Produto key={produtoAberto} id={produtoAberto} />
        ) : aba === 'inicio' ? (
          <Inicio />
        ) : aba === 'buscar' ? (
          <Buscar />
        ) : aba === 'lista' ? (
          <Lista />
        ) : aba === 'encartes' ? (
          <Encartes />
        ) : (
          <Perfil />
        )}
      </main>

      <nav className="navegacao" aria-label="Navegação principal">
        <div>
          {ABAS.map((a) => (
            <button
              key={a.id}
              aria-current={aba === a.id && !produtoAberto ? 'page' : undefined}
              onClick={() => irPara(a.id, a.id === 'buscar' ? { focarBusca: false } : undefined)}
            >
              <Icone nome={a.icone} />
              {a.rotulo}
              {a.id === 'lista' && lista.length > 0 && <span className="contador">{lista.length}</span>}
            </button>
          ))}
        </div>
      </nav>

      {aviso && (
        <div className="toast" role="status">
          {aviso}
        </div>
      )}
    </div>
  );
}
