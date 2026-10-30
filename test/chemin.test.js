import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mesurer, suivre } from '../chemin.js';

// Un trait droit de gauche à droite, un point tous les 10, tolérance 15. Le doigt glisse de 5 en 5.
const T = 15;
const droit = mesurer(Array.from({ length: 21 }, (_, j) => [j * 10, 0]));
const de = (a, b) => Array.from({ length: Math.abs(b - a) / 5 + 1 }, (_, j) => a + Math.sign(b - a) * j * 5);
const parcourir = (trait, xs) => xs.reduce((r, x, j) => (r.verdict === 'recul' ? r : suivre(trait, r, [x, 2], T, j ? Math.abs(x - xs[j - 1]) : 0)), { avance: 0, verdict: 'ok' });

test('dans le sens des flèches, le doigt avance jusqu\'au bout', () => {
  const r = parcourir(droit, de(0, 200));
  assert.equal(r.verdict, 'ok');
  assert.equal(r.avance, 200);
});

test('revenir en arrière est refusé', () => {
  assert.equal(parcourir(droit, [...de(0, 80), ...de(75, 0)]).verdict, 'recul');
});

test('poser le doigt à l\'autre bout n\'avance pas', () => {
  const r = suivre(droit, { avance: 0 }, [200, 0], T);
  assert.equal(r.verdict, 'hors');
  assert.equal(r.avance, 0);
});

test('un trait court parcouru à rebours est refusé', () => {
  // Trait d'à peine 3 tolérances, comme ا ou د.
  const court = mesurer([[0, 0], [10, 0], [20, 0], [30, 0], [40, 0], [50, 0]]);
  assert.equal(parcourir(court, de(50, 0)).verdict, 'recul');
});

test('un trait qui repasse sur lui-même (aller-retour) se suit sans fausse alerte', () => {
  const aller = Array.from({ length: 11 }, (_, j) => [j * 10, 0]);
  const ar = mesurer([...aller, ...aller.slice(0, -1).reverse()]);
  const r = parcourir(ar, [...de(0, 100), ...de(95, 0)]);
  assert.equal(r.verdict, 'ok');
  assert.equal(r.avance, ar.total);
});

test('un trait à peine plus long que deux tolérances, à rebours, n\'avance pas', () => {
  // La barre de گ : 420 de long pour une tolérance de 250.
  const barre = mesurer(Array.from({ length: 15 }, (_, j) => [j * 30, 0]));
  const xs = de(420, 0);
  const r = xs.reduce((r, x, j) => suivre(barre, r, [x, 2], 250, j ? 5 : 0), { avance: 0 });
  assert.ok(r.avance < 125, `avance ${r.avance}`);
});

test('arriver par l\'autre bout ne fait pas sauter l\'avancée', () => {
  const r = parcourir(droit, de(200, 0));
  assert.ok(r.avance < T, `avance ${r.avance}`);
});
