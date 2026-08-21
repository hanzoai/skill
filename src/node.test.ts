import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scanDir, dirSource } from "./node.js";
import { Registry } from "./registry.js";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, "..", "test", "fixtures");

describe("scanDir over mixed-format fixtures", () => {
  it("discovers every valid SKILL.md and collects the invalid one", async () => {
    const { skills, errors } = await scanDir(FIXTURES, { scope: "repo" });

    const ids = skills.map((s) => s.id).sort();
    assert.deepEqual(ids, ["frontend-design", "planning", "skill-creator"]);

    // one invalid fixture (missing `name`) is reported, not thrown
    assert.equal(errors.length, 1);
    assert.ok(errors[0]?.path.includes("invalid/broken/SKILL.md"));
    assert.match(errors[0]?.message, /name/);
  });

  it("parses dev-style skills (metadata.short-description + agents/openai.yaml)", async () => {
    const { skills } = await scanDir(FIXTURES);
    const creator = skills.find((s) => s.id === "skill-creator");
    assert.equal(creator?.shortDescription, "Create or update a skill");
    assert.equal(creator?.interface?.display_name, "Skill Creator");
    assert.equal(creator?.interface?.brand_color, "#7C5CFF");
    assert.equal(creator?.dependencies?.tools[0]?.type, "mcp");
    assert.equal(creator?.policy?.allow_implicit_invocation, true);
    assert.deepEqual(creator?.policy?.products, ["dev", "app"]);
    // portable relative posix path
    assert.equal(creator?.path, "dev-style/skill-creator/SKILL.md");
  });

  it("parses desktop-style skills (.skill-meta.json + source/license)", async () => {
    const { skills } = await scanDir(FIXTURES);
    const fd = skills.find((s) => s.id === "frontend-design");
    assert.equal(fd?.source, "anthropics/skills");
    assert.equal(fd?.license, "Apache-2.0");
    assert.equal(fd?.meta?.source, "registry");
    assert.equal(fd?.meta?.installedAt, "2026-01-27T18:07:15.552Z");
  });

  it("parses app-style skills (name/description/license)", async () => {
    const { skills } = await scanDir(FIXTURES);
    const planning = skills.find((s) => s.id === "planning");
    assert.equal(planning?.license, "MIT");
    assert.equal(
      planning?.description,
      "Break work into a clear, ordered plan before implementing.",
    );
  });
});

describe("dirSource + Registry", () => {
  it("loads a full skill body through the registry", async () => {
    const registry = new Registry(dirSource(FIXTURES, { scope: "repo" }));
    const loaded = await registry.load("skill-creator");
    assert.equal(loaded?.name, "skill-creator");
    assert.ok(loaded?.body.includes("# Skill Creator"));
    assert.ok(!loaded?.body.includes("---"));
  });

  it("emits a manifest for the fixture tree", async () => {
    const registry = new Registry(dirSource(FIXTURES));
    const manifest = await registry.toManifest();
    assert.equal(manifest.skills.length, 3);
    assert.equal(manifest.skills.every((s) => s.path?.endsWith("SKILL.md")), true);
  });
});
