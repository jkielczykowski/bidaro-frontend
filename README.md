# bidaro-frontend

Aplikacja webowa Bidaro (React + Vite + TypeScript), serwowana przez nginx na VPS (kontener `bidaro-frontend`, port 9088).

Część trzech repozytoriów:

| Repo | Co |
| --- | --- |
| **bidaro-frontend** (to) | aplikacja webowa |
| [bidaro-backend](https://github.com/jkielczykowski/bidaro-backend) | baza (Supabase), migracje, wyszukiwarka, maile/SMS, testy E2E |
| [bidaro-app](https://github.com/jkielczykowski/bidaro-app) | aplikacja mobilna (Flutter) |

## Lokalnie

```bash
cp .env.example .env      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm ci
npm run dev               # http://localhost:5174
```

`/api/search` w dev: `SEARCH_API_URL=http://127.0.0.1:9095 npm run dev` (lokalny `bidigo-search` z `bidaro-backend/e2e`).

## Testy

Pełne testy E2E (API + przeglądarka) są w `bidaro-backend/e2e` i uruchamiają ten web:

```bash
cd ../bidaro-backend/e2e && FRONTEND_DIR=../../bidaro-frontend npm test
```

`smoke/` — testy dymne żywej strony (tylko odczyt): `SMOKE_BASE_URL=http://72.61.177.37:9088 npm test --prefix smoke`.

## Wdrożenie

Push do `main` → GitHub Actions: build + lint → E2E → `deploy/deploy.sh` → testy dymne. Sekrety: `.github/SECRETS.md`.
`landing/` — statyczna strona-wizytówka (wdrażana osobno).
