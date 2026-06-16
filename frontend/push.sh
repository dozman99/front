#!/usr/bin/env bash
#
# push.sh — initialize git and push SAS Relay frontend to your GitHub repo.
#
# USAGE:
#   1. Create a FRESH GitHub Personal Access Token (classic or fine-grained)
#      with "repo" / Contents:write scope. Do NOT reuse any token you've
#      pasted into a chat — treat those as compromised and revoke them.
#   2. Run:  bash push.sh
#      You'll be prompted for the token (input hidden). It is used only for
#      this push and is never written to disk.
#
# The remote defaults to the repo below; override by exporting REPO first:
#   REPO="https://github.com/youruser/yourrepo.git" bash push.sh
#
set -euo pipefail

REPO="${REPO:-https://github.com/dozman99/front.git}"
BRANCH="${BRANCH:-main}"

# Strip any embedded credentials from REPO so we can inject the token cleanly.
REPO_HOST_PATH="${REPO#https://}"
REPO_HOST_PATH="${REPO_HOST_PATH#*@}"

read -rp "GitHub username: " GH_USER
read -rsp "GitHub token (input hidden): " GH_TOKEN
echo

if [ -z "${GH_TOKEN}" ]; then
  echo "No token provided. Aborting." >&2
  exit 1
fi

AUTH_REMOTE="https://${GH_USER}:${GH_TOKEN}@${REPO_HOST_PATH}"

if [ ! -d .git ]; then
  git init
  git branch -M "${BRANCH}"
fi

git add -A
git commit -m "SAS Relay frontend: initial build" || echo "Nothing to commit."

# Use a one-shot remote so the token never persists in .git/config.
git push "${AUTH_REMOTE}" "HEAD:${BRANCH}" --force

echo
echo "Done. Pushed to ${REPO} (${BRANCH})."
echo "If this token was only for this push, consider revoking it now."
