#!/bin/bash

# Wait for MySQL port to be open
while ! nc -z dragonblock_mysql 3306; do
    sleep 1
done

# Wait for the container to be reachable using ping
while ! ping -c 1 dragonblock_mysql &>/dev/null; do
    sleep 1
done

# Continue with the next steps or start your application
echo "Database is ready, starting application..."

python3 app.py