import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apresLecon, serieActuelle, xpDuJour, objectifAtteint, coeursDuJour, perdreCoeur, COEURS_MAX, OBJECTIF_XP } from '../progres.js';

test('série : +1 le lendemain, inchangée le même jour, repart à 1 après un trou', () => {
  let e = apresLecon(undefined, { jour: '2026-10-28', xp: 10 });
  assert.equal(e.serie, 1);
  e = apresLecon(e, { jour: '2026-10-28', xp: 10 });
  assert.equal(e.serie, 1);
  e = apresLecon(e, { jour: '2026-10-29', xp: 10 });
  assert.equal(e.serie, 2);
  e = apresLecon(e, { jour: '2026-10-31', xp: 10 });
  assert.equal(e.serie, 1);
});

test('série affichée : tombe à 0 si un jour est sauté', () => {
  const e = apresLecon(undefined, { jour: '2026-10-28', xp: 10 });
  assert.equal(serieActuelle(e, '2026-10-29'), 1);
  assert.equal(serieActuelle(e, '2026-10-30'), 0);
  assert.equal(serieActuelle(undefined, '2026-10-30'), 0);
});

test('XP : total et par jour, objectif quotidien', () => {
  let e = apresLecon(undefined, { jour: '2026-10-30', xp: 10 });
  e = apresLecon(e, { jour: '2026-10-30', xp: 15 });
  assert.equal(e.xp, 25);
  assert.equal(xpDuJour(e, '2026-10-30'), 25);
  assert.equal(xpDuJour(e, '2026-10-31'), 0);
  assert.equal(objectifAtteint(e, '2026-10-30'), 25 >= OBJECTIF_XP);
});

test('cœurs : pleins chaque nouveau jour, jamais sous zéro', () => {
  assert.equal(coeursDuJour(undefined, '2026-10-30'), COEURS_MAX);
  let c = perdreCoeur(undefined, '2026-10-30');
  assert.deepEqual(c, { n: COEURS_MAX - 1, jour: '2026-10-30' });
  assert.equal(coeursDuJour(c, '2026-10-30'), COEURS_MAX - 1);
  assert.equal(coeursDuJour(c, '2026-10-31'), COEURS_MAX);
  for (let i = 0; i < 10; i++) c = perdreCoeur(c, '2026-10-30');
  assert.equal(c.n, 0);
});
