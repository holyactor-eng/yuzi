import { MOTS, UNITES, CONSIGNES } from './content.js';
import { genererLecon } from './exercices.js';
import { apresReponse, dus, jourLocal } from './srs.js';
import { apresLecon, serieActuelle, xpDuJour, OBJECTIF_XP, coeursDuJour, perdreCoeur, COEURS_MAX } from './progres.js';
import { jouer, enregistrer, jouerBlob, bip } from './audio.js';

/* ---------- Textes de l'interface (tout en persan) ---------- */

const UI = {
  quiJoue: 'کی بازی می‌کنه؟',
  nouveau: 'بازیکن تازه',
  nom: 'اسم',
  groupe: 'سن',
  groupes: { petit: '۴ تا ۷', moyen: '۸ تا ۱۱', grand: '۱۲ تا ۱۵' },
  avatar: 'عکس',
  ok: 'باشه',
  retour: 'برگشت',
  consignes: CONSIGNES,
  bravo: ['آفرین!', 'عالیه!', 'ایول!', 'دمت گرم!'],
  encore: 'دوباره امتحان کن',
  reponse: 'جواب درست',
  suivant: 'بعدی',
  fin: 'تموم شد!',
  xp: 'امتیاز',
  serie: 'روز پشت سر هم',
  revision: 'مرور',
  autocollants: 'برچسب‌ها',
  nouvelAutocollant: 'برچسب تازه!',
  plusDeCoeurs: 'قلب‌ها تموم شد. فردا دوباره!',
  parler: 'حرف بزن',
  ecouterMoi: 'صدای خودم',
  jaiDit: 'گفتم',
};
const AVATARS = ['🐆', '🦁', '🐼', '🦊', '🐰', '🐸', '🦄', '🐢', '🐧', '🦋'];
const fa = (n) => n.toLocaleString('fa-IR');
const auHasard = (l) => l[Math.floor(Math.random() * l.length)];

/* ---------- Stockage (sur la tablette uniquement) ---------- */

const get = (k, d = null) => { try { return JSON.parse(localStorage.getItem('yuzi.' + k)) ?? d; } catch { return d; } };
const set = (k, v) => localStorage.setItem('yuzi.' + k, JSON.stringify(v));
const profils = () => get('profils', []);
const profilActif = () => profils().find((p) => p.id === get('actif'));
// Données d'un enfant : { progres, cartes, lecons: { id: true }, autocollants: [], coeurs }.
const donnees = (id) => get('p.' + id, { progres: undefined, cartes: {}, lecons: {}, autocollants: [], coeurs: undefined });
const garder = (id, d) => set('p.' + id, d);

/* ---------- Rendu ---------- */

const app = document.getElementById('app');
const h = (html) => { app.innerHTML = html; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function render() {
  const route = location.hash.slice(2);
  const p = profilActif();
  if (route === 'nouveau') return ecranNouveau();
  if (!p) return ecranProfils();
  if (route.startsWith('lecon/')) return ecranLecon(p, route.slice(6));
  if (route === 'autocollants') return ecranAutocollants(p);
  if (route === 'profils') return ecranProfils();
  ecranChemin(p);
}

function ecranProfils() {
  h(`<section class="profils">
    <div class="mascotte grand">🐆</div>
    <h1>${UI.quiJoue}</h1>
    <div class="tuiles">
      ${profils().map((p) => `<button class="tuile" data-id="${p.id}"><span class="avatar">${p.avatar}</span><span>${esc(p.nom)}</span></button>`).join('')}
      <a class="tuile nouveau" href="#/nouveau"><span class="avatar">＋</span><span>${UI.nouveau}</span></a>
    </div>
  </section>`);
  app.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => { set('actif', b.dataset.id); location.hash = '#/'; render(); }));
}

function ecranNouveau() {
  h(`<form class="nouveau-profil">
    <a href="#/profils" class="retour" aria-label="${UI.retour}">→</a>
    <label>${UI.nom}<input name="nom" required maxlength="20" autocomplete="off"></label>
    <fieldset><legend>${UI.avatar}</legend>
      <div class="choix-avatar">${AVATARS.map((a, i) => `<label><input type="radio" name="avatar" value="${a}" ${i ? '' : 'checked'}><span>${a}</span></label>`).join('')}</div>
    </fieldset>
    <fieldset><legend>${UI.groupe}</legend>
      <div class="choix-groupe">${Object.entries(UI.groupes).map(([k, v], i) => `<label><input type="radio" name="groupe" value="${k}" ${i ? '' : 'checked'}><span>${v}</span></label>`).join('')}</div>
    </fieldset>
    <button class="gros">${UI.ok}</button>
  </form>`);
  app.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const p = { id: crypto.randomUUID(), nom: f.get('nom').trim(), avatar: f.get('avatar'), groupe: f.get('groupe'), coeurs: false };
    set('profils', [...profils(), p]);
    set('actif', p.id);
    location.hash = '#/';
  });
}

// Une leçon s'ouvre quand la précédente (dans l'ordre du programme) est faite.
const toutesLecons = () => UNITES.flatMap((u) => u.lecons.map((l) => ({ ...l, unite: u })));
const ouverte = (d, i) => i === 0 || d.lecons[toutesLecons()[i - 1].id];

function ecranChemin(p) {
  const d = donnees(p.id), jour = jourLocal();
  const aRevoir = dus(d.cartes, jour);
  const lecons = toutesLecons();
  const coeurs = p.groupe === 'grand' && p.coeurs ? `<span class="badge">❤️ ${fa(coeursDuJour(d.coeurs, jour))}</span>` : '';
  h(`<header class="barre">
      <a href="#/profils" class="avatar-petit">${p.avatar}</a>
      <span class="badge" title="${UI.serie}">🔥 ${fa(serieActuelle(d.progres, jour))}</span>
      <span class="badge" title="${UI.xp}">⭐ ${fa(xpDuJour(d.progres, jour))}/${fa(OBJECTIF_XP)}</span>
      ${coeurs}
      <a href="#/autocollants" class="badge" title="${UI.autocollants}">🎁 ${fa(d.autocollants.length)}</a>
    </header>
    <section class="chemin">
      ${aRevoir.length >= 3 ? `<a class="rond revision" href="#/lecon/revision"><span>🔁</span><small>${UI.revision}</small></a>` : ''}
      ${UNITES.map((u) => `<div class="unite"><h2><span>${u.emoji}</span> ${esc(u.titre)}</h2>
        ${u.lecons.map((l) => {
          const i = lecons.findIndex((x) => x.id === l.id);
          const fait = d.lecons[l.id], ok = ouverte(d, i);
          const contenu = fait ? '✓' : ok ? MOTS[l.items[0]].emoji : '🔒';
          return ok
            ? `<a class="rond ${fait ? 'fait' : 'actuel'}" style="--decalage:${Math.sin(i * 1.2) * 80}px" href="#/lecon/${l.id}">${contenu}</a>`
            : `<span class="rond ferme" style="--decalage:${Math.sin(i * 1.2) * 80}px">${contenu}</span>`;
        }).join('')}</div>`).join('')}
    </section>`);
}

function ecranAutocollants(p) {
  const d = donnees(p.id);
  h(`<header class="barre"><a href="#/" class="retour" aria-label="${UI.retour}">→</a><h1>${UI.autocollants}</h1></header>
    <section class="album">${d.autocollants.map((a) => `<span>${a}</span>`).join('')}</section>`);
}

/* ---------- Leçon ---------- */

function ecranLecon(p, idLecon) {
  const d = donnees(p.id), jour = jourLocal();
  const revision = idLecon === 'revision';
  const lecon = toutesLecons().find((l) => l.id === idLecon);
  if (!revision && !lecon) { location.hash = '#/'; return; }
  const items = revision ? dus(d.cartes, jour).slice(0, 6) : lecon.items;
  const revisions = revision ? [] : dus(d.cartes, jour).filter((x) => !items.includes(x)).slice(0, 2);
  const file = genererLecon(items, p.groupe, MOTS, { revisions });
  const avecCoeurs = p.groupe === 'grand' && p.coeurs;
  const etat = { file, i: 0, total: file.length, rates: new Set() };

  if (avecCoeurs && coeursDuJour(d.coeurs, jour) === 0) {
    h(`<section class="fin"><div class="mascotte grand">😴</div><h1>${UI.plusDeCoeurs}</h1><a class="gros" href="#/">${UI.ok}</a></section>`);
    return;
  }

  const suivant = () => {
    etat.i++;
    if (etat.i < etat.file.length) montrer();
    else terminer();
  };

  // Réponse donnée : retour visuel et sonore ; une erreur fait revenir l'exercice en fin de leçon.
  const repondre = (juste, solution = '') => {
    const e = etat.file[etat.i];
    bip(juste);
    if (!juste) {
      etat.rates.add(e.mot);
      etat.file.push({ ...e });
      if (avecCoeurs) {
        const dd = donnees(p.id);
        dd.coeurs = perdreCoeur(dd.coeurs, jour);
        garder(p.id, dd);
        if (dd.coeurs.n === 0) return ecranLecon(p, idLecon);
      }
    }
    const pied = app.querySelector('.pied');
    pied.className = `pied ${juste ? 'juste' : 'faux'}`;
    pied.innerHTML = `<div class="message"><span class="mascotte">${juste ? '🐆' : '🙀'}</span>
      <strong>${juste ? auHasard(UI.bravo) : UI.encore}</strong>${solution ? `<span class="solution">${solution}</span>` : ''}</div>
      <button class="gros">${UI.suivant}</button>`;
    pied.querySelector('button').addEventListener('click', suivant);
    pied.querySelector('button').focus();
    app.querySelector('.zone').inert = true;
  };

  const montrer = () => {
    const e = etat.file[etat.i];
    const fait = Math.min(etat.i, etat.total);
    h(`<header class="barre-lecon">
        <a href="#/" class="fermer" aria-label="${UI.retour}">✕</a>
        <div class="progression"><span style="width:${(fait / etat.total) * 100}%"></span></div>
        ${avecCoeurs ? `<span class="badge">❤️ ${fa(coeursDuJour(donnees(p.id).coeurs, jour))}</span>` : ''}
      </header>
      <section class="exercice">
        <button class="consigne" aria-label="${UI.consignes[e.type]}"><span class="mascotte">🐆</span><span class="bulle">${p.groupe === 'petit' ? '🔊' : UI.consignes[e.type]}</span></button>
        <div class="zone"></div>
      </section>
      <footer class="pied"></footer>`);
    const consigne = () => jouer('ui-' + e.type, UI.consignes[e.type]);
    app.querySelector('.consigne').addEventListener('click', consigne);
    // Les petits ne lisent pas : la consigne est dite avant chaque exercice d'un nouveau type.
    const precedent = etat.file[etat.i - 1];
    const dire = p.groupe === 'petit' && precedent?.type !== e.type ? consigne() : Promise.resolve();
    EXERCICES[e.type](app.querySelector('.zone'), e, repondre, dire);
  };

  const terminer = () => {
    const dd = donnees(p.id);
    const xp = 10 + (etat.rates.size ? 0 : 5);
    dd.progres = apresLecon(dd.progres, { jour, xp });
    for (const id of new Set(file.map((e) => e.mot))) dd.cartes[id] = apresReponse(dd.cartes[id], !etat.rates.has(id), jour);
    let nouveau = null;
    if (!revision && !dd.lecons[idLecon]) {
      dd.lecons[idLecon] = true;
      nouveau = auHasard(lecon.items.map((id) => MOTS[id].emoji).filter((x) => !dd.autocollants.includes(x))) ?? null;
      if (nouveau) dd.autocollants.push(nouveau);
    }
    garder(p.id, dd);
    h(`<section class="fin">
      <div class="mascotte grand saute">🐆</div>
      <h1>${UI.fin}</h1>
      <div class="gains">
        <span class="badge">⭐ +${fa(xp)}</span>
        <span class="badge">🔥 ${fa(dd.progres.serie)}</span>
      </div>
      ${nouveau ? `<p class="autocollant"><span>${nouveau}</span>${UI.nouvelAutocollant}</p>` : ''}
      <a class="gros" href="#/">${UI.ok}</a>
    </section>`);
  };

  montrer();
}

/* ---------- Types d'exercices ---------- */
// Chacun reçoit sa zone, l'exercice, repondre(juste, solution) et la promesse de fin de consigne.

const bouton = (cls, contenu, attrs = '') => `<button class="${cls}" ${attrs}>${contenu}</button>`;
const ecouter = (id) => jouer(id, MOTS[id].parle);
const hautParleur = (id) => bouton('haut-parleur', '🔊', `data-son="${id}" aria-label="🔊"`);
function brancherSons(zone) {
  zone.querySelectorAll('[data-son]').forEach((b) => b.addEventListener('click', () => ecouter(b.dataset.son)));
}

// Choix parmi quatre images ; « ecoute » part du son, « lis » de l'écrit.
function choixImages(zone, e, repondre, dire, consigneEcrite) {
  zone.innerHTML = `<div class="enonce">${consigneEcrite ? `<p class="persan grand-texte">${esc(MOTS[e.mot].ecrit)}</p>` : ''}${hautParleur(e.mot)}</div>
    <div class="grille">${e.choix.map((id) => bouton('carte', MOTS[id].emoji, `data-id="${id}"`)).join('')}</div>`;
  brancherSons(zone);
  if (!consigneEcrite) dire.then(() => ecouter(e.mot));
  zone.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => {
    const juste = b.dataset.id === e.mot;
    b.classList.add(juste ? 'juste' : 'faux');
    if (consigneEcrite || !juste) ecouter(e.mot);
    repondre(juste, juste ? '' : MOTS[e.mot].emoji);
  }));
}

const EXERCICES = {
  ecoute: (zone, e, repondre, dire) => choixImages(zone, e, repondre, dire, false),
  lis: (zone, e, repondre, dire) => choixImages(zone, e, repondre, dire, true),

  // Trois sons à relier à trois images. Une erreur compte, mais on continue jusqu'à tout relier.
  paires(zone, e, repondre) {
    const images = [...e.mots].sort(() => Math.random() - 0.5);
    zone.innerHTML = `<div class="paires">
      <div class="colonne">${e.mots.map((id) => bouton('carte son', '🔊', `data-gauche="${id}"`)).join('')}</div>
      <div class="colonne">${images.map((id) => bouton('carte', MOTS[id].emoji, `data-droite="${id}"`)).join('')}</div>
    </div>`;
    let choisi = null, erreur = false, restants = e.mots.length;
    zone.querySelectorAll('[data-gauche]').forEach((b) => b.addEventListener('click', () => {
      zone.querySelectorAll('[data-gauche]').forEach((x) => x.classList.remove('choisi'));
      b.classList.add('choisi');
      choisi = b.dataset.gauche;
      ecouter(choisi);
    }));
    zone.querySelectorAll('[data-droite]').forEach((b) => b.addEventListener('click', () => {
      if (!choisi) return;
      const g = zone.querySelector(`[data-gauche="${choisi}"]`);
      if (b.dataset.droite === choisi) {
        g.disabled = b.disabled = true;
        g.classList.add('juste');
        b.classList.add('juste');
        choisi = null;
        if (--restants === 0) repondre(!erreur);
      } else {
        erreur = true;
        bip(false);
        b.classList.add('secoue');
        setTimeout(() => b.classList.remove('secoue'), 400);
      }
    }));
  },

  // Remettre les mots d'une expression dans l'ordre.
  blocs(zone, e, repondre, dire) {
    const attendu = MOTS[e.mot].ecrit;
    zone.innerHTML = `<div class="enonce"><span class="emoji-grand">${MOTS[e.mot].emoji}</span>${hautParleur(e.mot)}</div>
      <div class="ligne persan"></div>
      <div class="banque persan">${e.blocs.map((m, i) => bouton('bloc', esc(m), `data-i="${i}"`)).join('')}</div>`;
    brancherSons(zone);
    dire.then(() => ecouter(e.mot));
    const ligne = zone.querySelector('.ligne');
    zone.querySelectorAll('.banque .bloc').forEach((b) => b.addEventListener('click', () => {
      const copie = bouton('bloc', b.textContent);
      ligne.insertAdjacentHTML('beforeend', copie);
      const placé = ligne.lastElementChild;
      b.disabled = true;
      placé.addEventListener('click', () => { placé.remove(); b.disabled = false; });
      if (ligne.children.length === e.blocs.length) {
        const juste = [...ligne.children].map((x) => x.textContent).join(' ') === attendu;
        repondre(juste, juste ? '' : esc(attendu));
      }
    }));
  },

  // Écrire le mot avec des tuiles de lettres (lettres du mot + leurres).
  ecris(zone, e, repondre, dire) {
    const attendu = MOTS[e.mot].ecrit;
    zone.innerHTML = `<div class="enonce"><span class="emoji-grand">${MOTS[e.mot].emoji}</span>${hautParleur(e.mot)}</div>
      <div class="ligne persan grand-texte"><span class="saisie"></span><button class="effacer" aria-label="⌫">⌫</button></div>
      <div class="banque persan">${e.lettres.map((l) => bouton('bloc lettre', l)).join('')}</div>`;
    brancherSons(zone);
    dire.then(() => ecouter(e.mot));
    const saisie = zone.querySelector('.saisie');
    const pile = [];
    zone.querySelector('.effacer').addEventListener('click', () => {
      const b = pile.pop();
      if (!b) return;
      b.disabled = false;
      saisie.textContent = saisie.textContent.slice(0, -1);
    });
    zone.querySelectorAll('.lettre').forEach((b) => b.addEventListener('click', () => {
      b.disabled = true;
      pile.push(b);
      saisie.textContent += b.textContent;
      if (saisie.textContent.length === attendu.length) {
        const juste = saisie.textContent === attendu;
        repondre(juste, juste ? '' : esc(attendu));
      }
    }));
  },

  // Dire le mot. ponytail: en attendant la reconnaissance (spike Vosk), l'enfant s'écoute puis valide lui-même.
  dis(zone, e, repondre, dire) {
    zone.innerHTML = `<div class="enonce"><span class="emoji-grand">${MOTS[e.mot].emoji}</span>${hautParleur(e.mot)}</div>
      <button class="micro" aria-label="${UI.parler}">🎤</button>
      <div class="apres-micro" hidden>${bouton('haut-parleur moi', '👂', `aria-label="${UI.ecouterMoi}"`)}${bouton('gros', `✓ ${UI.jaiDit}`, 'data-ok')}</div>`;
    brancherSons(zone);
    dire.then(() => ecouter(e.mot));
    const micro = zone.querySelector('.micro');
    let rec = null, blob = null;
    micro.addEventListener('click', async () => {
      if (rec) {
        blob = await rec.stop();
        rec = null;
        micro.classList.remove('ecoute');
        zone.querySelector('.apres-micro').hidden = false;
        return jouerBlob(blob);
      }
      try {
        rec = await enregistrer();
        micro.classList.add('ecoute');
      } catch {
        // Pas de micro : on ne bloque jamais l'enfant.
        zone.querySelector('.apres-micro').hidden = false;
      }
    });
    zone.querySelector('.moi').addEventListener('click', () => blob && jouerBlob(blob));
    zone.querySelector('[data-ok]').addEventListener('click', () => repondre(true));
  },
};

// Hors ligne et installation comme une vraie app.
navigator.serviceWorker?.register('sw.js');

addEventListener('hashchange', render);
render();
