# Tenet Automation — Claude instructions

Tenet Automation is a Vite + React + TypeScript app for the **Outbound Engagement** product, built on the Lyra UI design system. It consumes `lyra-ui` as a live sibling checkout (`../lyra-ui`, via the `@nicecxone/lyra-ui` alias in `vite.config.ts`) — not a published package.

## Work discipline (Claude)

- Never run `npm install`, builds, or bundlers directly in this mounted folder — copy the repo to your sandbox (exclude `node_modules`/`.git`/`dist`), build and iterate there, and sync only final changed files back here. A sandbox npm install in this folder writes Linux binaries this machine can't run.
- Never write `node_modules`, `dist`, entry files, configs, or temp files into this folder — creating a file here and deleting it later still counts as a violation.
- Never ask the user to run terminal commands.
- Keep context lean: grep/slice big files instead of reading them whole, filter command output through head/grep, compare versions with git diff --stat in the shell, and delegate bulk reading to a subagent — oversized reads slow every later turn in the session.

## Binding UI rules

All UI work in this repo is governed by the Lyra UI rulebooks. Read them (in full, before writing or changing any UI) in the sibling checkout:

- `../lyra-ui/CLAUDE.md`
- `../lyra-ui/CONTRIBUTING.md`
- `../lyra-ui/CLAUDE-INSTRUCTIONS.md` (strict write policy, sandbox-only builds, protected primitives)

Headlines: never hand-roll a button (use `Button`/`ActionIconButton`), compose existing lyra-ui components instead of re-implementing them, use only lyra tokens (never raw hex/Tailwind colors), keep labels in Title Case, and render every page through `AdminShell`.

## Sync check (do this first, every session)

This app depends on a live sibling checkout of `lyra-ui` (see the `@nicecxone/lyra-ui` alias path in `vite.config.ts` — currently `../lyra-ui`), not a versioned package. `.lyra-ui-sync` in this repo's root records the `lyra-ui` commit hash this app was last checked against.

1. Confirm the sibling path from `vite.config.ts`'s alias and check it's a real git repo (`git -C ../lyra-ui rev-parse HEAD`). If it's missing entirely, skip this check silently — don't block on it.
2. Otherwise, diff since last sync: `git -C ../lyra-ui log --oneline "$(cat .lyra-ui-sync)"..HEAD`. Nothing printed means nothing changed — move on.
3. If there are new commits, read `../lyra-ui/PROJECT_SUMMARY.md` for a human-readable description of what changed (grep its `###` headings — it's too large to read whole). Summarize for the user what's new and whether anything in this app looks like it should be migrated to use it (a hand-rolled pattern that a new/changed component now replaces).
4. Ask before migrating anything — don't silently rewrite pages.
5. Whether or not the user chooses to migrate, once they've seen and responded to the new changes, update `.lyra-ui-sync` to `lyra-ui`'s current HEAD hash (`git -C ../lyra-ui rev-parse HEAD`) so the same commits aren't re-flagged next session.

`tailwind.config.js` must keep pulling `theme.extend.colors` from `require("../lyra-ui/tailwind-tokens.cjs")` (spread into `colors`) — never hand-copy the color list (an unconfigured `bg-lyra-*`/`text-lyra-*`/`border-lyra-*` class generates zero CSS with no error).

## GitHub Pages

This is a Vite SPA served from a GitHub Pages *project* page (`https://<user>.github.io/tenet-automation/`). `vite.config.ts` sets `base: "/tenet-automation/"`; `package.json`'s `name` is `tenet-automation`. `npm run deploy` builds and pushes `dist/` to the `gh-pages` branch (then set Settings → Pages to that branch, `/ (root)`). It needs `../lyra-ui` checked out next to this repo, so a CI-based build would have to check lyra-ui out too.

`npm run build` is a plain `vite build`. `npm run typecheck` runs `tsc` — it currently reports 3 pre-existing errors that live inside `../lyra-ui` itself (`admin-shell.tsx`, `list-item.tsx`), none in this repo's own code.

## Structure

- `src/App.tsx` — the app's page: app chrome (`AppHeader` with `appName` "Outbound Engagement", icon `LeftNav`, `ContentArea`) + the `AdminShell` "With Page Header" template (page title "Campaigns") + the dockable "Ask AI" panel.
- `src/main.tsx`, `src/index.css` — entry + lyra token import / base resets.
