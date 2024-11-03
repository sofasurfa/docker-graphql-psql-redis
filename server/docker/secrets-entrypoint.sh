#!/bin/sh

if [ -f /run/secrets/redis_url ]; then
  export REDIS_URL=$(cat /run/secrets/redis_url)
fi
if [ -f /run/secrets/db_url ]; then
  export DB_URL=$(cat /run/secrets/db_url)
fi
if [ -f /run/secrets/jwt_secret ]; then
  export JWT_SECRET=$(cat /run/secrets/jwt_secret)
fi
 

exec "$@"