# Hanzo Skill

## Overview
Install and manage AI agent skills — ~/.hanzo/skills/ as canonical source, symlinked to all agents

## Tech Stack
- **Language**: TypeScript/JavaScript

## Build & Run
```bash
npm install && npm run build
npm test
```

## Structure
```
skill/
  package-lock.json
  package.json
  src/
  tsconfig.json
```

## Key Files
- `package.json` -- Dependencies and scripts

## License

Dual-licensed `MIT OR Apache-2.0` (`LICENSE-MIT`, `LICENSE-APACHE`), at the
user's option. Relicensed from BSD-3-Clause under HIP-0137 "One License"
(`hanzoai/hips`), which standardises original Hanzo work on the dual
permissive pair. The prior BSD copyright line carries forward unchanged
into `LICENSE-MIT`.
