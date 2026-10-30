// Tracer les lettres au doigt (dès 4 ans) : la lettre en filigrane, le doigt la remplit d'une couleur lumineuse
// qui ondule comme un liquide, des étincelles suivent le doigt. Lettre recouverte aux 4/5 : bravo, son nom, lettre suivante.
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
  let particules = [], teinte = Math.random() * 360, fini = false, boucle = 0, parcours = 0;

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
    if (vague) {
      vague.sale = true;
      parcours += Math.hypot(bx - ax, by - ay);
      if (parcours > pinceau * 1.5 || ax === bx) { parcours = 0; vague.onde(bx / W, 1 - by / W); }
    }
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
    const eauVive = vague?.dessiner();
    boucle = doigts.size || particules.length || eauVive ? requestAnimationFrame(animer) : 0;
  };
  const relancer = () => { boucle ||= requestAnimationFrame(animer); };

  const verifier = () => {
    if (fini || couverture() < SEUIL) return;
    fini = true;
    bip(true);
    for (let n = 0; n < 120; n++) etincelle(W / 2 + (Math.random() - 0.5) * W * 0.5, W / 2 + (Math.random() - 0.5) * W * 0.5, 2);
    for (let n = 0; n < 5; n++) vague?.onde(0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.6);
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
    if (vague) { vague.sale = true; relancer(); }
  });
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
