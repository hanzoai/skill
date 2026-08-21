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

## One name

`@hanzo/skill` reads a skill, checks it, and installs it. There was a second
package, `@hanzo/skills`, holding the reading half; two names differing only in
number are two addresses for one subject, so it was folded in here and deleted.

  skill add <org/repo>     install a skill repository where every agent looks
  skill remove <name>      take it back out, symlinks and all
  skill list               what is installed
  skill validate <dir>     read every SKILL.md under dir with the same parser
                           the loaders use; exit 1 if any cannot be loaded

A repository that ships skills runs `skill validate` in its own CI, so a skill
no agent could load fails there rather than in a catalogue that still counts it.
