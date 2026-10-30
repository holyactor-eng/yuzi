import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genererLecon, typesPour } from '../exercices.js';

const MOTS = {
  salam: { id: 'salam', parle: 'سلام', ecrit: 'سلام', emoji: '👋', proches: ['merci', 'bale', 'na'] },
  merci: { id: 'merci', parle: 'مرسی', ecrit: 'مرسی', emoji: '🙏', proches: ['salam', 'bale', 'na'] },
  bale: { id: 'bale', parle: 'آره', ecrit: 'بله', emoji: '👍', proches: ['na', 'salam', 'merci'] },
  na: { id: 'na', parle: 'نه', ecrit: 'نه', emoji: '👎', proches: ['bale', 'salam', 'merci'] },
  sobh: { id: 'sobh', parle: 'صبح بخیر', ecrit: 'صبح بخیر', emoji: '🌅', proches: ['salam', 'merci', 'na'] },
};
const ITEMS = ['salam', 'merci', 'bale', 'na', 'sobh'];
// Hasard déterministe pour les tests.
const graine = (s = 1) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

test('types : les petits n\'ont jamais d\'écrit', () => {
  assert.deepEqual(typesPour('petit'), ['ecoute', 'dis', 'paires']);
  assert.ok(typesPour('moyen').includes('lis'));
  assert.ok(typesPour('grand').includes('ecris'));
});

for (const profil of ['petit', 'moyen', 'grand']) {
  test(`leçon ${profil} : 8 à 12 exercices, types autorisés, choix valides`, () => {
    const ex = genererLecon(ITEMS, profil, MOTS, { hasard: graine(7) });
    assert.ok(ex.length >= 8 && ex.length <= 12, `longueur ${ex.length}`);
    for (const e of ex) {
      assert.ok(typesPour(profil).includes(e.type), e.type);
      if (e.choix) {
        assert.equal(e.choix.length, 4);
        assert.ok(e.choix.includes(e.mot));
        assert.equal(new Set(e.choix).size, 4);
      }
      if (e.type === 'paires') assert.equal(e.mots.length, 3);
      if (e.type === 'blocs') assert.deepEqual([...e.blocs].sort(), MOTS[e.mot].ecrit.split(' ').sort());
      if (e.type === 'ecris') for (const l of MOTS[e.mot].ecrit) assert.ok(e.lettres.includes(l));
    }
  });
}

test('blocs seulement pour les expressions de plusieurs mots', () => {
  for (let s = 1; s < 20; s++) {
    for (const e of genererLecon(ITEMS, 'grand', MOTS, { hasard: graine(s) })) {
      if (e.type === 'blocs') assert.ok(MOTS[e.mot].ecrit.includes(' '));
    }
  }
});

test('révisions : chaque mot dû apparaît dans la leçon', () => {
  const ex = genererLecon(['salam', 'merci'], 'petit', MOTS, { revisions: ['na'], hasard: graine(3) });
  assert.ok(ex.some((e) => e.mot === 'na' || e.mots?.includes('na')));
});

test('lettres : seulement écouter, paires et dire ; jamais dire une lettre que la reconnaissance ne connaît pas', () => {
  const L = {
    'l-be': { id: 'l-be', parle: 'به', ecrit: 'ب', emoji: 'ب', lettre: true, proches: ['l-pe', 'l-te', 'l-mim'] },
    'l-pe': { id: 'l-pe', parle: 'په', ecrit: 'پ', emoji: 'پ', lettre: true, proches: ['l-be', 'l-te', 'l-mim'] },
    'l-te': { id: 'l-te', parle: 'ته', ecrit: 'ت', emoji: 'ت', lettre: true, proches: ['l-be', 'l-pe', 'l-mim'] },
    'l-mim': { id: 'l-mim', parle: 'میم', ecrit: 'م', emoji: 'م', lettre: true, dire: false, proches: ['l-be', 'l-pe', 'l-te'] },
  };
  for (let s = 1; s < 30; s++) {
    for (const e of genererLecon(Object.keys(L), 'grand', L, { hasard: graine(s) })) {
      assert.ok(['ecoute', 'paires', 'dis'].includes(e.type), e.type);
      assert.ok(!(e.type === 'dis' && e.mot === 'l-mim'));
    }
  }
});
