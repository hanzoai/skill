/**
 * @hanzo/skill — Manage AI agent skills
 *
 * Canonical directory: ~/.hanzo/skills/
 * Symlinked to: ~/.claude/skills/, ~/.agents/skills/, ~/.cursor/skills/, ~/.hanzo/bot/skills/
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
/** Hanzo canonical skills directory — single source of truth */
export const HANZO_SKILLS_DIR = path.join(os.homedir(), ".hanzo", "skills");
/**
 * Agent directories that receive symlinks from ~/.hanzo/skills/.
 * Every installed skill is symlinked into each agent's skill directory
 * so Claude Code, Cursor, Codex, Openclaw, and Hanzo Bot all see the same skills.
 */
export const AGENT_SKILL_DIRS = [
    path.join(os.homedir(), ".claude", "skills"),
    path.join(os.homedir(), ".agents", "skills"),
    path.join(os.homedir(), ".cursor", "skills"),
    path.join(os.homedir(), ".hanzo", "bot", "skills"),
];
/**
 * Normalize a GitHub URL or shorthand to a full HTTPS clone URL.
 * Accepts: github.com/org/repo, https://github.com/org/repo, org/repo
 */
export function normalizeGitUrl(input) {
    let url = input.trim().replace(/\/+$/, "");
    if (url.startsWith("https://"))
        url = url.slice("https://".length);
    else if (url.startsWith("http://"))
        url = url.slice("http://".length);
    if (!url.includes(".") && url.split("/").length === 2)
        url = `github.com/${url}`;
    if (!url.endsWith(".git"))
        url = `${url}.git`;
    return `https://${url}`;
}
/**
 * Extract a directory name from a git URL.
 * e.g. "github.com/bootnode/skills" -> "bootnode-skills"
 */
export function extractDirName(input) {
    const parts = input.replace(/^https?:\/\//, "").replace(/\.git$/, "").split("/").filter(Boolean);
    if (parts.length >= 2)
        return `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
    return parts[parts.length - 1] || "skills";
}
/** Count SKILL.md files in a directory tree. */
export async function countSkills(dir) {
    let count = 0;
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    if (entries.some((e) => e.isFile() && e.name === "SKILL.md"))
        count++;
    for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith("."))
            continue;
        if (fs.existsSync(path.join(dir, entry.name, "SKILL.md")))
            count++;
        // Check skills/ subdirectory pattern
        const sub = path.join(dir, entry.name, "skills");
        if (fs.existsSync(sub)) {
            try {
                for (const s of await fs.promises.readdir(sub, { withFileTypes: true })) {
                    if (s.isDirectory() && fs.existsSync(path.join(sub, s.name, "SKILL.md")))
                        count++;
                }
            }
            catch { /* ignore */ }
        }
    }
    // Also check root skills/ directory
    const rootSkills = path.join(dir, "skills");
    if (fs.existsSync(rootSkills) && fs.statSync(rootSkills).isDirectory()) {
        try {
            for (const s of await fs.promises.readdir(rootSkills, { withFileTypes: true })) {
                if (s.isDirectory() && !s.name.startsWith(".") && fs.existsSync(path.join(rootSkills, s.name, "SKILL.md"))) {
                    count++;
                }
            }
        }
        catch { /* ignore */ }
    }
    // Count .md skill files (hanzoai/skills pattern: skills/category/*.md)
    for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "skills") {
            const catDir = path.join(dir, entry.name);
            try {
                for (const f of await fs.promises.readdir(catDir, { withFileTypes: true })) {
                    if (f.isFile() && f.name.endsWith(".md") && f.name !== "INDEX.md" && f.name !== "README.md") {
                        count++;
                    }
                }
            }
            catch { /* ignore */ }
        }
    }
    return count;
}
/**
 * Create symlinks from ~/.hanzo/skills/<name> into all agent skill directories.
 * Skips if symlink already correct or a real directory exists.
 */
export async function symlinkToAgents(skillDirName) {
    const source = path.join(HANZO_SKILLS_DIR, skillDirName);
    const linked = [];
    for (const agentDir of AGENT_SKILL_DIRS) {
        const target = path.join(agentDir, skillDirName);
        try {
            await fs.promises.mkdir(agentDir, { recursive: true });
            try {
                const stat = await fs.promises.lstat(target);
                if (stat.isSymbolicLink()) {
                    const existing = await fs.promises.readlink(target);
                    if (existing === source) {
                        linked.push(agentDir);
                        continue;
                    }
                    await fs.promises.unlink(target);
                }
                else {
                    continue; // Real directory — don't clobber
                }
            }
            catch { /* doesn't exist — good */ }
            await fs.promises.symlink(source, target, "dir");
            linked.push(agentDir);
        }
        catch { /* permission errors etc. */ }
    }
    return linked;
}
/** Remove symlinks from agent directories for a given skill name. */
export async function unlinkFromAgents(skillDirName) {
    const source = path.join(HANZO_SKILLS_DIR, skillDirName);
    for (const agentDir of AGENT_SKILL_DIRS) {
        const target = path.join(agentDir, skillDirName);
        try {
            const stat = await fs.promises.lstat(target);
            if (stat.isSymbolicLink() && (await fs.promises.readlink(target)) === source) {
                await fs.promises.unlink(target);
            }
        }
        catch { /* doesn't exist — skip */ }
    }
}
/** Add skills from a GitHub repo. Clone/pull to ~/.hanzo/skills/ and symlink everywhere. */
export async function addSkills(url, opts = {}) {
    const cloneUrl = normalizeGitUrl(url);
    const dirName = extractDirName(url);
    const targetDir = path.join(HANZO_SKILLS_DIR, dirName);
    await fs.promises.mkdir(HANZO_SKILLS_DIR, { recursive: true });
    if (fs.existsSync(targetDir)) {
        if (opts.force) {
            await unlinkFromAgents(dirName);
            await fs.promises.rm(targetDir, { recursive: true, force: true });
        }
        else {
            execSync("git pull --ff-only", { cwd: targetDir, stdio: "inherit" });
            const count = await countSkills(targetDir);
            const linked = await symlinkToAgents(dirName);
            return { dirName, targetDir, count, linked };
        }
    }
    execSync(`git clone --depth 1 ${cloneUrl} ${targetDir}`, { stdio: "inherit" });
    const count = await countSkills(targetDir);
    const linked = await symlinkToAgents(dirName);
    return { dirName, targetDir, count, linked };
}
/** Remove a skill and its symlinks. */
export async function removeSkills(name) {
    const targetDir = path.join(HANZO_SKILLS_DIR, name);
    if (!fs.existsSync(targetDir)) {
        const entries = await fs.promises.readdir(HANZO_SKILLS_DIR, { withFileTypes: true }).catch(() => []);
        const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith("."));
        throw new Error(`Not found: ${name}\nAvailable: ${dirs.map((d) => d.name).join(", ")}`);
    }
    await unlinkFromAgents(name);
    await fs.promises.rm(targetDir, { recursive: true, force: true });
}
/** List installed skill directories. */
export async function listSkills() {
    const results = [];
    try {
        const entries = await fs.promises.readdir(HANZO_SKILLS_DIR, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith(".")) {
                const skillPath = path.join(HANZO_SKILLS_DIR, entry.name);
                const count = await countSkills(skillPath);
                results.push({ name: entry.name, path: skillPath, count });
            }
        }
    }
    catch { /* dir doesn't exist yet */ }
    return results;
}
