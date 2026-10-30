# یوزی

Application pour apprendre le persan aux enfants (4-15 ans), entièrement en persan, gratuite, hors ligne.

## Installer sur la tablette Samsung

1. Dans **Chrome**, ouvrir https://holyactor-eng.github.io/yuzi/
2. Menu ⋮ → « Installer l'application » (ou « Ajouter à l'écran d'accueil »).

L'icône یوزی apparaît avec les autres apps, s'ouvre en plein écran et marche sans internet après le premier lancement.

Mises à jour : `git push` sur `main`. La tablette prend la nouvelle version au lancement suivant avec internet (ouvrir l'app deux fois). Changer `CACHE` dans `sw.js` à chaque version.

## Développement

```bash
node --test
```
