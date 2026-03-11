# LLM.md - Hanzo Skill

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
