import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliser, decider, grammaire } from '../parole.js';

test('normaliser : lettres arabes, voyelles brèves, demi-espace et espaces', () => {
  assert.equal(normaliser('كتاب'), 'کتاب');
  assert.equal(normaliser('علي'), 'علی');
  assert.equal(normaliser('سَلام'), 'سلام');
  assert.equal(normaliser(' مامان‌بزرگ '), 'مامان بزرگ');
  assert.equal(normaliser('صبح   بخیر'), 'صبح بخیر');
  assert.equal(normaliser('خوبی؟'), 'خوبی');
});

test('decider : accepte le mot attendu, refuse un autre mot ou rien', () => {
  assert.equal(decider('سلام', 'سلام'), true);
  assert.equal(decider('مامان بزرگ', 'مامان‌بزرگ'), true);
  assert.equal(decider('بابا', 'مامان'), false);
  assert.equal(decider('', 'مامان'), false);
  assert.equal(decider('[unk]', 'مامان'), false);
});

test('grammaire : mot attendu d\'abord, tous les autres mots en leurres, puis [unk]', () => {
  const mots = { b: { parle: 'بابا' }, a: { parle: 'مامان' }, c: { parle: 'مامان‌بزرگ' } };
  assert.deepEqual(grammaire('a', mots), ['مامان', 'بابا', 'مامان بزرگ', '[unk]']);
});

test('grammaire : les mots et les noms de lettres ne se servent pas de leurres', () => {
  const mots = { gav: { parle: 'گاو' }, sag: { parle: 'سگ' }, gaf: { parle: 'گاف', lettre: true }, kaf: { parle: 'کاف', lettre: true } };
  assert.deepEqual(grammaire('gav', mots), ['گاو', 'سگ', '[unk]']);
  assert.deepEqual(grammaire('gaf', mots), ['گاف', 'کاف', '[unk]']);
});
