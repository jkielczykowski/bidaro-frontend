# GitHub Actions — Secrets (bidigo-frontend)

Dodaj w: **GitHub → jkielczykowski/bidigo-frontend → Settings → Secrets and variables → Actions → New repository secret**

Workflow `.github/workflows/deploy.yml`: build + lint → testy E2E z `bidigo-backend` na tej wersji weba →
deploy na VPS (kontener `bidigo-frontend`, port 9088) → testy dymne strony. Pull requesty: build + E2E.

Lokalnie te same wartości trzymasz w `.env` (wzór: `.env.example`) — nigdy w gicie.

| Secret | Wymagany | Skąd wziąć |
|--------|----------|------------|
| `VITE_SUPABASE_URL` | tak | `https://<REF>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | tak | Supabase → Project Settings → API → anon / publishable key (publiczny, trafia do przeglądarki) |
| `VPS_SSH_KEY` | tak | **cały** prywatny klucz SSH do VPS (multiline), bez passphrase |
| `BACKEND_DEPLOY_KEY` | tak | prywatna część klucza wdrożeniowego (deploy key, tylko odczyt) repo `bidigo-backend` — testy E2E są w backendzie. Ustawia go `bash scripts/backend-deploy-key.sh` |
| `VPS_HOST` | nie | domyślnie `72.61.177.37` |
| `VPS_USERNAME` | nie | domyślnie `root` |

| Variable | Domyślnie |
|----------|-----------|
| `BIDIGO_URL` | `http://72.61.177.37:9088` — adres testów dymnych |

Backend (baza, migracje, wyszukiwarka, maile) wdraża się z `bidigo-backend`. nginx tego repo przekazuje
`/api/search/` do kontenera `bidigo-search` z backendu (sieć Docker `apps-net`).
