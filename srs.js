// Révision espacée façon Leitner : 5 boîtes. Une carte = { boite, du } (du = jour 'AAAA-MM-JJ' où la revoir).

// Intervalle en jours avant de revoir une carte, selon sa boîte (1 à 5).
export const INTERVALLES = [0, 1, 3, 7, 14];

const deux = (n) => String(n).padStart(2, '0');
export const jourLocal = (d = new Date()) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
export function ajouterJours(jour, n) {
  const [a, m, j] = jour.split('-').map(Number);
  return jourLocal(new Date(a, m - 1, j + n));
}

// Juste : boîte suivante (plafond 5). Faux : boîte 1, à revoir aujourd'hui.
export function apresReponse(carte, juste, jour) {
  const boite = juste ? Math.min((carte?.boite ?? 1) + 1, 5) : 1;
  return { boite, du: ajouterJours(jour, INTERVALLES[boite - 1]) };
}

// Ids des cartes à revoir ce jour, les plus en retard d'abord.
export const dus = (cartes, jour) =>
  Object.entries(cartes).filter(([, c]) => c.du <= jour).sort(([, a], [, b]) => a.du.localeCompare(b.du)).map(([id]) => id);
