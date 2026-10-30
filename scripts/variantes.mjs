// Génère plusieurs prononciations candidates d'un mot pour que l'utilisateur choisisse à l'oreille.
// node scripts/variantes.mjs <id> "texte 1" "texte 2" … : écrit audio/_essai/<id>-1.mp3, -2.mp3, …
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const [id, ...textes] = process.argv.slice(2);
if (!id || !textes.length) {
  console.error('usage: node scripts/variantes.mjs <id> "texte 1" "texte 2" …');
  process.exit(1);
}
mkdirSync(new URL('../audio/_essai/', import.meta.url), { recursive: true });
textes.forEach((texte, i) => {
  const f = new URL(`../audio/_essai/${id}-${i + 1}.mp3`, import.meta.url).pathname;
  execFileSync('uvx', ['--from', 'edge-tts@latest', 'edge-tts', '--voice', 'fa-IR-DilaraNeural', '--rate=-15%', '--text', texte, '--write-media', f]);
  console.log(`${id}-${i + 1}`, texte);
});
