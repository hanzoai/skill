/**
 * @hanzo/skill — one name for skills: read them, check them, install them.
 *
 * A skill is a directory holding a SKILL.md, optionally with `agents/openai.yaml`
 * and `.skill-meta.json` beside it. This module is the whole surface:
 *
 *   parse/schema/build   the document and its types
 *   registry/source      a set of skills from one or more places
 *   install              putting a skill repository where the agents look
 *
 * The parsing half is runtime-agnostic and browser-safe. Filesystem discovery
 * lives in `./node.js`, which imports node:fs and so cannot be.
 *
 * There was a second package, @hanzo/skills, holding the parsing half. Two names
 * differing only in number is two addresses for one subject, so it is gone.
 */
export * from "./schema.js";
export {
  SkillParseError,
  splitFrontmatter,
  parseSkillDoc,
  parseAgentsFile,
  parseSkillMeta,
  stringifySkillDoc,
  shortDescriptionOf,
  createSkillTemplate,
} from "./parse.js";
export { buildSkill, toMetadata, type BuildSkillInput } from "./build.js";
export {
  recordSource,
  manifestSource,
  type SkillSource,
  type SkillRecord,
  type RecordSourceOptions,
} from "./source.js";
export { Registry, buildManifest, type RegistryOptions } from "./registry.js";
export {
  HANZO_SKILLS_DIR,
  AGENT_SKILL_DIRS,
  normalizeGitUrl,
  extractDirName,
  countSkills,
  symlinkToAgents,
  unlinkFromAgents,
  addSkills,
  removeSkills,
  listSkills,
} from "./install.js";
