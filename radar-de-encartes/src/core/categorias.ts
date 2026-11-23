import { normalizar } from './texto';
import type { Categoria } from './tipos';

// Palavras que indicam a categoria. A primeira regra que casar vence, então a ordem importa
// (ex.: "suco de uva" é Bebidas antes de "uva" virar Hortifrúti).
// Cada termo casa com palavras inteiras; termo terminado em "*" casa com o começo da palavra.
const REGRAS: [Categoria, string[]][] = [
  ['Bebidas', ['cerveja', 'refrigerante', 'suco', 'nectar', 'agua mineral', 'agua de coco', 'vinho', 'espumante', 'whisky', 'vodka', 'gin', 'aperitivo', 'cha', 'energetico', 'refresco', 'xarope', 'coquetel', 'sidra', 'isotonico', 'licor', 'cachaca', 'bebida', 'h2oh', 'gatorade', 'powerade']],
  ['Limpeza', ['detergente', 'sabao', 'lava roupa*', 'amaciante', 'desinfetante', 'limpador', 'agua sanitaria', 'alvejante', 'multiuso', 'esponja', 'saponaceo', 'desengordurante', 'inseticida', 'lustra moveis', 'odorizador', 'desodorizador', 'pedra sanitaria', 'saco p lixo', 'saco para lixo', 'pano*', 'limpa*', 'tira manchas', 'lava loucas', 'repelente', 'neutralizador']],
  ['Higiene', ['shampoo', 'condicionador', 'sabonete', 'creme dental', 'escova dental', 'desodorante', 'absorvente', 'papel higienico', 'fralda*', 'antisseptico', 'hidratante', 'protetor solar', 'mascara capilar', 'creme de tratamento', 'oleo de rosa', 'agua micelar', 'coloracao', 'serum', 'kit shampoo', 'body splash']],
  ['Outros', ['pneu', 'mop', 'balde', 'copo descartavel', 'alimento para caes', 'racao', 'assadeira', 'sanduicheira', 'conjunto de potes', 'panela']],
  ['Congelados', ['lasanha', 'hamburguer', 'nuggets', 'empanad*', 'pizza', 'sorvete', 'batata pre frita', 'batata palito', 'pao de queijo', 'hot bowls', 'mac n cheese', 'mini chicken', 'tirinhas', 'steak', 'nhoque', 'meu menu', 'bolinho de bacalhau', 'iscas']],
  ['Açougue', ['carne', 'bovin*', 'frango', 'peito de frango', 'coxa', 'sobrecoxa', 'file de peito', 'filezinho', 'alcatra', 'contra file', 'contrafile', 'picanha', 'costela', 'pernil', 'bisteca', 'suin*', 'linguica', 'peixe', 'tilapia', 'salmao', 'polaca', 'bacalhau', 'paleta', 'tender', 'coxinhas da asa', 'passarinho', 'cupim', 'maminha', 'file de costela']],
  ['Frios e Laticínios', ['queijo', 'presunto', 'mortadela', 'salame', 'salsicha', 'requeijao', 'iogurte', 'manteiga', 'margarina', 'creme de ricota', 'petit suisse', 'danoninho', 'bacon', 'peito de peru', 'mussarela', 'leite fermentado']],
  ['Mercearia', ['salgadinho', 'batata palha', 'chips', 'biscoito', 'macarrao', 'massa', 'espaguete', 'pipoca', 'milho']],
  ['Hortifrúti', ['alho', 'cebola', 'batata', 'tomate', 'banana', 'maca', 'manga', 'abacate', 'laranja', 'limao', 'mamao', 'uva', 'melancia', 'cenoura', 'alface', 'ovo', 'ovos', 'passas', 'nozes', 'amendoas', 'ameixas secas', 'tamaras', 'castanha*', 'morango']],
];

export function categorizar(texto: string): Categoria {
  const t = ` ${normalizar(texto)} `;
  for (const [cat, termos] of REGRAS) {
    for (const termo of termos) {
      const prefixo = termo.endsWith('*');
      const p = prefixo ? termo.slice(0, -1) : termo;
      if (t.includes(prefixo ? ` ${p}` : ` ${p} `)) return cat;
    }
  }
  return 'Mercearia';
}
