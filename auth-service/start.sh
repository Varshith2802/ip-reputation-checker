#!/usr/bin/env sh
set -e

echo "Waiting for MongoDB at ${DB_HOST:-mongodb}:${DB_PORT:-27017} ..."
wait-for-it.sh "${DB_HOST:-mongodb}:${DB_PORT:-27017}" -t 30

echo "Starting FastAPI on 0.0.0.0:8001 ..."
exec uvicorn main:app --host 0.0.0.0 --port 8001

#!/usr/bin/env sh
set -e

echo "Waiting for MongoDB at ${DB_HOST:-mongodb}:${DB_PORT:-27017} ..."
wait-for-it.sh "${DB_HOST:-mongodb}:${DB_PORT:-27017}" -t 30

echo "Starting FastAPI on 0.0.0.0:8001 ..."
exec uvicorn main:app --host 0.0.0.0 --port 8001

