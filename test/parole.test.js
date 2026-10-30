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

test('grammaire : mot attendu, proches, puis [unk]', () => {
  const mots = { a: { parle: 'مامان', proches: ['b', 'c'] }, b: { parle: 'بابا' }, c: { parle: 'مامان‌بزرگ' } };
  assert.deepEqual(grammaire('a', mots), ['مامان', 'بابا', 'مامان بزرگ', '[unk]']);
});
