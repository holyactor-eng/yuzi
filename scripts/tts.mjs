// Génère les audio/<id>.mp3 manquants avec edge-tts (gratuit, sans clé ; dernière version via uvx, les anciennes reçoivent 403).
// node scripts/tts.mjs [id…] : régénère ces ids même s'ils existent (après relecture).
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { MOTS, CONSIGNES, MATAL } from '../content.js';

const sons = [
  ...Object.values(MOTS).map((m) => [m.id, m.voix ?? m.parle, 'fa-IR-DilaraNeural']),
  ...Object.entries(CONSIGNES).map(([t, texte]) => ['ui-' + t, texte, 'fa-IR-FaridNeural']),
  ...MATAL.flatMap((c) => c.lignes.map(([texte], n) => [`matal-${c.id}-${n}`, texte, 'fa-IR-DilaraNeural'])),
];
const forcer = process.argv.slice(2);
for (const [id, texte, voix] of sons) {
  const f = new URL(`../audio/${id}.mp3`, import.meta.url).pathname;
  if (existsSync(f) && !forcer.includes(id)) continue;
  execFileSync('uvx', ['--from', 'edge-tts@latest', 'edge-tts', '--voice', voix, '--rate=-15%', '--text', texte, '--write-media', f]);
  console.log(id, texte);
}
