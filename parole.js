// Reconnaissance vocale hors ligne : Vosk + modèle persan (vendor/), grammaire restreinte, décision.

// Formes arabes vers persanes, voyelles brèves et ponctuation retirées, demi-espace et espaces multiples ramenés à un espace.
export const normaliser = (t) =>
  t.replace(/ك/g, 'ک').replace(/[يى]/g, 'ی').replace(/[ً-ْٰ؟?!.،؛]/g, '').replace(/[‌\s]+/g, ' ').trim();

export const decider = (reconnu, attendu) => Boolean(reconnu) && normaliser(reconnu) === normaliser(attendu);

// Le moteur ne choisit qu'entre les mots connus et « inconnu » : bien plus fiable sur une voix d'enfant.
// Tous les mots de même nature servent de leurres : le moteur force toujours un mot de la liste, plus elle est longue,
// moins il tombe par hasard sur le bon. Mots et noms de lettres à part : « گاو » se confondait avec « گاف ».
export const grammaire = (id, mots) =>
  [...new Set([id, ...Object.keys(mots).filter((x) => !mots[x].lettre === !mots[id].lettre)])]
    .map((x) => normaliser(mots[x].parle)).concat('[unk]');

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

// Écoute le micro pendant duree ms ; renvoie { texte, niveau } : ce que le moteur a reconnu dans la grammaire
// ('' si rien) et le volume le plus fort entendu (0 à 1), pour savoir si le micro a capté une voix.
// pret() est appelé quand le micro écoute vraiment : avant, sur tablette, l'enfant parlait dans le vide
// pendant l'ouverture du micro et la préparation du moteur. niveau(v) suit le volume en direct.
// À appeler pendant le toucher : sur mobile, le contexte audio doit naître avant tout await.
let ctx;
export async function ecouterMicro(mots, { duree = 3500, pret = () => {}, niveau = () => {} } = {}) {
  ctx ??= new AudioContext();
  // Pas d'annulation d'écho ni de réduction de bruit : le micro n'ouvre qu'après la voix de la tablette, et ces
  // traitements Android écrasent une petite voix d'enfant. Le gain automatique, lui, aide.
  const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true, channelCount: 1 } });
  await ctx.resume();
  const m = await chargerModele();
  const rec = new m.KaldiRecognizer(ctx.sampleRate, JSON.stringify(mots));
  const textes = [];
  let max = 0;
  return new Promise((ok) => {
    // Le moteur traite l'audio en différé : on attend 1,5 s sans nouvel événement après la demande du résultat final.
    let attente = null, fini = false;
    const relancer = () => {
      if (!fini) return;
      clearTimeout(attente);
      attente = setTimeout(() => { rec.remove(); ok({ texte: textes.join(' ').replace(/\[unk\]/g, '').trim(), niveau: max }); }, 1500);
    };
    rec.on('partialresult', relancer);
    rec.on('result', (r) => { if (r.result.text) textes.push(r.result.text); relancer(); });
    const source = ctx.createMediaStreamSource(flux);
    const noeud = ctx.createScriptProcessor(4096, 1, 1);
    noeud.onaudioprocess = (e) => {
      const d = e.inputBuffer.getChannelData(0);
      let somme = 0;
      for (let i = 0; i < d.length; i++) somme += d[i] * d[i];
      const v = Math.min(1, Math.sqrt(somme / d.length) * 6);
      max = Math.max(max, v);
      niveau(v);
      try { rec.acceptWaveform(e.inputBuffer); } catch {}
    };
    source.connect(noeud);
    noeud.connect(ctx.destination);
    pret();
    setTimeout(() => {
      source.disconnect();
      noeud.disconnect();
      flux.getTracks().forEach((t) => t.stop());
      niveau(0);
      rec.retrieveFinalResult();
      fini = true;
      relancer();
    }, duree);
  });
}
