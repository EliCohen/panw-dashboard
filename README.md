# PANW Dashboard (Angular)

An Angular 20 SPA that renders the PANW Group release dashboard with CDK layout helpers and static configuration-driven content.

## Prerequisites
- Node.js 18+
- npm access to fetch packages (install dependencies with `npm install`).

## Scripts
- `npm install` – install dependencies.
- `npm start` – run the dev server at `http://localhost:4200/`.
- `npm run build` – production build to `dist/panw-grop-dashboard`.
- `npm test` – run unit tests (Karma/Jasmine).

## Configuration
Data lives in `src/assets/config.json`. Adjust version metadata, roadmap drops, team initiatives, and birthdays there; the app reloads this file on startup.

## Notes
- This repo was manually scaffolded to mirror Angular CLI defaults because direct registry access may be restricted in some environments. If your network blocks npm/CDN access, configure your npm proxy or offline registry before installing dependencies.