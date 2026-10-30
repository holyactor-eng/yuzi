import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOTS, UNITES } from '../content.js';

const latin = /[A-Za-z]/;

test('chaque mot est complet, en persan, et ses proches existent', () => {
  for (const [id, mot] of Object.entries(MOTS)) {
    assert.equal(mot.id, id);
    for (const k of ['parle', 'ecrit', 'emoji']) assert.ok(mot[k], `${id}.${k}`);
    assert.ok(!latin.test(mot.parle + mot.ecrit), id);
    assert.equal(mot.proches.length, 3, id);
    for (const p of mot.proches) assert.ok(MOTS[p] && p !== id, `${id} -> ${p}`);
  }
});

test('unités : titres persans, ids de leçon uniques, items existants', () => {
  const ids = UNITES.flatMap((u) => u.lecons.map((l) => l.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const u of UNITES) {
    assert.ok(!latin.test(u.titre), u.id);
    for (const l of u.lecons) for (const i of l.items) assert.ok(MOTS[i], `${l.id} -> ${i}`);
  }
});

test('emoji uniques : une image = un seul mot', () => {
  const e = Object.values(MOTS).map((x) => x.emoji);
  assert.equal(new Set(e).size, e.length);
});
