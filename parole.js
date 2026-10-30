// Reconnaissance vocale : préparation de la grammaire et décision. Le moteur (Vosk) est branché à part.

// Formes arabes vers persanes, voyelles brèves et ponctuation retirées, demi-espace et espaces multiples ramenés à un espace.
export const normaliser = (t) =>
  t.replace(/ك/g, 'ک').replace(/[يى]/g, 'ی').replace(/[ً-ْٰ؟?!.،؛]/g, '').replace(/[‌\s]+/g, ' ').trim();

export const decider = (reconnu, attendu) => Boolean(reconnu) && normaliser(reconnu) === normaliser(attendu);

// Le moteur ne choisit qu'entre le mot attendu, ses proches et « inconnu » : bien plus fiable sur une voix d'enfant.
export const grammaire = (id, mots) =>
  [id, ...(mots[id].proches ?? [])].filter((x) => mots[x]).map((x) => normaliser(mots[x].parle)).concat('[unk]');
