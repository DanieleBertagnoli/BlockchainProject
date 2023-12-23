FROM node:18-bullseye-slim as base

RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        vim \
        build-essential \
        python3 && \
    rm -fr /var/lib/apt/lists/* && \
    rm -rf /etc/apt/sources.list.d/*

RUN npm install --global --quiet npm truffle

EXPOSE 8545
