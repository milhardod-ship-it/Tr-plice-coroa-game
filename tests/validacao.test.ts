import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cobreFormacao, validarDados } from '../src/core/validacao';
import { FORMACOES } from '../src/core/formacoes';
import type { Jogador } from '../src/core/tipos';

const DATA = join(__dirname, '..', 'data');
const ler = (f: string) => JSON.parse(readFileSync(f, 'utf8'));

describe('dados reais', () => {
  it('não têm erros de validação', () => {
    const clubes = readdirSync(join(DATA, 'clubes')).map((f) => ler(join(DATA, 'clubes', f)));
    const r = validarDados(clubes, ler(join(DATA, 'adversarios.json')), ler(join(DATA, 'finalistas-libertadores.json')));
    expect(r.erros).toEqual([]);
  });
});

describe('cobreFormacao', () => {
  const j = (posicao: Jogador['posicao'], alternativas: Jogador['posicao'][] = []): Jogador => ({
    nome: Math.random().toString(36), posicao, alternativas, nota: 70,
  });
  const base = [j('GOL'), j('LD'), j('ZAG'), j('ZAG'), j('LE'), j('VOL'), j('VOL'), j('MEI'), j('MEI'), j('ATA')];

  it('preenche 4-4-2 completo', () => {
    expect(cobreFormacao([...base, j('ATA')], FORMACOES['4-4-2'].vagas)).toBe(true);
  });
  it('usa posição alternativa', () => {
    expect(cobreFormacao([...base, j('PD', ['ATA'])], FORMACOES['4-4-2'].vagas)).toBe(true);
  });
  it('falha sem o segundo atacante', () => {
    expect(cobreFormacao([...base, j('GOL')], FORMACOES['4-4-2'].vagas)).toBe(false);
  });
});
