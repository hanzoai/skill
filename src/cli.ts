#!/usr/bin/env node

/**
 * @hanzo/skill CLI
 *
 * Usage:
 *   npx @hanzo/skill add bootnode/skills      Install skills from GitHub
 *   npx @hanzo/skill add hanzoai/skills       Install Hanzo ecosystem skills
 *   npx @hanzo/skill remove bootnode-skills    Remove skills and symlinks
 *   npx @hanzo/skill list                      List installed skills
 *   npx @hanzo/skill                           Show help
 */

import { addSkills, removeSkills, listSkills, HANZO_SKILLS_DIR, AGENT_SKILL_DIRS } from "./index.js"

const BOLD = "\x1b[1m"
const DIM = "\x1b[2m"
const GREEN = "\x1b[32m"
const RED = "\x1b[31m"
const YELLOW = "\x1b[33m"
const CYAN = "\x1b[36m"
const RESET = "\x1b[0m"

function log(msg: string) { console.log(msg) }
function err(msg: string) { console.error(`${RED}error${RESET}: ${msg}`) }

const HELP = `
${BOLD}@hanzo/skill${RESET} — Manage AI agent skills

${DIM}Installs to ~/.hanzo/skills/ and symlinks to all agent directories${RESET}

${BOLD}USAGE${RESET}
  npx @hanzo/skill <command> [options]

${BOLD}COMMANDS${RESET}
  add <repo>       Install skills from a GitHub repository
  remove <name>    Remove an installed skill directory
  list             List all installed skills

${BOLD}EXAMPLES${RESET}
  ${CYAN}npx @hanzo/skill add bootnode/skills${RESET}      ${DIM}# Bootnode blockchain APIs${RESET}
  ${CYAN}npx @hanzo/skill add hanzoai/skills${RESET}       ${DIM}# Full Hanzo ecosystem${RESET}
  ${CYAN}npx @hanzo/skill add luxfi/skills${RESET}         ${DIM}# Lux Cloud APIs${RESET}
  ${CYAN}npx @hanzo/skill remove bootnode-skills${RESET}   ${DIM}# Remove + unlink${RESET}
  ${CYAN}npx @hanzo/skill list${RESET}                     ${DIM}# Show installed${RESET}

${BOLD}AGENT DIRECTORIES${RESET}
  ${DIM}Symlinks are created in:${RESET}
  ~/.claude/skills/     ${DIM}(Claude Code)${RESET}
  ~/.agents/skills/     ${DIM}(Codex, Openclaw)${RESET}
  ~/.cursor/skills/     ${DIM}(Cursor)${RESET}
  ~/.hanzo/bot/skills/  ${DIM}(Hanzo Bot)${RESET}

${DIM}https://hanzo.ai${RESET}
`

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === "help" || command === "--help" || command === "-h") {
    log(HELP)
    return
  }

  if (command === "add") {
    const url = args[1]
    if (!url) { err("Missing repository URL. Usage: npx @hanzo/skill add <org/repo>"); process.exit(1) }
    const force = args.includes("--force")

    log(`\n${BOLD}Adding skills from:${RESET} ${url}`)

    try {
      const result = await addSkills(url, { force })
      log(`\n${GREEN}Skills added successfully.${RESET}`)
      log(`${DIM}Skills found:${RESET} ${result.count}`)
      log(`${DIM}Canonical:${RESET}   ${result.targetDir}`)
      if (result.linked.length > 0) {
        log(`${DIM}Symlinked to:${RESET}`)
        for (const dir of result.linked) {
          log(`  ${DIM}-${RESET} ${dir}/${result.dirName}`)
        }
      }
      log(`\n${DIM}All agents (Claude Code, Cursor, Codex, Openclaw, Hanzo Bot) now see these skills.${RESET}\n`)
    } catch (e) {
      err(String(e instanceof Error ? e.message : e))
      process.exit(1)
    }
    return
  }

  if (command === "remove" || command === "rm") {
    const name = args[1]
    if (!name) { err("Missing skill name. Usage: npx @hanzo/skill remove <name>"); process.exit(1) }

    try {
      log(`Removing ${name}...`)
      await removeSkills(name)
      log(`${GREEN}Skills removed from ~/.hanzo/skills/ and all agent directories.${RESET}\n`)
    } catch (e) {
      err(String(e instanceof Error ? e.message : e))
      process.exit(1)
    }
    return
  }

  if (command === "list" || command === "ls") {
    const skills = await listSkills()
    if (skills.length === 0) {
      log(`\n${DIM}No skills installed.${RESET}`)
      log(`\n${DIM}Install with:${RESET} npx @hanzo/skill add hanzoai/skills\n`)
      return
    }
    log(`\n${BOLD}Installed skills${RESET} ${DIM}(${HANZO_SKILLS_DIR})${RESET}\n`)
    for (const s of skills) {
      log(`  ${BOLD}${s.name}${RESET}  ${DIM}${s.count} skills${RESET}`)
    }
    log(`\n${DIM}Symlinked to ${AGENT_SKILL_DIRS.length} agent directories.${RESET}\n`)
    return
  }

  err(`Unknown command: ${command}`)
  log(HELP)
  process.exit(1)
}

main().catch((e) => { err(String(e)); process.exit(1) })
