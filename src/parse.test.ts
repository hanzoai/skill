import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseSkillDoc,
  splitFrontmatter,
  stringifySkillDoc,
  parseAgentsFile,
  parseSkillMeta,
  shortDescriptionOf,
  createSkillTemplate,
  SkillParseError,
} from "./parse.js";

const DEV_DOC = `---
name: skill-creator
description: Guide for creating effective skills.
metadata:
  short-description: Create or update a skill
---

# Skill Creator

Body text.
`;

describe("splitFrontmatter", () => {
  it("splits frontmatter from body", () => {
    const { frontmatter, body } = splitFrontmatter(DEV_DOC);
    assert.ok(frontmatter);
    assert.ok(frontmatter.includes("name: skill-creator"));
    assert.equal(body, "# Skill Creator\n\nBody text.");
  });

  it("returns null frontmatter when absent", () => {
    const { frontmatter, body } = splitFrontmatter("# no frontmatter\n");
    assert.equal(frontmatter, null);
    assert.equal(body, "# no frontmatter\n");
  });
});

describe("parseSkillDoc", () => {
  it("parses the nested metadata.short-description block", () => {
    const { frontmatter } = parseSkillDoc(DEV_DOC);
    assert.equal(frontmatter.name, "skill-creator");
    assert.equal(shortDescriptionOf(frontmatter), "Create or update a skill");
  });

  it("keeps app + desktop fields (license, source)", () => {
    const { frontmatter } = parseSkillDoc(
      `---\nname: frontend-design\ndescription: Design things.\nsource: anthropics/skills\nlicense: Apache-2.0\n---\nbody\n`,
    );
    assert.equal(frontmatter.source, "anthropics/skills");
    assert.equal(frontmatter.license, "Apache-2.0");
  });

  it("throws on missing frontmatter", () => {
    assert.throws(() => parseSkillDoc("# nope"), SkillParseError);
  });

  it("throws on missing name", () => {
    assert.throws(
      () => parseSkillDoc(`---\ndescription: no name\n---\nbody\n`),
      /name/,
    );
  });

  it("rejects non-portable names (uppercase / spaces)", () => {
    assert.throws(
      () => parseSkillDoc(`---\nname: Not Portable\ndescription: x\n---\nbody\n`),
      SkillParseError,
    );
  });
});

describe("stringifySkillDoc round-trip", () => {
  it("re-parses to the same frontmatter and body", () => {
    const { frontmatter, body } = parseSkillDoc(DEV_DOC);
    const out = stringifySkillDoc(frontmatter, body);
    const again = parseSkillDoc(out);
    assert.equal(again.frontmatter.name, frontmatter.name);
    assert.equal(again.frontmatter.description, frontmatter.description);
    assert.equal(
      shortDescriptionOf(again.frontmatter),
      "Create or update a skill",
    );
    assert.equal(again.body, body);
  });
});

describe("parseAgentsFile", () => {
  it("parses interface, dependencies and policy", () => {
    const agents = parseAgentsFile(
      `interface:\n  display_name: Skill Creator\n  brand_color: "#7C5CFF"\ndependencies:\n  tools:\n    - type: mcp\n      value: filesystem\npolicy:\n  allow_implicit_invocation: false\n  products:\n    - dev\n`,
    );
    assert.equal(agents.interface?.display_name, "Skill Creator");
    assert.equal(agents.dependencies?.tools[0]?.type, "mcp");
    assert.equal(agents.policy?.allow_implicit_invocation, false);
    assert.deepEqual(agents.policy?.products, ["dev"]);
  });
});

describe("parseSkillMeta", () => {
  it("parses the desktop .skill-meta.json sidecar", () => {
    const meta = parseSkillMeta(
      `{"source":"registry","name":"frontend-design","installedAt":"2026-01-27T18:07:15.552Z","updatedAt":"2026-01-27T18:07:15.552Z"}`,
    );
    assert.equal(meta.source, "registry");
    assert.equal(meta.installedAt, "2026-01-27T18:07:15.552Z");
  });
});

describe("createSkillTemplate", () => {
  it("produces a schema-valid document", () => {
    const doc = createSkillTemplate("My Skill", "Does a thing.");
    const { frontmatter } = parseSkillDoc(doc);
    assert.equal(frontmatter.name, "my-skill");
    assert.equal(frontmatter.description, "Does a thing.");
  });
});
