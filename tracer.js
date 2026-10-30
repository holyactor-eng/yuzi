// Tracer les lettres au doigt (dès 4 ans) : la lettre en filigrane, le doigt la remplit d'une couleur lumineuse
// qui ondule comme un liquide, des étincelles suivent le doigt. Lettre recouverte aux 4/5 : bravo, son nom, lettre suivante.
// Des flèches numérotées montrent le sens et l'ordre des traits, puis les points.
// ponytail: on mesure la surface recouverte, pas le sens réel du doigt ; les flèches guident sans juger.
import { MOTS } from './content.js';
import { jouer, bip } from './audio.js';

const LETTRES = Object.values(MOTS).filter((m) => m.lettre);
const SEUIL = 0.8;
const BASSE = 160; // résolution de la grille de mesure

// Couleurs du drapeau iranien : la lettre peinte devient le drapeau (vert en haut, blanc, rouge en bas).
const VERT = '#239f40', BLANC = '#ffffff', ROUGE = '#da0000';
// Emblème officiel du drapeau (Wikimedia Commons, domaine public), cadre -1..1 ; la moitié gauche est le miroir.
// Chaque morceau commence par M absolu : collés bout à bout, des m relatifs se décaleraient.
const EMBLEME = ['M 1,6.5298e-4 c 0,0.2832 -0.1568,0.5432 -0.4072,0.6756 0.3408,-0.4264 0.2712,-1.0484 -0.1552,-1.3896 v 0 c -0.0144,-0.0116 -0.0292,-0.0228 -0.0444,-0.0336 0.3536,0.074 0.6068,0.386 0.6068,0.7476 z',
  'M 0.6456,-0.03014702 c -4e-4,0.504 -0.4092,0.9124 -0.9132,0.912 -0.0956,0 -0.1904,-0.0152 -0.2812,-0.0444 0.016,8e-4 0.0324,0.0012 0.0484,0.0012 0.5524,0 1,-0.448 1,-1.0004 0,-0.1992 -0.0596,-0.394 -0.1712,-0.5592 0.202,0.1728 0.3176,0.4252 0.3172,0.6908 z',
  'M 0.2576,-0.91334702 c 0,0.0768 -0.0624,0.1392 -0.1392,0.1392 -0.048,0 -0.0928,-0.0248 -0.118,-0.0656 l -0.0168,-0.0168 0.0164,-0.082 c 0.03,0.0652 0.1076,0.0936 0.1728,0.0636 0.038,-0.0176 0.0656,-0.0528 0.0732,-0.094 0.0076,0.0176 0.0116,0.0364 0.0116,0.0556 z',
  'M 0.118,-0.68774702 c -0.0464,-0.0212 -0.0872,-0.0536 -0.118,-0.094 l -0.05,0.7816 L 0,1.000653 0.0776,0.89385298 l 0.0104,-0.2464 0.0108,-0.2564 0.0012,-0.0328 4e-4,-0.0124 0.0024,-0.0532 0.0068,-0.1616 0.0056,-0.1304 0.0016,-0.0376 0.002,-0.048 z'].join(' ');

// Sens d'écriture : traits dessinés à la main sur Vazirmatn, dans la boîte du corps de la lettre (0..1, y vers le bas).
// Les points (nuqte) sont trouvés tout seuls : ce sont les morceaux de la lettre qu'aucun trait ne traverse.
const TRAITS = {
  'ا': [[[.5, .03], [.5, .97]]],
  'ب': [[[.92, .06], [.92, .55], [.8, .8], [.5, .82], [.2, .8], [.1, .55], [.1, .08]]],
  'ح': [[[.06, .2], [.35, .08], [.65, .12], [.95, .18], [.6, .2], [.3, .35], [.15, .6], [.25, .88], [.55, .95], [.95, .88]]],
  'د': [[[.32, .08], [.7, .3], [.88, .55], [.75, .82], [.05, .85]]],
  'ر': [[[.75, .06], [.72, .45], [.55, .75], [.08, .9]]],
  'س': [[[.96, .06], [.93, .6], [.72, .6], [.68, .12], [.64, .6], [.5, .55], [.47, .12], [.45, .7], [.3, .92], [.12, .85], [.05, .25]]],
  'ص': [[[.5, .5], [.65, .15], [.85, .05], [.98, .35], [.85, .62], [.55, .65], [.45, .75], [.3, .95], [.12, .9], [.05, .25]]],
  'ط': [[[.35, .6], [.6, .4], [.85, .45], [.95, .65], [.8, .88], [.05, .9]], [[.3, .05], [.3, .75]]],
  'ع': [[[.85, .12], [.55, .04], [.33, .15], [.4, .33], [.7, .38], [.35, .45], [.15, .65], [.25, .92], [.55, .97], [.95, .85]]],
  'ف': [[[.68, .65], [.7, .2], [.82, .05], [.95, .25], [.95, .65], [.75, .92], [.35, .92], [.1, .75], [.05, .32]]],
  'ق': [[[.55, .6], [.58, .2], [.72, .05], [.92, .15], [.95, .55], [.75, .92], [.35, .95], [.1, .75], [.08, .15]]],
  'ک': [[[.97, .07], [.55, .38], [.6, .5], [.9, .7], [.8, .92], [.3, .92], [.07, .8], [.05, .45]]],
  'گ': [[[.93, .13], [.55, .42], [.6, .52], [.92, .72], [.8, .93], [.3, .93], [.05, .8], [.05, .42]], [[1.02, -.15], [.55, .05]]],
  'ل': [[[.86, .03], [.86, .72], [.7, .95], [.35, .95], [.12, .8], [.1, .45]]],
  'م': [[[.45, .45], [.55, .15], [.8, .03], [.97, .25], [.85, .52], [.5, .55], [.25, .45], [.15, .6], [.15, .97]]],
  'ن': [[[.92, .06], [.92, .55], [.7, .92], [.3, .92], [.08, .55], [.08, .1]]],
  'و': [[[.5, .5], [.15, .35], [.3, .05], [.7, .05], [.9, .35], [.85, .7], [.5, .85], [.05, .92]]],
  'ھ': [[[.48, .05], [.25, .35], [.2, .65], [.35, .8], [.55, .65], [.6, .35], [.8, .3], [.95, .5], [.9, .8], [.6, .92], [.3, .88], [.02, .85]]],
  'ی': [[[.95, .1], [.65, .15], [.6, .4], [.9, .6], [.75, .9], [.4, .95], [.12, .75], [.1, .2]]],
};
const FAMILLE = { 'پ': 'ب', 'ت': 'ب', 'ث': 'ب', 'ج': 'ح', 'چ': 'ح', 'خ': 'ح', 'ذ': 'د', 'ز': 'ر', 'ژ': 'ر', 'ش': 'س', 'ض': 'ص', 'ظ': 'ط', 'غ': 'ع' };
export const traitsDe = (lettre) => TRAITS[FAMILLE[lettre] ?? lettre];

// Morceaux d'un dessin (composantes connexes des pixels opaques) : taille, boîte, centre.
function morceaux(rgba, n) {
  const lab = new Int32Array(n * n).fill(-1), out = [];
  for (let i = 0; i < n * n; i++) {
    if (rgba[i * 4 + 3] <= 128 || lab[i] >= 0) continue;
    const m = { n: 0, x0: n, y0: n, x1: 0, y1: 0, cx: 0, cy: 0 }, pile = [i];
    lab[i] = out.length;
    while (pile.length) {
      const j = pile.pop(), x = j % n, y = (j / n) | 0;
      m.n++; m.cx += x; m.cy += y;
      m.x0 = Math.min(m.x0, x); m.x1 = Math.max(m.x1, x); m.y0 = Math.min(m.y0, y); m.y1 = Math.max(m.y1, y);
      for (const [v, ok] of [[j - 1, x > 0], [j + 1, x < n - 1], [j - n, y > 0], [j + n, y < n - 1]]) {
        if (ok && lab[v] < 0 && rgba[v * 4 + 3] > 128) { lab[v] = out.length; pile.push(v); }
      }
    }
    m.cx /= m.n; m.cy /= m.n;
    out.push(m);
  }
  return out;
}

// Adoucit une ligne brisée (Chaikin) en gardant ses deux bouts.
function lisser(pts) {
  for (let k = 0; k < 3; k++) {
    pts = [pts[0], ...pts.slice(0, -1).flatMap(([ax, ay], j) => {
      const [bx, by] = pts[j + 1];
      return [[ax * .75 + bx * .25, ay * .75 + by * .25], [ax * .25 + bx * .75, ay * .25 + by * .75]];
    }), pts.at(-1)];
  }
  return pts;
}

export const nbLettres = LETTRES.length;

// Lettre finie, elle prend vie : elle devient un mot qui commence par elle.
const IMAGE = { 'ا': 'asb', 'ب': 'bastani', 'پ': 'parande', 'ت': 'tokhmemorgh', 'ث': 'sanie', 'ج': 'jujeh', 'چ': 'cheragh', 'ح': 'halazun',
  'خ': 'khargush', 'د': 'dandun', 'ذ': 'zorrat', 'ر': 'rubah', 'ز': 'zanbur', 'ژ': 'zhele', 'س': 'sib', 'ش': 'shir', 'ص': 'sandali',
  'ض': 'zabt', 'ط': 'tavus', 'ظ': 'zarf', 'ع': 'eynak', 'غ': 'ghaza', 'ف': 'fil', 'ق': 'ghurbaghe', 'ک': 'kelid', 'گ': 'gorbe',
  'ل': 'lakposht', 'م': 'mahi', 'ن': 'nun', 'و': 'val', 'ھ': 'hendune', 'ی': 'yuz' };
export const imageDe = (lettre) => MOTS[IMAGE[lettre]];

// gagner(emoji) : l'image du mot rejoint l'album de l'enfant.
export async function ecranTracer(app, i, gagner = () => {}) {
  const m = LETTRES[(i + LETTRES.length) % LETTRES.length];
  i = LETTRES.indexOf(m);
  app.innerHTML = `<header class="barre-lecon">
      <a href="#/" class="fermer" aria-label="برگشت">✕</a>
      <button class="haut-parleur" aria-label="🔊">🔊</button>
      <span class="mascotte">🐆</span>
    </header>
    <section class="tracer">
      <div class="toile"><canvas class="fond"></canvas><canvas class="peinture"></canvas><canvas class="liquide"></canvas><canvas class="etincelles"></canvas></div>
      <nav class="fleches">
        <a class="rond" href="#/tracer/${i + 1}" aria-label="بعدی">←</a>
        <button class="rond effacer" aria-label="پاک کن">🧽</button>
        <a class="rond" href="#/tracer/${i - 1}" aria-label="قبلی">→</a>
      </nav>
    </section>`;
  const dire = () => jouer(m.id, m.parle);
  app.querySelector('.haut-parleur').addEventListener('click', dire);
  dire();

  const toile = app.querySelector('.toile');
  const [fond, peinture, eau, etincelles] = toile.querySelectorAll('canvas');
  const taille = Math.min(innerWidth - 32, innerHeight - 220, 640);
  const dpr = devicePixelRatio || 1;
  const W = Math.round(taille * dpr);
  toile.style.width = toile.style.height = taille + 'px';
  for (const c of [fond, peinture, eau, etincelles]) c.width = c.height = W;

  await document.fonts.load('900 100px Vazirmatn', m.ecrit).catch(() => {});
  if (!toile.isConnected) return;

  // La lettre, centrée sur sa vraie boîte et agrandie à 75 % de la toile.
  const dessinerLettre = (ctx, cote) => {
    ctx.font = '900 100px Vazirmatn, Tahoma, sans-serif';
    ctx.direction = 'ltr';
    const b = ctx.measureText(m.ecrit);
    const l = b.actualBoundingBoxLeft, r = b.actualBoundingBoxRight, a = b.actualBoundingBoxAscent, d = b.actualBoundingBoxDescent;
    const k = Math.min((0.75 * cote) / (l + r), (0.75 * cote) / (a + d));
    ctx.font = `900 ${100 * k}px Vazirmatn, Tahoma, sans-serif`;
    return [cote / 2 - ((r - l) * k) / 2, cote / 2 + ((a - d) * k) / 2, k];
  };

  const f = fond.getContext('2d');
  const [x0, y0, k] = dessinerLettre(f, W);
  const pinceau = 100 * k * 0.16;
  const boite = f.measureText(m.ecrit);
  const haut = y0 - boite.actualBoundingBoxAscent, bas = y0 + boite.actualBoundingBoxDescent;
  const couleur = (y) => { const t = (y - haut) / (bas - haut); return t < 1 / 3 ? VERT : t < 2 / 3 ? BLANC : ROUGE; };
  f.fillStyle = '#efe4d2';
  f.fillText(m.ecrit, x0, y0);
  f.setLineDash([pinceau * 0.15, pinceau * 0.35]);
  f.lineWidth = Math.max(2, W / 300);
  f.strokeStyle = '#c9b89c';
  f.strokeText(m.ecrit, x0, y0);

  // Masque : la couleur ne se voit que dans la lettre (un peu élargie, pour les petits doigts).
  const masque = document.createElement('canvas');
  masque.width = masque.height = W;
  const mq = masque.getContext('2d');
  dessinerLettre(mq, W);
  mq.lineWidth = pinceau * 0.25;
  mq.lineJoin = 'round';
  mq.fillText(m.ecrit, x0, y0);
  mq.strokeText(m.ecrit, x0, y0);
  const url = `url(${masque.toDataURL()})`;
  // La peinture passe par l'eau (WebGL) si la tablette sait faire ; sinon on la montre telle quelle.
  const vague = liquide(eau, peinture);
  for (const c of [peinture, eau]) c.style.maskImage = c.style.webkitMaskImage = url;
  if (vague) peinture.style.opacity = 0;
  else eau.remove();

  // Mesure sur une petite grille : points de la lettre, et ce que le doigt a recouvert.
  const s = BASSE / W;
  const grille = document.createElement('canvas');
  grille.width = grille.height = BASSE;
  const g = grille.getContext('2d', { willReadFrequently: true });
  g.save();
  g.scale(s, s);
  g.font = f.font;
  g.direction = 'ltr';
  g.fillText(m.ecrit, x0, y0);
  g.restore();
  const cibles = [];
  const forme = g.getImageData(0, 0, BASSE, BASSE).data;
  forme.forEach((v, j) => { if (j % 4 === 3 && v > 128) cibles.push(j); });
  g.clearRect(0, 0, BASSE, BASSE);
  guider(f, traitsDe(m.ecrit), morceaux(forme, BASSE), 1 / s, pinceau);
  g.lineCap = g.lineJoin = 'round';
  g.lineWidth = pinceau * s;
  const couverture = () => {
    const d = g.getImageData(0, 0, BASSE, BASSE).data;
    return cibles.filter((j) => d[j] > 0).length / cibles.length;
  };

  const p = peinture.getContext('2d');
  p.lineCap = p.lineJoin = 'round';
  const e = etincelles.getContext('2d');
  const doigts = new Map();
  let particules = [], fini = false, boucle = 0, parcours = 0, embleme = null;
  const drapeau = new Path2D(EMBLEME);

  const point = (ev) => {
    const r = peinture.getBoundingClientRect();
    return [((ev.clientX - r.left) / r.width) * W, ((ev.clientY - r.top) / r.height) * W];
  };
  const trait = ([ax, ay], [bx, by]) => {
    const c = couleur(by);
    p.strokeStyle = c;
    // Le blanc se perd sur la lettre beige : on l'entoure d'une ombre grise douce.
    p.shadowColor = c === BLANC ? 'rgba(120,120,120,.55)' : c;
    p.shadowBlur = pinceau * 0.6;
    p.lineWidth = pinceau;
    p.beginPath(); p.moveTo(ax, ay); p.lineTo(bx, by); p.stroke();
    g.beginPath(); g.moveTo(ax * s, ay * s); g.lineTo(bx * s, by * s); g.stroke();
    for (let n = 0; n < 3; n++) etincelle(bx, by, 1);
    if (vague) {
      vague.sale = true;
      parcours += Math.hypot(bx - ax, by - ay);
      if (parcours > pinceau * 1.5 || ax === bx) { parcours = 0; vague.onde(bx / W, 1 - by / W); }
    }
  };
  const etincelle = (x, y, force) => {
    const a = Math.random() * Math.PI * 2, v = (Math.random() * 4 + 1) * dpr * force;
    particules.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - dpr, vie: 1, c: [VERT, BLANC, ROUGE][(Math.random() * 3) | 0], r: (Math.random() * 3 + 2) * dpr });
  };

  // Étincelles et halo sous le doigt, image par image, tant qu'il y a quelque chose à montrer.
  const animer = () => {
    if (!toile.isConnected) return;
    e.clearRect(0, 0, W, W);
    e.globalCompositeOperation = 'lighter';
    for (const [x, y] of doigts.values()) {
      const halo = e.createRadialGradient(x, y, 0, x, y, pinceau * 1.4);
      halo.addColorStop(0, couleur(y) + 'cc');
      halo.addColorStop(1, couleur(y) + '00');
      e.fillStyle = halo;
      e.beginPath(); e.arc(x, y, pinceau * 1.4, 0, Math.PI * 2); e.fill();
    }
    particules = particules.filter((q) => (q.vie -= 0.025) > 0);
    for (const q of particules) {
      q.x += q.vx; q.y += q.vy; q.vy += 0.08 * dpr;
      e.globalAlpha = q.vie;
      e.fillStyle = q.c;
      e.beginPath(); e.arc(q.x, q.y, q.r * q.vie + dpr, 0, Math.PI * 2); e.fill();
    }
    e.globalAlpha = 1;
    // Lettre finie : l'emblème rouge grandit au centre avec un éclat, puis s'efface.
    if (embleme) {
      const t = (performance.now() - embleme) / 1000;
      if (t > 2.2) embleme = null;
      else {
        const z = W * 0.22 * Math.min(1, t * 3) * (1 + 0.08 * Math.sin(t * 9));
        e.save();
        e.globalCompositeOperation = 'source-over';
        e.globalAlpha = Math.min(1, (2.2 - t) * 2);
        e.translate(W / 2, W / 2);
        e.shadowColor = '#fff'; e.shadowBlur = pinceau;
        e.fillStyle = ROUGE;
        e.scale(z, z); e.fill(drapeau); e.scale(-1, 1); e.fill(drapeau);
        e.restore();
      }
    }
    const eauVive = vague?.dessiner();
    boucle = doigts.size || particules.length || eauVive || embleme ? requestAnimationFrame(animer) : 0;
  };
  const relancer = () => { boucle ||= requestAnimationFrame(animer); };

  const verifier = () => {
    if (fini || couverture() < SEUIL) return;
    fini = true;
    bip(true);
    embleme = performance.now();
    for (let n = 0; n < 120; n++) etincelle(W / 2 + (Math.random() - 0.5) * W * 0.5, W / 2 + (Math.random() - 0.5) * W * 0.5, 2);
    for (let n = 0; n < 5; n++) vague?.onde(0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.6);
    relancer();
    app.querySelector('.mascotte').classList.add('saute');
    const mot = imageDe(m.ecrit);
    gagner(mot.emoji);
    // Le nom de la lettre, puis l'image jaillit de la lettre avec son mot, puis lettre suivante.
    dire()
      .then(() => {
        if (!toile.isConnected) return;
        const v = document.createElement('div');
        v.className = 'vivant';
        v.innerHTML = `<span>${mot.emoji}</span><b><i>${m.ecrit === 'ھ' ? 'ه' : m.ecrit}</i>${mot.ecrit.slice(1)}</b>`;
        toile.append(v);
        return jouer(mot.id, mot.parle);
      })
      .then(() => setTimeout(() => { if (toile.isConnected) location.hash = `#/tracer/${i + 1}`; }, 1400));
  };

  peinture.addEventListener('pointerdown', (ev) => {
    peinture.setPointerCapture(ev.pointerId);
    const a = point(ev);
    doigts.set(ev.pointerId, a);
    trait(a, a);
    relancer();
  });
  peinture.addEventListener('pointermove', (ev) => {
    if (!doigts.has(ev.pointerId)) return;
    const lot = ev.getCoalescedEvents?.();
    for (const c of lot?.length ? lot : [ev]) {
      const b = point(c);
      trait(doigts.get(ev.pointerId), b);
      doigts.set(ev.pointerId, b);
    }
  });
  const lever = (ev) => { doigts.delete(ev.pointerId); verifier(); };
  peinture.addEventListener('pointerup', lever);
  peinture.addEventListener('pointercancel', lever);

  app.querySelector('.effacer').addEventListener('click', () => {
    p.clearRect(0, 0, W, W);
    g.clearRect(0, 0, BASSE, BASSE);
    fini = false;
    if (vague) { vague.sale = true; relancer(); }
  });
}

// Le chemin à suivre, sous la peinture, fin et pâle pour que la lettre reste lisible : pastille verte numérotée
// au départ, pointillés et petites flèches orange,
// puis une pastille par point à poser. Les morceaux sont en coordonnées de la grille, `e` les ramène à la toile.
function guider(ctx, traits = [], parts, e, pinceau) {
  if (!parts.length) return;
  const corps = parts.reduce((a, b) => (b.n > a.n ? b : a));
  const bx = corps.x0 * e, by = corps.y0 * e, bw = (corps.x1 - corps.x0 + 1) * e, bh = (corps.y1 - corps.y0 + 1) * e;
  const chemins = traits.map((t) => lisser(t.map(([u, v]) => [bx + u * bw, by + v * bh])));
  const touche = (q) => chemins.some((c) => c.some(([x, y]) => x >= q.x0 * e && x <= (q.x1 + 1) * e && y >= q.y0 * e && y <= (q.y1 + 1) * e));
  const points = parts.filter((q) => q !== corps && !touche(q)).sort((a, b) => b.cx - a.cx);
  const r = pinceau * 0.22;
  const pastille = (x, y, n) => {
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#2bb673';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${r * 1.3}px Vazirmatn, Tahoma, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n.toLocaleString('fa'), x, y + r * 0.08);
  };
  const fleche = (x, y, a, t) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(t, 0); ctx.lineTo(-t * 0.7, t * 0.8); ctx.lineTo(-t * 0.7, -t * 0.8); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  chemins.forEach((c) => {
    ctx.strokeStyle = ctx.fillStyle = '#ff8a1f';
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = pinceau * 0.05;
    ctx.setLineDash([pinceau * 0.12, pinceau * 0.2]);
    ctx.beginPath(); c.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    // Une flèche tous les ~3 pinceaux, et une au bout.
    let reste = pinceau * 2;
    for (let j = 1; j < c.length; j++) {
      const [ax, ay] = c[j - 1], [cx, cy] = c[j], l = Math.hypot(cx - ax, cy - ay);
      if ((reste -= l) > 0 && j < c.length - 1) continue;
      reste = pinceau * 3;
      fleche(cx, cy, Math.atan2(cy - ay, cx - ax), pinceau * 0.17);
    }
  });
  chemins.forEach((c, j) => pastille(...c[0], j + 1));
  points.forEach((q) => pastille(q.cx * e, q.cy * e, chemins.length + 1));
  ctx.restore();
}

// Eau : la peinture vue à travers un liquide. Chaque contact lance une onde circulaire, et tout ondoie doucement
// tant qu'une onde vit. null si WebGL manque. ponytail: 8 ondes à la fois, les plus anciennes sont remplacées.
function liquide(toile, source) {
  const gl = toile.getContext('webgl', { premultipliedAlpha: true });
  if (!gl) return null;
  const shader = (type, code) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, code);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, `attribute vec2 a; varying vec2 uv;
    void main() { uv = a * .5 + .5; gl_Position = vec4(a, 0., 1.); }`));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, `precision mediump float;
    uniform sampler2D img; uniform float t; uniform vec3 ondes[8]; varying vec2 uv;
    void main() {
      vec2 o = .004 * vec2(sin(uv.y * 14. + t * 2.), cos(uv.x * 14. + t * 1.6));
      for (int i = 0; i < 8; i++) {
        float age = t - ondes[i].z;
        if (age < 0. || age > 2.5) continue;
        vec2 d = uv - ondes[i].xy;
        float r = length(d) + .0001;
        o += d / r * sin(r * 45. - age * 14.) * exp(-r * 6.) * exp(-age * 1.6) * .025;
      }
      vec4 c = texture2D(img, uv + o);
      c.r = texture2D(img, uv + o * 1.5).r;
      c.b = texture2D(img, uv + o * .5).b;
      gl_FragColor = c;
    }`));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const uT = gl.getUniformLocation(prog, 't'), uOndes = gl.getUniformLocation(prog, 'ondes');
  const ondes = new Float32Array(24).fill(-100);
  const t0 = performance.now();
  const maintenant = () => (performance.now() - t0) / 1000;
  let n = 0, derniere = -100;
  return {
    sale: true,
    onde(x, y) {
      derniere = maintenant();
      ondes.set([x, y, derniere], (n++ % 8) * 3);
    },
    // Renvoie vrai tant que l'eau bouge encore.
    dessiner() {
      if (this.sale) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        this.sale = false;
      }
      const t = maintenant();
      gl.uniform1f(uT, t);
      gl.uniform3fv(uOndes, ondes);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return t - derniere < 2.5;
    },
  };
}
