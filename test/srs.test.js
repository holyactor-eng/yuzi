import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apresReponse, dus, ajouterJours, jourLocal } from '../srs.js';

test('jours : ajout à travers les mois et format local', () => {
  assert.equal(ajouterJours('2026-10-30', 3), '2026-11-02');
  assert.equal(ajouterJours('2026-03-01', -1), '2026-02-28');
  assert.equal(jourLocal(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

test('bonne réponse : la carte monte d\'une boîte, plafonnée à 5', () => {
  assert.deepEqual(apresReponse(undefined, true, '2026-10-30'), { boite: 2, du: '2026-10-31' });
  assert.deepEqual(apresReponse({ boite: 4, du: 'x' }, true, '2026-10-30'), { boite: 5, du: '2026-11-13' });
  assert.deepEqual(apresReponse({ boite: 5, du: 'x' }, true, '2026-10-30'), { boite: 5, du: '2026-11-13' });
});

test('erreur : retour en boîte 1, due le jour même', () => {
  assert.deepEqual(apresReponse({ boite: 4, du: 'x' }, false, '2026-10-30'), { boite: 1, du: '2026-10-30' });
});

test('dus : seulement les cartes échues, les plus anciennes d\'abord', () => {
  const cartes = { a: { boite: 2, du: '2026-10-29' }, b: { boite: 3, du: '2026-11-02' }, c: { boite: 1, du: '2026-10-25' } };
  assert.deepEqual(dus(cartes, '2026-10-30'), ['c', 'a']);
});
