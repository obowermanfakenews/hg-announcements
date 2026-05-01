#!/bin/bash
set -e

GITHUB_USER="obowermanfakenews"
REPO="hg-announcements"

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "ERROR: GITHUB_PERSONAL_ACCESS_TOKEN secret is not set."
  exit 1
fi

echo "Adding GitHub remote..."
git remote remove github 2>/dev/null || true
git remote add github "https://${GITHUB_USER}:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/${GITHUB_USER}/${REPO}.git"

echo "Pushing to GitHub..."
git push github main --force

echo ""
echo "Done! Code is now at: https://github.com/${GITHUB_USER}/${REPO}"
echo ""
echo "Next: Go to Railway, open your project, click '+ New Service' > 'GitHub Repo' > select '${REPO}'"
