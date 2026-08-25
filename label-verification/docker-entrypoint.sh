#!/bin/sh
set -e

/opt/prisma-cli/node_modules/.bin/prisma migrate deploy --schema /app/prisma/schema.prisma
exec node server.js
