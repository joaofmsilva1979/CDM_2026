// Fonction serverless Vercel — s'exécute côté serveur, jamais dans le navigateur.
// La clé API reste ici, invisible du client. Définir ANTHROPIC_API_KEY dans les
// variables d'environnement du projet Vercel (jamais dans ce fichier, jamais commit).

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY absente des variables d'environnement du serveur." });
    return;
  }

  const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = `Nous sommes le ${today}. Cherche les résultats les plus récents des 16 matchs des seizièmes de finale de la Coupe du Monde FIFA 2026 (Canada/Mexique/USA), et des 8 places de huitièmes de finale.
Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant/après, sans balises markdown, au format EXACT suivant (16 entrées dans "matches", dans cet ordre fixe de paires : Allemagne-Paraguay, France-Suède, AfriqueDuSud-Canada, PaysBas-Maroc, Portugal-Croatie, Espagne-Autriche, EtatsUnis-Bosnie, Belgique-Senegal, Bresil-Japon, CoteDIvoire-Norvege, Mexique-Equateur, Angleterre-RDCongo, Argentine-CapVert, Australie-Egypte, Suisse-Algerie, Colombie-Ghana) :
{"matches":[{"a":"Allemagne","fa":"🇩🇪","b":"Paraguay","fb":"🇵🇾","score":"1-1 (3-4 tab)","w":"b","s":"done","d":"terminé"}, ... 15 autres dans l'ordre indiqué ...],
"r16":[{"left":"...","right":"...","when":"..."}, ... 8 entrées ...],
"updated":"${today}"}
Champs: s = "done" (terminé), "today" (se joue aujourd'hui), ou "pending" (à venir). w = "a" ou "b" si un vainqueur est connu, sinon null. score = null si le match n'a pas eu lieu. Ne devine jamais une case de huitièmes non déterminée officiellement : garde la notation type "1er X vs 3e YYYY" si c'est encore le cas.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: `Anthropic API error: ${errText}` });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
