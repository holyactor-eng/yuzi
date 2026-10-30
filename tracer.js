// Tracer les lettres au doigt (dès 4 ans) : la lettre en filigrane, le doigt la remplit d'une couleur lumineuse,
// des étincelles suivent le doigt. Lettre recouverte aux 4/5 : bravo, son nom, lettre suivante.
// ponytail: on mesure la surface recouverte, pas le sens du tracé ; un ordre des traits demanderait un chemin dessiné par lettre.
import { MOTS } from './content.js';
import { jouer, bip } from './audio.js';

const LETTRES = Object.values(MOTS).filter((m) => m.lettre);
const SEUIL = 0.8;
const BASSE = 160; // résolution de la grille de mesure

export const nbLettres = LETTRES.length;

export async function ecranTracer(app, i) {
  const m = LETTRES[(i + LETTRES.length) % LETTRES.length];
  i = LETTRES.indexOf(m);
  app.innerHTML = `<header class="barre-lecon">
      <a href="#/" class="fermer" aria-label="برگشت">✕</a>
      <button class="haut-parleur" aria-label="🔊">🔊</button>
      <span class="mascotte">🐆</span>
    </header>
    <section class="tracer">
      <div class="toile"><canvas class="fond"></canvas><canvas class="peinture"></canvas><canvas class="etincelles"></canvas></div>
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
  const [fond, peinture, etincelles] = toile.querySelectorAll('canvas');
  const taille = Math.min(innerWidth - 32, innerHeight - 220, 640);
  const dpr = devicePixelRatio || 1;
  const W = Math.round(taille * dpr);
  toile.style.width = toile.style.height = taille + 'px';
  for (const c of [fond, peinture, etincelles]) c.width = c.height = W;

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
  peinture.style.maskImage = peinture.style.webkitMaskImage = url;

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
  g.getImageData(0, 0, BASSE, BASSE).data.forEach((v, j) => { if (j % 4 === 3 && v > 128) cibles.push(j); });
  g.clearRect(0, 0, BASSE, BASSE);
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
  let particules = [], teinte = Math.random() * 360, fini = false, boucle = 0;

  const point = (ev) => {
    const r = peinture.getBoundingClientRect();
    return [((ev.clientX - r.left) / r.width) * W, ((ev.clientY - r.top) / r.height) * W];
  };
  const trait = ([ax, ay], [bx, by]) => {
    teinte = (teinte + Math.hypot(bx - ax, by - ay) * 0.15) % 360;
    const c = `hsl(${teinte} 95% 55%)`;
    p.strokeStyle = p.shadowColor = c;
    p.shadowBlur = pinceau * 0.6;
    p.lineWidth = pinceau;
    p.beginPath(); p.moveTo(ax, ay); p.lineTo(bx, by); p.stroke();
    g.beginPath(); g.moveTo(ax * s, ay * s); g.lineTo(bx * s, by * s); g.stroke();
    for (let n = 0; n < 3; n++) etincelle(bx, by, 1);
  };
  const etincelle = (x, y, force) => {
    const a = Math.random() * Math.PI * 2, v = (Math.random() * 4 + 1) * dpr * force;
    particules.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - dpr, vie: 1, t: teinte + Math.random() * 60, r: (Math.random() * 3 + 2) * dpr });
  };

  // Étincelles et halo sous le doigt, image par image, tant qu'il y a quelque chose à montrer.
  const animer = () => {
    if (!toile.isConnected) return;
    e.clearRect(0, 0, W, W);
    e.globalCompositeOperation = 'lighter';
    for (const [x, y] of doigts.values()) {
      const halo = e.createRadialGradient(x, y, 0, x, y, pinceau * 1.4);
      halo.addColorStop(0, `hsl(${teinte} 100% 75% / .9)`);
      halo.addColorStop(1, `hsl(${teinte} 100% 60% / 0)`);
      e.fillStyle = halo;
      e.beginPath(); e.arc(x, y, pinceau * 1.4, 0, Math.PI * 2); e.fill();
    }
    particules = particules.filter((q) => (q.vie -= 0.025) > 0);
    for (const q of particules) {
      q.x += q.vx; q.y += q.vy; q.vy += 0.08 * dpr;
      e.fillStyle = `hsl(${q.t} 100% 65% / ${q.vie})`;
      e.beginPath(); e.arc(q.x, q.y, q.r * q.vie + dpr, 0, Math.PI * 2); e.fill();
    }
    boucle = doigts.size || particules.length ? requestAnimationFrame(animer) : 0;
  };
  const relancer = () => { boucle ||= requestAnimationFrame(animer); };

  const verifier = () => {
    if (fini || couverture() < SEUIL) return;
    fini = true;
    bip(true);
    for (let n = 0; n < 120; n++) etincelle(W / 2 + (Math.random() - 0.5) * W * 0.5, W / 2 + (Math.random() - 0.5) * W * 0.5, 2);
    relancer();
    app.querySelector('.mascotte').classList.add('saute');
    dire().then(() => setTimeout(() => { if (toile.isConnected) location.hash = `#/tracer/${i + 1}`; }, 800));
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
  });
}
