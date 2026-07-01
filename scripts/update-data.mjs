// Ce script tourne UNIQUEMENT dans GitHub Actions (jamais dans le navigateur).
// La clé API vient d'un secret GitHub, elle n'apparaît jamais dans le repo ni dans les logs.
import { writeFile, mkdir } from 'node:fs/promises';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY manquante (vérifie le secret GitHub).");
  process.exit(1);
}

const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

const prompt = `Nous sommes le ${today}. Cherche les résultats les plus récents des 16 matchs des seizièmes de finale de la Coupe du Monde FIFA 2026 (Canada/Mexique/USA), et des 8 places de huitièmes de finale.
Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant/après, sans balises markdown, au format EXACT suivant (16 entrées dans "matches", dans cet ordre fixe de paires : Allemagne-Paraguay, France-Suède, AfriqueDuSud-Canada, PaysBas-Maroc, Portugal-Croatie, Espagne-Autriche, EtatsUnis-Bosnie, Belgique-Senegal, Bresil-Japon, CoteDIvoire-Norvege, Mexique-Equateur, Angleterre-RDCongo, Argentine-CapVert, Australie-Egypte, Suisse-Algerie, Colombie-Ghana) :
{"matches":[{"a":"Allemagne","fa":"🇩🇪","b":"Paraguay","fb":"🇵🇾","score":"1-1 (3-4 tab)","w":"b","s":"done","d":"terminé"}, ... 15 autres dans l'ordre indiqué ...],
"r16":[{"left":"...","right":"...","when":"..."}, ... 8 entrées ...],
"updated":"${today}"}
Champs: s = "done" (terminé), "today" (se joue aujourd'hui), ou "pending" (à venir). w = "a" ou "b" si un vainqueur est connu, sinon null. score = null si le match n'a pas eu lieu. Ne devine jamais une case de huitièmes non déterminée officiellement : garde la notation type "1er X vs 3e YYYY" si c'est encore le cas.`;

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-5',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
  }),
});

if (!response.ok) {
  console.error('Erreur API Anthropic:', await response.text());
  process.exit(1);
}

const data = await response.json();
const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
let clean = textBlocks.replace(/```json|```/g, '').trim();
const firstBrace = clean.indexOf('{');
const lastBrace = clean.lastIndexOf('}');

if (firstBrace === -1 || lastBrace === -1) {
  console.error('Pas de JSON exploitable. stop_reason:', data.stop_reason);
  console.error('Contenu complet reçu:', JSON.stringify(data.content, null, 2));
  process.exit(1);
}
clean = clean.slice(firstBrace, lastBrace + 1);

let parsed;
try {
  parsed = JSON.parse(clean);
} catch (e) {
  console.error('JSON invalide reçu:', clean);
  process.exit(1);
}

if (!parsed.matches || parsed.matches.length !== 16) {
  console.error('Structure JSON incomplète (matches manquant ou incomplet):', parsed);
  process.exit(1);
}

await mkdir('data', { recursive: true });
await writeFile('data/live.json', JSON.stringify(parsed, null, 2) + '\n');
console.log('data/live.json mis à jour —', parsed.updated);
