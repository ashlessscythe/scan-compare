#!/bin/sh
set -e

node ./node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma
exec node server.js
