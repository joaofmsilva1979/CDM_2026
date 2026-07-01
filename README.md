# Coupe du Monde 2026 — Bracket live

Site statique + une fonction serverless. Le fetch marche partout, pas seulement dans claude.ai,
parce que la clé API vit côté serveur (Vercel), jamais dans le navigateur.

## Ce dont tu as besoin avant de commencer

1. Une clé API Anthropic : https://console.anthropic.com/ → Settings → API Keys → Create Key.
   Garde-la, tu ne la reverras pas en clair ensuite.
2. Un compte Vercel (gratuit) : https://vercel.com/signup — connecte-toi avec GitHub, c'est le plus simple.
3. Claude Code installé sur ton Mac (terminal). Si pas encore fait :
   `npm install -g @anthropic-ai/claude-code`

## Étapes à exécuter dans Claude Code (terminal, dans ce dossier)

```bash
# 1. Se placer dans le dossier du projet
cd chemin/vers/cdm2026-live-site

# 2. Installer le CLI Vercel
npm install -g vercel

# 3. Se connecter (ouvre le navigateur pour l'auth)
vercel login

# 4. Premier déploiement — répondre aux questions (accepter les valeurs par défaut)
vercel

# 5. Ajouter la clé API comme variable d'environnement SERVEUR (jamais dans le code)
vercel env add ANTHROPIC_API_KEY
# → coller ta clé quand demandé, choisir "Production" (et "Preview" si tu veux tester avant)

# 6. Déployer en production avec la variable prise en compte
vercel --prod
```

Vercel te donne une URL du type `https://cdm2026-live-site.vercel.app`. C'est ton site,
accessible depuis n'importe où, bouton "Actualiser en direct" fonctionnel.

## Pourquoi ça marche ici et pas dans le fichier téléchargé de tout à l'heure

- Le fichier local (`file://...`) n'a ni serveur, ni clé, ni autorisation CORS : le fetch
  échoue toujours, structurellement.
- Ici, `/api/refresh.js` tourne sur les serveurs de Vercel, détient la clé dans une variable
  d'environnement, et c'est LUI qui appelle l'API Anthropic — le navigateur de l'utilisateur
  ne parle qu'à `/api/refresh`, jamais directement à Anthropic.

## Limites à connaître (pas cachées sous le tapis)

- **Coût** : chaque clic sur "Actualiser" consomme des tokens sur TON compte Anthropic
  (facturation à l'usage, pas de plafond gratuit). Avec `web_search` activé, compte large
  marge — surveille https://console.anthropic.com/settings/usage si tu ouvres le site au public.
- **Pas de cache** : si 50 personnes cliquent en même temps, ça fait 50 appels API. Pour un usage
  perso/petit cercle, aucun souci. Pour un usage public, il faudrait ajouter un cache
  (ex. stocker le dernier résultat 5 minutes avec Vercel KV) — je peux le faire si besoin,
  mais ce n'est pas fait dans cette version.
- **Fiabilité du JSON** : le modèle peut occasionnellement mal formater sa réponse malgré
  la consigne stricte. Le front gère l'erreur proprement (message affiché, données précédentes
  conservées), mais ce n'est pas garanti à 100%.

## Pour remettre à jour le design ou les données de référence plus tard

Modifie `index.html` (frontend) ou `api/refresh.js` (le prompt envoyé à Claude), puis relance
`vercel --prod` depuis Claude Code pour republier.
