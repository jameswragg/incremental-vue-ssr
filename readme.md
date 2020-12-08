# RFC/PoC - Incremental Vue SSR

SSR individual Vue components (with CSR hydration) in context of a server-rendered web app. CSR bundles + CSS delivered to browser on-demand.

**NOTE**: This is rough and ready, not for production.

## Setup

```
npm install
npm run start

// open http://0.0.0.0:3000
```

## Vue SFC Components

Individual Vue SFC components are in `src/vue/`

## Server

A [hapi.js](https://hapi.dev/) server.
