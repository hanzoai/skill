/**
 * @hanzo/skill — Manage AI agent skills
 *
 * Canonical directory: ~/.hanzo/skills/
 * Symlinked to: ~/.claude/skills/, ~/.agents/skills/, ~/.cursor/skills/, ~/.hanzo/bot/skills/
 */
/** Hanzo canonical skills directory — single source of truth */
export declare const HANZO_SKILLS_DIR: string;
/**
 * Agent directories that receive symlinks from ~/.hanzo/skills/.
 * Every installed skill is symlinked into each agent's skill directory
 * so Claude Code, Cursor, Codex, Openclaw, and Hanzo Bot all see the same skills.
 */
export declare const AGENT_SKILL_DIRS: string[];
/**
 * Normalize a GitHub URL or shorthand to a full HTTPS clone URL.
 * Accepts: github.com/org/repo, https://github.com/org/repo, org/repo
 */
export declare function normalizeGitUrl(input: string): string;
/**
 * Extract a directory name from a git URL.
 * e.g. "github.com/bootnode/skills" -> "bootnode-skills"
 */
export declare function extractDirName(input: string): string;
/** Count SKILL.md files in a directory tree. */
export declare function countSkills(dir: string): Promise<number>;
/**
 * Create symlinks from ~/.hanzo/skills/<name> into all agent skill directories.
 * Skips if symlink already correct or a real directory exists.
 */
export declare function symlinkToAgents(skillDirName: string): Promise<string[]>;
/** Remove symlinks from agent directories for a given skill name. */
export declare function unlinkFromAgents(skillDirName: string): Promise<void>;
/** Add skills from a GitHub repo. Clone/pull to ~/.hanzo/skills/ and symlink everywhere. */
export declare function addSkills(url: string, opts?: {
    force?: boolean;
}): Promise<{
    dirName: string;
    targetDir: string;
    count: number;
    linked: string[];
}>;
/** Remove a skill and its symlinks. */
export declare function removeSkills(name: string): Promise<void>;
/** List installed skill directories. */
export declare function listSkills(): Promise<Array<{
    name: string;
    path: string;
    count: number;
}>>;
