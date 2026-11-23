import { normalizar } from './texto';

/**
 * Marcas conhecidas (além das que vêm prontas das fontes, como o site do Mundial).
 * Serve para separar "Arroz Camil 5kg" em nome "Arroz" + marca "Camil".
 */
export const MARCAS_CONHECIDAS = [
  'Tio João', 'Camil', 'Ouro Nobre', 'Prato Fino', 'Tio Mingote', 'Blue Ville', 'Namorado', 'Sepé',
  'Kicaldo', 'Patusco', 'Carreteiro', 'Copa', 'Panela de Barro', 'Guarani', 'União', 'Cristal', 'Da Barra',
  'Coamo', 'Soya', 'Liza', 'Andorinha', 'Andorinha Seleção', 'Gallo', 'O-Live', 'Iliada', 'Borges', 'Carbonell',
  'Piracanjuba', 'Italac', 'Elegê', 'Glória', 'Ninho', 'Molico', 'Moça', 'Quatá', 'Itambé', 'Parmalat', 'Betânia',
  'Nestlé', 'Nescau', 'Nescafé', 'Toddy', 'Mucilon', 'Neston', 'Kellogg\'s', 'Quaker', 'Yoki', 'Maizena',
  'Pilão', '3 Corações', 'Melitta', 'Bom Dia', 'Bom Jesus', 'Pimpinela', 'Café do Ponto', 'Santa Clara',
  'Dona Benta', 'Galo', 'Renata', 'Piraquê', 'Adria', 'Barilla', 'Aldente', 'Divella',
  'Trakinas', 'Oreo', 'Bauducco', 'Richester', 'Marilan', 'Mabel', 'Vitarella', 'Panco', 'Triunfo', 'Minueto', 'Club Social',
  'Lacta', 'Garoto', 'Cacau Show', 'Cachet', 'Milka', 'Kit Kat', 'Hershey\'s', 'Ferrero Rocher', 'Lindt',
  'Hellmann\'s', 'Hemmer', 'Heinz', 'Pramesa', 'Predilecta', 'Quero', 'Fugini', 'Elefante', 'Pomarola', 'Tarantella',
  'Maggi', 'Knorr', 'Kitano', 'Sazón', 'Gomes da Costa', '88', 'Coqueiro', 'Bordon',
  'Sadia', 'Perdigão', 'Seara', 'Aurora', 'Friboi', 'Maturatta', 'Swift', 'Rivelli', 'Lar', 'Copacol', 'Canção',
  'LeVida', 'Levida', 'Guibon', 'C.Vale', 'Frimesa', 'Pif Paf', 'Minuano', 'Rezende', 'Bassi', 'Sulita',
  'Claybom', 'Qualy', 'Doriana', 'Becel', 'Danone', 'Danoninho', 'Activia', 'Président', 'Tirolez', 'Polenghi',
  'Vigor', 'Batavo', 'Minas Bom', 'Barão', 'Basel', 'Scala',
  'Coca-Cola', 'Pepsi', 'Guaraná Antarctica', 'Antarctica', 'Fanta', 'Sprite', 'Schweppes', 'Guaraplus', 'Dafruta', 'Del Valle',
  'Brahma', 'Skol', 'Itaipava', 'Heineken', 'Amstel', 'Spaten', 'Original', 'Stella Artois', 'Budweiser', 'Corona',
  'Michelob Ultra', 'Devassa', 'Petra', 'Smirnoff', 'Red Bull', 'Monster', 'Lipton', 'H2OH!', 'Frisco', 'Tang',
  'Omo', 'Surf', 'Ariel', 'Brilhante', 'Tixan Ypê', 'Ypê', 'Odd', 'Downy', 'Comfort', 'Mon Bijou', 'Urca', 'Suprema',
  'Veja', 'Cif', 'Harpic', 'Vanish', 'Pinho Sol', 'Lysoform', 'Vex', 'Qboa', 'Uau', 'Limppano', 'Scotch-Brite', 'Bombril', 'Assolan',
  'Colgate', 'Oral-B', 'Sensodyne', 'Sorriso', 'Close Up', 'Cepacol', 'Listerine', 'Dove', 'Nivea', 'Rexona', 'Monange',
  'Giovanna Baby', 'Protex', 'Palmolive', 'Lux', 'Francis', 'Albany', 'Granado', 'Elseve', 'Pantene', 'Seda', 'OX',
  'Always', 'Intimus', 'Pampers', 'Huggies', 'Turma da Mônica', 'Neve', 'Personal', 'Mili',
  // vistas no site do Guanabara
  'Rei do Sul', 'Pillon', 'Máximo', 'Boa Sorte', 'Macio', 'Sanes', 'Plus Vita', 'Wickbold', 'Crac', 'Passatempo',
  'Anglo', 'McCain', 'Easy Chef', 'EasyChef', 'Mencucini', 'Juliana', 'Monteminas', 'Vitória', 'Mezzani', 'Ingrid',
  'Polenguinho', 'Coronita', 'Stella', 'Fruit Shoot', 'Guaravita', 'Bela Ischia', 'Gatorade', 'Beefeater', 'Gordon\'s',
  'Tanqueray', 'Sukita', 'Absolut', 'Ballantine\'s', 'Chivas Regal', 'Red Label', 'White Horse', 'Johnnie Walker',
  'Arisco', 'Purilev', 'Sabor do Nordeste', 'Vitral', 'Big Soft', 'Brilho Fácil', 'Glade', 'Tixan', 'Casa & Perfume',
  'Neutral', 'Ruth', 'Radium', 'SBP', 'Mimmo', 'Kitchen', 'Soft', 'Dualette', 'Social Clean', 'Yuri', 'Diana',
  'L\'Oréal Paris', 'Neutrox', 'Natutrat', 'Lola', 'Tresemmé', 'Axe', 'Dryon', 'Leite de Rosas', 'Cadiveu', 'Vult',
  'Inoar', 'Skala', 'Siàge', 'Paixão', 'Farnese', 'Garnier', 'Dermacyd', 'Hands & Feet', 'Zarb', 'Oaz', 'Phebo',
  'Above', 'Head & Shoulders', 'Maxton', 'Natucor', 'Cor&Ton', 'Baby Limp', 'Looney Tunes', 'Babysec', 'Hipoglós',
  'Johnson', 'Johnson\'s', 'Topz', 'Tandy', 'Beluga', 'Adria', 'Knorr', 'Chamyto', 'Barla', 'Forno de Minas',
];

/**
 * Separa a marca de um nome do encarte. Escolhe a marca conhecida com mais palavras
 * que aparecem inteiras no texto (ordem não importa: "Seleção Andorinha" = "Andorinha Seleção").
 */
export function separarMarca(texto: string, marcas: readonly string[]): { marca: string; nome: string } {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const normais = palavras.map((p) => normalizar(p));
  let melhor: { marca: string; tokens: string[] } | null = null;
  for (const m of marcas) {
    const tokens = normalizar(m).split(' ').filter(Boolean);
    if (tokens.length === 0) continue;
    if (!tokens.every((t) => normais.includes(t))) continue;
    if (!melhor || tokens.length > melhor.tokens.length || (tokens.length === melhor.tokens.length && m.length > melhor.marca.length)) {
      melhor = { marca: m, tokens };
    }
  }
  if (!melhor) return { marca: '', nome: texto.trim() };
  const restantes = [...melhor.tokens];
  const nome = palavras
    .filter((_, i) => {
      const k = restantes.indexOf(normais[i]);
      if (k >= 0) {
        restantes.splice(k, 1);
        return false;
      }
      return true;
    })
    .join(' ');
  return { marca: melhor.marca, nome: nome.trim() };
}

/** Tira do nome o tamanho e as palavras de embalagem do fim: "Arroz 5kg" → "Arroz". */
export function limparNome(nome: string): string {
  return nome
    .replace(/\(.*?\)/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l|litros?|un|unids?|unidades)\b\.?/gi, ' ')
    .replace(/\b\d+\s*x\s*\d+(?:[.,]\d+)?\s*(?:g|ml)\b/gi, ' ')
    .replace(/\b(kg|tp|litro|cada|pct|pacote|band|bandeja|peça|pç|c\/|com)\b\.?/gi, ' ')
    .replace(/\s*\/\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}
