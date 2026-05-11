#!/bin/bash
# Auto-pull deploy script for MacBuddyTools
# Checks if remote has new commits, pulls if so

cd /www/wwwroot/MacBuddyTools || exit 1

git fetch origin main --quiet 2>/dev/null

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    git pull origin main --quiet 2>/dev/null
    echo "$(date '+%Y-%m-%d %H:%M:%S') Deployed: $(git log --oneline -1)" >> /www/wwwroot/MacBuddyTools/deploy.log
fi
