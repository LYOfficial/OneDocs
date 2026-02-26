# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript front end (core app). Key areas include `components/`, `pages/`, `services/`, `store/`, `hooks/`, `utils/`, and `styles/`.
- `src-tauri/`: Tauri (Rust) desktop shell and configuration.
- `docs/`: Static docs/site assets.
- `dist/`: Build output (generated).
- `index.html`, `vite.config.ts`, `tsconfig*.json`: Vite and TypeScript setup.

## Build, Test, and Development Commands
- `npm install`: Install Node dependencies.
- `npm run dev`: Start the Vite web dev server.
- `npm run build`: Type-check (`tsc`) and build the web app.
- `npm run preview`: Preview the production web build.
- `npm run tauri:dev`: Run the desktop app in dev mode (requires Rust + Tauri toolchain).
- `npm run tauri:build`: Build desktop app bundles.

## Coding Style & Naming Conventions
- TypeScript + React with `.tsx` for UI, `.ts` for logic.
- Use 2-space indentation, single quotes, and semicolons (match existing files like `src/main.tsx`).
- Prefer `PascalCase` for React components and `camelCase` for functions/variables.
- Keep CSS in `src/styles/` and reuse existing class naming patterns.

## Testing Guidelines
- No automated test framework is configured in this repo.
- If you add tests, document the framework and add a script in `package.json`.
- For now, validate changes manually:
  - Web UI: `npm run dev`
  - Desktop: `npm run tauri:dev`

## Commit & Pull Request Guidelines
- Commit history shows a mix of `feat:`-style prefixes and simple imperatives (e.g., “Update README”). Either is acceptable; keep messages short and specific.
- PRs should include:
  - A clear summary of changes and the motivation.
  - Steps to validate (commands and expected results).
  - Screenshots or screen recordings for UI changes.
  - Linked issues or feature requests when applicable.

## Configuration & Secrets
- API keys are entered in the app UI; do not hardcode secrets.
- If new env vars are added, document them in `README_EN.md` and keep defaults safe.
