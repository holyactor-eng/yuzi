# یوزی

Application pour apprendre le persan aux enfants (4-15 ans), entièrement en persan, gratuite, hors ligne.

## Installer sur la tablette Samsung

Mac et tablette sur le même Wi-Fi.

1. Sur le Mac, dans ce dossier :
   ```bash
   python3 -m http.server 8766
   ```
2. Sur la tablette, dans **Chrome** : ouvrir `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, activer, écrire `http://192.168.137.79:8766` (adresse du Mac : `ipconfig getifaddr en0`), « Relaunch ». Sans ce réglage, Chrome refuse l'installation et le micro.
3. Ouvrir `http://192.168.137.79:8766`, puis menu ⋮ → « Ajouter à l'écran d'accueil » → « Installer ».

L'icône یوزی apparaît avec les autres apps. Elle s'ouvre en plein écran et marche **sans le Mac et sans internet**.

Mises à jour : rallumer le serveur sur le Mac, ouvrir l'app deux fois (la première charge la nouvelle version, la seconde l'affiche). Changer `CACHE` dans `sw.js` à chaque version.

## Développement

```bash
node --test
```
