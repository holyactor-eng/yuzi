# Spike : reconnaissance vocale persane (jetable)

But : savoir si Vosk + le modèle persan gratuit reconnaît les mots dits par les enfants, sur la tablette, sans internet une fois chargé.

Fichiers lourds, partagés avec l'app dans `vendor/` : `vosk.js` (vosk-browser 0.0.8, Apache 2.0) et `model.tar.gz` (vosk-model-small-fa-0.42 d'Alpha Cephei, 53 Mo, Apache 2.0), plus `test.wav`, l'enregistrement de test livré avec le modèle.

## Tester sur la tablette Samsung

Dans **Chrome**, ouvrir https://holyactor-eng.github.io/yuzi/spike/ , attendre « Modèle prêt » (53 Mo à télécharger la première fois, en Wi-Fi), autoriser le micro au premier toucher.

### Variante locale (sans internet)

Utiliser **Chrome** (pas Samsung Internet). Le micro n'est autorisé qu'en HTTPS ou sur une adresse déclarée sûre. Mac et tablette sur le même Wi-Fi.

1. Sur le Mac, depuis le dossier `yuzi`, servir sur le réseau local :
   ```bash
   python3 -m http.server 8766
   ```
   Adresse du Mac : `ipconfig getifaddr en0` (aujourd'hui `192.168.137.79`).
2. Sur la tablette, dans Chrome, ouvrir `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, l'activer, y écrire `http://192.168.137.79:8766`, puis « Relaunch ».
3. Ouvrir `http://192.168.137.79:8766/spike/`, attendre « Modèle prêt », autoriser le micro au premier toucher.

Rien ne sort du réseau de la maison. Après les tests, on peut remettre ce réglage sur « Default ».

Si le réglage pose problème, solution de secours : un tunnel Cloudflare gratuit (`brew install cloudflared`, puis `cloudflared tunnel --url http://localhost:8766`, ouvrir l'adresse `https://….trycloudflare.com/spike/` affichée). Cette adresse est publique tant que la commande tourne : Ctrl+C après le test.

## Protocole

1. Bouton « Auto-test » : doit afficher la phrase `من عرضه این کارو ندارم` (vérifie que le moteur marche sur la tablette).
2. Toi d'abord : les 10 mots, une fois chacun. Puis chaque enfant : écrire son prénom ou son âge, les 10 mots.
3. Pour mesurer les faux positifs : sur 3 cartes, dire **un autre mot** (ou un mot français). Le résultat doit être ✗.
4. Refaire un tour avec « Mode libre » coché pour comparer.
5. « Copier les résultats » et me coller le texte.

## Ce qui est déjà vérifié (Chrome sur Mac, sans micro, via le fichier de test du modèle)

- Modèle chargé en ~2 s après téléchargement.
- Mode libre : `من عرضه این کار رو ندارم` (juste, à la séparation près).
- Grammaire contenant la phrase : transcription exacte.
- Silence et bruit : aucun mot reconnu, ni en grammaire ni en libre.
- **Point faible** : avec une grammaire qui ne contient pas ce qui est dit, le moteur force quand même un mot de la liste (`مامان سلام`), avec une confiance de 1,00. `[unk]` n'absorbe pas. Donc un enfant qui dit n'importe quoi peut être validé si le moteur choisit le mot attendu. Le test des faux positifs (étape 3) dira si c'est fréquent.

## Pas encore vérifié (il faut la vraie tablette)

- Chrome Android sur la Samsung : mémoire (53 Mo de modèle), micro, vitesse de reconnaissance.
- Voix d'enfants (le modèle est entraîné surtout sur des adultes).
- Mots absents du vocabulaire du modèle : le moteur les ignore en silence. Les 10 mots du test y figurent (vérifié dans le graphe).

## Décision ensuite

- Grammaire ≥ 8/10 justes par enfant et faux positifs rares : on intègre la grammaire dans یوزی, avec beaucoup de leurres (tous les mots de l'unité) pour diluer les faux positifs.
- Grammaire trop permissive mais mode libre fiable : on valide en mode libre (le mot doit apparaître dans la transcription).
- Les deux faibles : repli prévu, l'enfant s'écoute et le parent valide.
