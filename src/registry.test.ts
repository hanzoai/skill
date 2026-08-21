import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Registry, buildManifest } from "./registry.js";
import { recordSource, manifestSource } from "./source.js";
import { SKILL_MANIFEST_VERSION } from "./schema.js";

const PLANNING = `---\nname: planning\ndescription: Plan before implementing.\nlicense: MIT\n---\n# Planning\nDecompose the task.\n`;
const ONE_SHOT = `---\nname: one-shot\ndescription: Build in a single pass.\n---\n# One Shot\nGo.\n`;

describe("recordSource + Registry", () => {
  it("lists, gets and loads built-in skills", async () => {
    const registry = new Registry(
      recordSource({ planning: PLANNING, "one-shot": ONE_SHOT }),
    );

    const list = await registry.list();
    assert.deepEqual(list.map((s) => s.id).sort(), ["one-shot", "planning"]);

    const planning = await registry.get("planning");
    assert.equal(planning?.scope, "builtin");
    assert.equal(planning?.license, "MIT");

    const loaded = await registry.load("planning");
    assert.equal(loaded?.isBuiltIn, true);
    assert.equal(loaded?.body, "# Planning\nDecompose the task.");
    assert.equal(loaded?.content, PLANNING);
  });

  it("returns undefined for unknown ids", async () => {
    const registry = new Registry(recordSource({ planning: PLANNING }));
    assert.equal(await registry.get("nope"), undefined);
    assert.equal(await registry.load("nope"), undefined);
  });
});

describe("multi-source dedup", () => {
  const base = recordSource(
    { planning: PLANNING },
    { scope: "system" },
  );
  const override = recordSource(
    { planning: `---\nname: planning\ndescription: Overridden.\n---\nbody\n` },
    { scope: "user" },
  );

  it("first-wins by default", async () => {
    const registry = new Registry([base, override]);
    const planning = await registry.get("planning");
    assert.equal(planning?.description, "Plan before implementing.");
    assert.equal(planning?.scope, "system");
  });

  it("last-wins when configured", async () => {
    const registry = new Registry([base, override], {
      onDuplicate: "last-wins",
    });
    const planning = await registry.get("planning");
    assert.equal(planning?.description, "Overridden.");
    assert.equal(planning?.scope, "user");
  });
});

describe("namespacing", () => {
  it("prefixes ids with the source namespace (dev parity)", async () => {
    const registry = new Registry(
      recordSource({ planning: PLANNING }, { namespace: "acme" }),
    );
    const list = await registry.list();
    assert.equal(list[0]?.id, "acme:planning");
  });
});

describe("manifest round-trip", () => {
  it("builds a manifest and reads it back via manifestSource", async () => {
    // The manifest carries metadata + a `path` per skill; bodies are resolved
    // on demand. This is the exact shape a non-JS runtime (the Rust harness)
    // consumes: read the catalog, fetch a body by path only when needed.
    const manifest = await buildManifest(
      recordSource(
        {
          planning: { content: PLANNING, path: "planning.md" },
          "one-shot": { content: ONE_SHOT, path: "one-shot.md" },
        },
        { scope: "repo" },
      ),
    );
    assert.equal(manifest.version, SKILL_MANIFEST_VERSION);
    assert.equal(manifest.skills.length, 2);
    assert.equal(manifest.skills.every((s) => typeof s.path === "string"), true);

    const bodies: Record<string, string> = {
      "planning.md": PLANNING,
      "one-shot.md": ONE_SHOT,
    };
    const registry = new Registry(
      manifestSource(manifest, async (p) => bodies[p] ?? ""),
    );
    const loaded = await registry.load("planning");
    assert.equal(loaded?.name, "planning");
    assert.equal(loaded?.body, "# Planning\nDecompose the task.");
    assert.equal(loaded?.frontmatter.description, "Plan before implementing.");
  });
});
