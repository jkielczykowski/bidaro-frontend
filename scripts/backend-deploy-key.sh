#!/usr/bin/env bash
# Lets this repository's CI read bidaro-backend (where the E2E suite lives) with a read-only deploy key:
# generates a key pair, adds the public key to bidaro-backend (read-only) and stores the private key as
# the BACKEND_DEPLOY_KEY secret here. The key never touches disk outside a temp dir. Safe to re-run.
set -euo pipefail
OWNER=jkielczykowski
TITLE="bidaro-frontend CI (read-only)"
DIR="$(mktemp -d)"
trap 'rm -rf "$DIR"' EXIT

ssh-keygen -q -t ed25519 -N "" -C "$TITLE" -f "$DIR/key"

# Replace an older key with the same title
for id in $(gh api "repos/$OWNER/bidaro-backend/keys" --jq ".[] | select(.title == \"$TITLE\") | .id"); do
  gh api -X DELETE "repos/$OWNER/bidaro-backend/keys/$id" >/dev/null
done
gh api "repos/$OWNER/bidaro-backend/keys" -f title="$TITLE" -f key="$(cat "$DIR/key.pub")" -F read_only=true \
  --jq '"✓ deploy key in bidaro-backend (read_only=" + (.read_only|tostring) + ")"'
gh secret set BACKEND_DEPLOY_KEY -R "$OWNER/bidaro-frontend" < "$DIR/key" && echo "✓ BACKEND_DEPLOY_KEY in bidaro-frontend"
gh secret delete BACKEND_REPO_TOKEN -R "$OWNER/bidaro-frontend" >/dev/null 2>&1 && echo "✓ removed old BACKEND_REPO_TOKEN" || true
