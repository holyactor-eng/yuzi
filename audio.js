// Sons : voix d'un parent (IndexedDB) en priorité, sinon fichier IA audio/<id>.mp3, sinon synthèse du navigateur.

const base = new Promise((ok, ko) => {
  const r = indexedDB.open('yuzi', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('voix');
  r.onsuccess = () => ok(r.result);
  r.onerror = () => ko(r.error);
});
const requete = (mode, f) => base.then((db) => new Promise((ok, ko) => {
  const r = f(db.transaction('voix', mode).objectStore('voix'));
  r.onsuccess = () => ok(r.result);
  r.onerror = () => ko(r.error);
}));
export const voixParent = (id) => requete('readonly', (s) => s.get(id)).catch(() => null);
export const garderVoix = (id, blob) => requete('readwrite', (s) => s.put(blob, id));
export const oublierVoix = (id) => requete('readwrite', (s) => s.delete(id));

let enCours = null;
function lireUrl(url) {
  enCours?.pause();
  const a = new Audio(url);
  enCours = a;
  return new Promise((ok, ko) => { a.onended = ok; a.onerror = ko; a.play().catch(ko); });
}

function synthese(texte) {
  const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith('fa'));
  if (!v) return Promise.resolve();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texte);
  u.voice = v;
  u.lang = v.lang;
  u.rate = 0.85;
  return new Promise((ok) => { u.onend = ok; u.onerror = ok; speechSynthesis.speak(u); });
}

// id : celui du mot ou de la consigne ; texte : ce que la synthèse dirait en dernier recours.
export async function jouer(id, texte) {
  const blob = await voixParent(id);
  if (blob) {
    const url = URL.createObjectURL(blob);
    return lireUrl(url).finally(() => URL.revokeObjectURL(url)).catch(() => {});
  }
  return lireUrl(`audio/${id}.mp3`).catch(() => synthese(texte));
}

// Enregistre le micro jusqu'à l'appel de stop() ; renvoie le son en Blob.
export async function enregistrer() {
  const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const morceaux = [];
  const rec = new MediaRecorder(flux);
  rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
  const fini = new Promise((ok) => { rec.onstop = () => { flux.getTracks().forEach((t) => t.stop()); ok(new Blob(morceaux, { type: rec.mimeType })); }; });
  rec.start();
  return { stop: () => { rec.stop(); return fini; } };
}
export const jouerBlob = (blob) => {
  const url = URL.createObjectURL(blob);
  return lireUrl(url).finally(() => URL.revokeObjectURL(url)).catch(() => {});
};

// Petits sons de réussite et d'erreur, sans fichier.
let ctx;
export function bip(juste) {
  ctx ??= new AudioContext();
  const notes = juste ? [660, 880] : [300, 220];
  notes.forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = f;
    o.type = 'triangle';
    g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime + i * 0.12);
    o.stop(ctx.currentTime + i * 0.12 + 0.2);
  });
}
