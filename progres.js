// XP, série de jours, objectif quotidien et cœurs. État = { xp, parJour: { jour: xp }, serie, dernierJour }.
import { ajouterJours } from './srs.js';

export const OBJECTIF_XP = 20;
export const COEURS_MAX = 5;

export function apresLecon(etat = { xp: 0, parJour: {}, serie: 0, dernierJour: null }, { jour, xp }) {
  const serie = etat.dernierJour === jour ? etat.serie : etat.dernierJour === ajouterJours(jour, -1) ? etat.serie + 1 : 1;
  return { xp: etat.xp + xp, parJour: { ...etat.parJour, [jour]: (etat.parJour[jour] ?? 0) + xp }, serie, dernierJour: jour };
}

// La série tient tant que la dernière leçon date d'aujourd'hui ou d'hier.
export const serieActuelle = (etat, jour) =>
  etat && (etat.dernierJour === jour || etat.dernierJour === ajouterJours(jour, -1)) ? etat.serie : 0;
export const xpDuJour = (etat, jour) => etat?.parJour[jour] ?? 0;
export const objectifAtteint = (etat, jour) => xpDuJour(etat, jour) >= OBJECTIF_XP;

// Cœurs (grands, en option) : { n, jour }. Remis à plein chaque nouveau jour.
export const coeursDuJour = (c, jour) => (c?.jour === jour ? c.n : COEURS_MAX);
export const perdreCoeur = (c, jour) => ({ n: Math.max(coeursDuJour(c, jour) - 1, 0), jour });
