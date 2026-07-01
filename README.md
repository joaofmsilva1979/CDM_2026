# CDM 2026 — bracket sur GitHub Pages, actualisé automatiquement

Architecture : GitHub Pages sert des fichiers statiques (`index.html`, `data/live.json`).
Une GitHub Action programmée met à jour `data/live.json` toutes les 3h en interrogeant Claude
(avec recherche web) via ta clé API stockée en secret GitHub — jamais exposée dans le navigateur,
jamais visible dans le repo.

## Fichiers de ce paquet

```
index.html                        → à mettre à la racine de ton repo (remplace l'existant)
data/live.json                    → données de secours, écrasé automatiquement par l'Action
scripts/update-data.mjs           → le script qui interroge Claude
.github/workflows/refresh.yml     → le planificateur (cron toutes les 3h)
```

## Étapes dans ton repo `joaofmsilva1979/CDM_2026`

### 1. Nettoyer l'ancien essai Vercel
Sur GitHub, supprime le dossier `api/` (le fichier `refresh.js`) — il ne sert plus à rien ici
et pourrait prêter à confusion. `package.json` peut rester ou être supprimé, il n'est plus utilisé
par Pages non plus.

### 2. Ajouter les nouveaux fichiers
Glisse-dépose (ou "Add file → Upload files") le contenu de ce paquet à la racine du repo,
en respectant l'arborescence ci-dessus (GitHub recrée les sous-dossiers `data/`, `scripts/`,
`.github/workflows/` automatiquement si tu uploades les fichiers avec leur chemin, sinon crée-les
à la main via "Create new file" en tapant le chemin complet, ex. `.github/workflows/refresh.yml`).

### 3. Créer le secret API
Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
- Name : `ANTHROPIC_API_KEY`
- Value : ta clé depuis https://console.anthropic.com/settings/keys

### 4. Autoriser l'Action à committer
Repo → **Settings** → **Actions** → **General** → tout en bas, **Workflow permissions**
→ coche **Read and write permissions** → Save.
(Sans ça, l'Action peut lire et écrire le fichier localement mais ne pourra pas le pousser sur le repo.)

### 5. Déclencher un premier run manuel (pas besoin d'attendre 3h)
Onglet **Actions** → clique sur le workflow **"Actualiser les données CDM 2026"**
→ bouton **Run workflow** → Run workflow (branche `main`).
Attends ~30 secondes, rafraîchis : un nouveau commit automatique doit apparaître
(`chore: actualisation automatique des données CDM 2026`) avec `data/live.json` mis à jour.

### 6. Vérifier le site
https://joaofmsilva1979.github.io/CDM_2026/ — recharge la page (Cmd+Shift+R pour ignorer le cache).
Le statut en haut doit afficher la date/heure de la dernière actualisation trouvée dans le JSON.

## Ajuster la fréquence

Dans `.github/workflows/refresh.yml`, la ligne `cron: '0 */3 * * *'` = toutes les 3h, en UTC.
Exemples :
- `0 */6 * * *` → toutes les 6h (plus économe)
- `0 8-23/2 * * *` → toutes les 2h entre 8h et 23h UTC seulement (évite les runs de nuit inutiles)

## Coût réel

Chaque run = un appel API Anthropic avec `web_search` activé, facturé sur ton compte.
Avec un run toutes les 3h (8 runs/jour) pendant la durée du Mondial, le coût reste faible,
mais surveille quand même https://console.anthropic.com/settings/usage les premiers jours
pour calibrer si tu veux resserrer ou espacer le cron.

## Si un run échoue

Onglet **Actions** → clique sur le run en rouge → les logs indiquent la cause exacte
(clé manquante, JSON mal formé renvoyé par le modèle, etc.). Le site continue d'afficher
la dernière version valide de `data/live.json` — un échec de run n'écrase jamais les
bonnes données précédentes, `git-auto-commit-action` ne committe que si le fichier a
été écrit avec succès.
