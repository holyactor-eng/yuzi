// Reconnaissance vocale hors ligne : Vosk + modèle persan (vendor/), grammaire restreinte, décision.

// Formes arabes vers persanes, voyelles brèves et ponctuation retirées, demi-espace et espaces multiples ramenés à un espace.
export const normaliser = (t) =>
  t.replace(/ك/g, 'ک').replace(/[يى]/g, 'ی').replace(/[ً-ْٰ؟?!.،؛]/g, '').replace(/[‌\s]+/g, ' ').trim();

export const decider = (reconnu, attendu) => Boolean(reconnu) && normaliser(reconnu) === normaliser(attendu);

// Le moteur ne choisit qu'entre les mots connus et « inconnu » : bien plus fiable sur une voix d'enfant.
// Tous les mots servent de leurres : le moteur force toujours un mot de la liste, plus elle est longue, moins il tombe par hasard sur le bon.
export const grammaire = (id, mots) =>
  [...new Set([id, ...Object.keys(mots)])].map((x) => normaliser(mots[x].parle)).concat('[unk]');

// Moteur chargé une fois (53 Mo la première fois, ensuite depuis le cache) ; null si la tablette ne peut pas.
let modele;
export function chargerModele() {
  modele ??= new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = 'vendor/vosk.js';
    s.onload = ok;
    s.onerror = ko;
    document.head.append(s);
  }).then(() => globalThis.Vosk.createModel(new URL('vendor/model.tar.gz', location.href).href)).catch(() => null);
  return modele;
}

// Écoute le micro pendant duree ms et renvoie ce que le moteur a reconnu dans la grammaire ('' si rien).
// À appeler pendant le toucher : sur mobile, le contexte audio doit naître avant tout await.
let ctx;
export async function ecouterMicro(mots, duree = 2500) {
  ctx ??= new AudioContext();
  const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
  await ctx.resume();
  const m = await chargerModele();
  const rec = new m.KaldiRecognizer(ctx.sampleRate, JSON.stringify(mots));
  const textes = [];
  return new Promise((ok) => {
    // Le moteur traite l'audio en différé : on attend 1,5 s sans nouvel événement après la demande du résultat final.
    let attente = null, fini = false;
    const relancer = () => {
      if (!fini) return;
      clearTimeout(attente);
      attente = setTimeout(() => { rec.remove(); ok(textes.join(' ').replace(/\[unk\]/g, '').trim()); }, 1500);
    };
    rec.on('partialresult', relancer);
    rec.on('result', (r) => { if (r.result.text) textes.push(r.result.text); relancer(); });
    const source = ctx.createMediaStreamSource(flux);
    const noeud = ctx.createScriptProcessor(4096, 1, 1);
    noeud.onaudioprocess = (e) => { try { rec.acceptWaveform(e.inputBuffer); } catch {} };
    source.connect(noeud);
    noeud.connect(ctx.destination);
    setTimeout(() => {
      source.disconnect();
      noeud.disconnect();
      flux.getTracks().forEach((t) => t.stop());
      rec.retrieveFinalResult();
      fini = true;
      relancer();
    }, duree);
  });
}
