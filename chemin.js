// Suivre le doigt le long d'un trait de lettre, dans le sens des flèches.

// Un trait : ses points [x, y], la longueur parcourue jusqu'à chacun, et le plus grand écart entre deux points.
export function mesurer(pts) {
  const long = [0];
  for (let j = 1; j < pts.length; j++) long.push(long[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
  return { pts, long, total: long.at(-1), maille: Math.max(...long.slice(1).map((a, j) => a - long[j])) };
}

// Où en est le doigt sur le trait. etat = { avance, pos } : avance = le plus loin atteint, pos = où est le doigt
// maintenant (en longueur le long du trait). T = tolérance, environ la largeur du trait.
// On ne cherche le doigt que près de l'avancée (3 T derrière, T devant) : un trait court ne se finit pas d'un coup
// en posant le doigt à son bout. Parmi les passages proches du doigt, on prend le plus proche du doigt et de pos
// (le plus avancé à égalité) : les traits qui repassent sur eux-mêmes (le haut de ح, les dents de س) restent
// suivis sans saut.
// pas = chemin fait par le doigt depuis le point d'avant : on n'avance jamais plus vite que lui, sinon arriver par
// l'autre bout ferait sauter l'avancée de T en T.
// verdict : 'ok', 'recul' (le doigt est revenu en arrière de plus de T/2), 'hors' (pas sur le trait près de l'avancée).
export function suivre(trait, { avance, pos = avance }, [x, y], T, pas = Infinity) {
  let bon = -1, ecart = Infinity, proche = false;
  for (let j = 0; j < trait.pts.length; j++) {
    const a = trait.long[j];
    if (a < avance - 3 * T || a > avance + T || a > pos + 2 * pas + trait.maille) continue;
    const d = Math.hypot(trait.pts[j][0] - x, trait.pts[j][1] - y);
    if (d > T) continue;
    proche = true;
    // Assez près pour rester sur le trait, mais pas pour avancer : sinon pos grimperait de proche en proche
    // vers un doigt arrivé par l'autre bout d'un trait court (la barre de گ).
    if (d > T / 2) continue;
    const e = d + Math.abs(a - pos) / 2;
    if (e < ecart || (e === ecart && a > trait.long[bon])) { ecart = e; bon = j; }
  }
  if (bon < 0) return { avance, pos, verdict: proche ? 'ok' : 'hors' };
  const a = trait.long[bon];
  if (a < avance - T / 2) return { avance, pos: a, verdict: 'recul' };
  return { avance: Math.max(avance, a), pos: a, verdict: 'ok' };
}

// Point du trait à l'avancée donnée (pour poser le repère « reprends ici »).
export function pointA(trait, avance) {
  const j = trait.long.findIndex((a) => a >= avance);
  return trait.pts[j < 0 ? trait.pts.length - 1 : j];
}
