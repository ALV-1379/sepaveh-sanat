#!/bin/sh
set -eu
umask 077
target=${1:?Usage: sh infrastructure/scripts/backup.sh BACKUP_DIRECTORY}
mkdir -p "$target"
temp=$(mktemp -d "$target/.backup.XXXXXX")
trap 'rm -rf "$temp"' EXIT HUP INT TERM
docker compose exec -T db sh -c 'pg_dump --format=custom -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$temp/database.dump"
docker compose exec -T backend tar -C /app/uploads -czf - . > "$temp/uploads.tar.gz"
name="$(date -u +%Y%m%dT%H%M%SZ)-${temp##*.}"
mv "$temp" "$target/$name"
printf '%s\n' "$target/$name"
