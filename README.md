# Tenet Automation

An Outbound Engagement app built on [Lyra UI](https://github.com/davidbauerjr991/lyra-ui) — Vite + React + TypeScript, starting from the Admin UI "With Page Header" template.

## Requirements

Lyra UI must sit **next to** this folder (a sibling), because the app imports it from `../lyra-ui`:

```
GitHub-Local/
├── lyra-ui/
└── tenet-automation/   ← this repo
```

`lyra-ui` needs its own dependencies installed once (`npm install` inside `lyra-ui`).

## Run it (developers)

```
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`, `npm run deploy` (GitHub Pages via `gh-pages`).

## Make changes

Open a Cowork chat on the folder that contains `lyra-ui` and `tenet-automation` and describe what you want. Claude follows the rules in `CLAUDE.md` (sandbox-only builds, Lyra UI component rules) — no terminal needed.

## Publish to GitHub (GitHub Desktop, no terminal)

1. Open **GitHub Desktop**.
2. **File → Add Local Repository…** and choose this `tenet-automation` folder.
3. Click **Publish repository** (top bar). Keep the name `tenet-automation`, choose public/private, and click **Publish Repository**.

Future changes: GitHub Desktop shows them under *Changes* — write a summary, **Commit to main**, then **Push origin**.
