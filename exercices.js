// Fabrique les exercices d'une leçon selon le profil de l'enfant. Fonctions pures : le hasard est injectable.

const TYPES = {
  petit: ['ecoute', 'dis', 'paires'],
  moyen: ['ecoute', 'dis', 'paires', 'lis', 'blocs'],
  grand: ['ecoute', 'dis', 'paires', 'lis', 'blocs', 'ecris'],
};
export const typesPour = (profil) => TYPES[profil];

// Lettres ajoutées aux tuiles de l'exercice « écris » pour qu'il ne suffise pas de tout toucher.
const LETTRES_LEURRES = [...'ابپتسجچخدرزشفکگلمنوهی'];

// Un type ne convient pas à tous les mots : les blocs veulent plusieurs mots, l'écriture un mot court.
// Une lettre s'entend et se dit (si la reconnaissance connaît son nom) ; la lire ou l'écrire seule serait de la copie.
const convient = (type, mot) =>
  mot.lettre ? type === 'ecoute' || type === 'paires' || (type === 'dis' && mot.dire !== false)
  : type === 'blocs' ? mot.ecrit.includes(' ') : type === 'ecris' ? !/[\s‌]/.test(mot.ecrit) && mot.ecrit.length <= 6 : true;

function melanger(liste, hasard) {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

// Le mot et n - 1 autres : ses proches d'abord, puis n'importe quel mot connu.
function voisins(id, mots, n, hasard) {
  const autres = [...(mots[id].proches ?? []).filter((x) => mots[x]), ...melanger(Object.keys(mots), hasard)];
  return [id, ...new Set(autres.filter((x) => x !== id))].slice(0, n);
}

function exercice(type, id, mots, hasard) {
  const mot = mots[id];
  switch (type) {
    case 'ecoute':
    case 'lis':
      return { type, mot: id, choix: melanger(voisins(id, mots, 4, hasard), hasard) };
    case 'dis':
      return { type, mot: id };
    case 'paires':
      return { type, mot: id, mots: melanger(voisins(id, mots, 3, hasard), hasard) };
    case 'blocs':
      return { type, mot: id, blocs: melanger(mot.ecrit.split(' '), hasard) };
    case 'ecris': {
      const leurres = melanger(LETTRES_LEURRES.filter((l) => !mot.ecrit.includes(l)), hasard).slice(0, 3);
      return { type, mot: id, lettres: melanger([...mot.ecrit, ...leurres], hasard) };
    }
  }
}

// Deux exercices de types différents par mot (révisions comprises), complété jusqu'à 8, coupé à 12.
export function genererLecon(items, profil, mots, { revisions = [], hasard = Math.random } = {}) {
  const ids = [...new Set([...items, ...revisions])];
  const pour = (id) => melanger(TYPES[profil].filter((t) => convient(t, mots[id])), hasard);
  const ex = ids.flatMap((id) => pour(id).slice(0, 2).map((t) => exercice(t, id, mots, hasard)));
  while (ex.length < 8) {
    const id = ids[Math.floor(hasard() * ids.length)];
    ex.push(exercice(pour(id)[0], id, mots, hasard));
  }
  // Mélange, mais chaque mot garde au moins un exercice avant la coupe.
  const premiers = new Map();
  for (const e of melanger(ex, hasard)) if (!premiers.has(e.mot)) premiers.set(e.mot, e);
  const reste = ex.filter((e) => ![...premiers.values()].includes(e));
  return melanger([...premiers.values(), ...melanger(reste, hasard).slice(0, Math.max(12 - premiers.size, 0))], hasard);
}
