# GitHub Actions — Secrets (bidaro-frontend)

Dodaj w: **GitHub → jkielczykowski/bidaro-frontend → Settings → Secrets and variables → Actions → New repository secret**

Workflow `.github/workflows/deploy.yml`: build + lint → testy E2E z `bidaro-backend` na tej wersji weba →
deploy na VPS (kontener `bidaro-frontend`, port 9088) → testy dymne strony. Pull requesty: build + E2E.

Lokalnie te same wartości trzymasz w `.env` (wzór: `.env.example`) — nigdy w gicie.

| Secret | Wymagany | Skąd wziąć |
|--------|----------|------------|
| `VITE_SUPABASE_URL` | tak | `https://<REF>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | tak | Supabase → Project Settings → API → anon / publishable key (publiczny, trafia do przeglądarki) |
| `VPS_SSH_KEY` | tak | **cały** prywatny klucz SSH do VPS (multiline), bez passphrase |
| `BACKEND_REPO_TOKEN` | tak | GitHub → Settings → Developer settings → Fine-grained token: repo `bidaro-backend`, uprawnienie **Contents: Read-only**. Testy E2E są w backendzie |
| `VPS_HOST` | nie | domyślnie `72.61.177.37` |
| `VPS_USERNAME` | nie | domyślnie `root` |

| Variable | Domyślnie |
|----------|-----------|
| `BIDIGO_URL` | `http://72.61.177.37:9088` — adres testów dymnych |

Backend (baza, migracje, wyszukiwarka, maile) wdraża się z `bidaro-backend`. nginx tego repo przekazuje
`/api/search/` do kontenera `bidigo-search` z backendu (sieć Docker `apps-net`).
