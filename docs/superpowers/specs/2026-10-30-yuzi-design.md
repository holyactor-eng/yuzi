# یوزی (Yuzi) : apprendre le persan en immersion (enfants 4-15 ans)

## Context

Afshin veut une app inspirée des mécaniques Duolingo (pas une copie : nom, mascotte, visuels originaux) pour apprendre le persan à une fratrie de 4 à 15 ans dont la langue maternelle est le français. Succès à 3 mois : les petits comprennent et disent des mots/phrases du quotidien, les grands en plus lisent l'alphabet et des phrases écrites.

Décisions d'Afshin :
- **App entièrement en persan** : interface, consignes, audio. Aucun français à l'écran ni à l'oral. Immersion totale.
- **Reconnaissance vocale pour valider les exercices de prononciation.**
- **Tout gratuit** (aucun service payant, aucun abonnement).
- Plusieurs enfants, une **tablette partagée** (profils, pas de synchro).
- Petits = oral + images ; grands = oral + alphabet + écrit.
- Voix : audio IA par défaut, remplaçable mot par mot par la voix d'un parent.
- Mécaniques : chemin de leçons, série + XP, mascotte + récompenses, révision espacée.
- Registre : **parlé (téhéranais) à l'oral, standard à l'écrit**.
- Contenu : **Claude rédige, Afshin relit** le persan.
- Erreurs : jamais de punition pour les petits ; **cœurs optionnels pour les grands**.

Mes choix (à contester) :
- Nom provisoire **یوزی**, mascotte guépard iranien. Aucun asset Duolingo.
- Même stack qu'Éloquence (`/Users/afshin/Documents/CODE/eloquence`) : PWA, JS pur en modules ES, sans build, tests `node:test`, serveur `python3 -m http.server`. Hébergement gratuit (GitHub Pages).
- Sens par l'image, jamais par traduction : chaque mot = emoji + audio persan. Les exercices associent son ↔ image ↔ écrit persan.
- Consignes sans lecture : icône + phrase audio persane courte (« گوش کن »، « تکرار کن »، « انتخاب کن ») + démonstration animée du guépard la première fois qu'un type d'exercice apparaît. Risque : un petit de 4 ans sans persan peut bloquer sur une consigne ; les démos et la répétition doivent suffire, à vérifier avec les enfants.
- Mode parent aussi en persan.
- Images : emoji natifs. Police Vazirmatn (Google Fonts, gratuite), tout en `dir="rtl"`.
- Audio parent en IndexedDB, progression en localStorage.

## Reconnaissance vocale (gratuite)

Choix : **Vosk dans le navigateur** (`vosk-browser`, Apache 2.0) + modèle persan `vosk-model-small-fa` (~50 Mo, Apache 2.0).
- Gratuit, **hors ligne**, la voix des enfants ne quitte pas la tablette.
- Marche dans Chrome sur la tablette Samsung (Android, WebAssembly). La dictée de Chrome existe en persan, mais envoie la voix des enfants chez Google et exige internet.
- **Grammaire restreinte** : on ne demande au moteur que de choisir entre le mot attendu et quelques mots proches. Beaucoup plus fiable qu'une transcription libre, surtout avec des voix d'enfants.
- Indulgence : 3 essais ; après 3 échecs, l'exercice passe quand même (pas de blocage), le mot repart en révision. Bouton parent « ✓ » discret pour valider à la main.
- Fichiers vendus dans `vendor/` et mis en cache par le service worker (pas de CDN à l'exécution).

Écarté : dictée du navigateur (Chrome envoie la voix à Google) ; Whisper dans le navigateur (lourd, lent sur tablette, moins fiable sur mots isolés).

**Étape 0 obligatoire : spike jetable** pour tester Vosk persan sur la tablette réelle avec les voix des enfants (10 mots). Si le taux de réussite est mauvais, repli : l'enfant s'enregistre et se réécoute à côté du modèle, validation par le parent.

## Audio IA (gratuit)

Script Node lancé une fois, Azure TTS offre gratuite F0 (500 000 caractères/mois, largement assez), voix `fa-IR-DilaraNeural` pour les mots et `fa-IR-FaridNeural` pour le guépard. Clé dans une variable d'env, jamais commitée. Fichiers mp3 commités dans `audio/`. Afshin peut remplacer n'importe quel son par sa voix dans le mode parent.

## Profils d'âge

| Profil | Âge | Exercices | Écrit |
|---|---|---|---|
| کوچک | 4-7 | écoute → choisis l'image, dis le mot (reconnaissance), paires image/son | aucun |
| متوسط | 8-11 | + lettres de l'alphabet, mot écrit ↔ image, phrase en blocs (audio) | lettres, mots simples |
| بزرگ | 12-15 | + écrire le mot (clavier persan à l'écran), phrases écrites, dis la phrase, cœurs optionnels | alphabet complet, phrases |

Même leçon, exercices filtrés par profil.

## Structure

Nouveau dossier `/Users/afshin/Documents/CODE/yuzi`, `git init`.

- `index.html` (`lang="fa" dir="rtl"`), `manifest.webmanifest`, `sw.js` (hors ligne : app, `audio/`, `vendor/`), `style.css`, icônes.
- `app.js` : routeur hash (motif `addEventListener('hashchange', render)` d'Éloquence), écrans : profils, chemin, leçon, fin de leçon, autocollants, parent. Textes d'interface regroupés dans un objet `UI` en persan.
- `content.js` : unité = `{ id, titre, emoji, lecons: [{ id, items: [motId...] }] }`. Mot = `{ id, parle, ecrit, emoji, proches: [motId...] }` (`proches` sert aux distracteurs et à la grammaire Vosk). Unité alphabet dédiée.
- `exercices.js` : génère les exercices d'une leçon selon profil + révisions dues. Fonctions pures, testées.
- `srs.js` : Leitner 5 boîtes, intervalles 0/1/3/7/14 j ; erreur = boîte 1. Pur, testé.
- `progres.js` : XP, série (jours consécutifs, fuseau local), objectif quotidien, cœurs. Pur, testé.
- `audio.js` : lecture (voix parent en IndexedDB sinon mp3 IA) et enregistrement, adapté de `eloquence/recorder.js` (version réduite).
- `parole.js` : chargement du modèle Vosk, reconnaissance avec grammaire `[attendu, ...proches]`, décision réussite/échec (fonction de décision pure, testée).
- `parent.js` : accès derrière une petite opération ; profils, remplacement audio par mot, progrès, option cœurs.
- `scripts/tts.mjs` : génère les `audio/<motId>.mp3` manquants.
- `test/*.test.js` : srs, progres, exercices, décision de `parole.js`, cohérence de `content.js` (ids uniques, chaque mot a parle/ecrit/emoji, `proches` existent).
- `.claude/launch.json` : comme Éloquence, port 8766.
- `docs/superpowers/specs/2026-10-30-yuzi-design.md` : ce design.

Repris d'Éloquence par copie adaptée (pas d'import croisé) : helper `get/set` localStorage (`eloquence/app.js:12-18`), style de tests, `recorder.js`.

## Contenu de départ (Claude rédige, Afshin relit)

10 unités, ~8 mots chacune : salutations, famille, couleurs, chiffres 1-10, animaux, nourriture, corps, maison, verbes du quotidien, phrases utiles. Unité alphabet en 6 leçons (32 lettres, formes). Fichier `docs/relecture.md` : tableau parlé / écrit / emoji / sens pour Afshin (seul endroit avec du français, hors app). Relecture avant génération audio.

## Écrans

1. **چه کسی بازی می‌کند؟** tuiles avatar + prénom.
2. **Chemin** : unités, leçons en ronds débloquées dans l'ordre, flamme de série + XP du jour, ronds révision quand des mots sont dus.
3. **Leçon** : 8-12 exercices, barre de progression, gros boutons (≥ 64 px), guépard qui réagit, micro animé pendant l'écoute. Erreur = l'exercice revient à la fin.
4. **Fin** : XP, autocollant gagné, série.
5. **Autocollants**.
6. **Parent**.

## Étapes

0. Spike jetable Vosk persan sur la tablette (décide si la reconnaissance tient).
1. Squelette PWA RTL + profils + routeur + launch.json.
2. `srs.js`, `progres.js`, `exercices.js`, décision de `parole.js`, tests d'abord.
3. 2 unités complètes + `docs/relecture.md`.
4. Écran leçon, types d'exercices, démos du guépard.
5. Intégration Vosk (ou repli selon le spike).
6. Chemin, série, XP, autocollants, cœurs.
7. Mode parent + remplacement audio.
8. `scripts/tts.mjs` + service worker hors ligne.
9. Les 8 unités restantes + alphabet, après relecture des 2 premières.

Hors périmètre : synchro, comptes, classement, illustrations sur mesure.

## Vérification

- `node --test` dans `yuzi/` : tout passe.
- `preview_start {name: "yuzi"}` en 768×1024 : 3 profils, une leçon chacun ; aucun texte français visible (recherche automatique de lettres latines dans le DOM hors `docs/`) ; RTL correct ; série/XP montent ; erreur revient en fin de leçon ; cœurs seulement si activés.
- Reconnaissance : test sur la tablette réelle avec Afshin puis les enfants ; mot juste accepté, mot faux refusé, 3 échecs ne bloquent pas.
- Mode parent : enregistrer un mot, il remplace l'audio IA.
- Hors ligne : réseau coupé, rechargement, app + audio + reconnaissance marchent.
- Captures envoyées à Afshin.
