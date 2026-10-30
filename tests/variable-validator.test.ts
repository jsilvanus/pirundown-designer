import test from "node:test";
import assert from "node:assert/strict";
import { validateVariableInterpolations } from "../src/core/variable-validator.js";
import type { RundownV2 } from "../src/schema/rundown-v2.js";

test("variable-validator: flags undefined variable interpolations in cues and actions", () => {
  const doc: RundownV2 = {
    version: 2,
    title: "Test Rundown",
    preflight: {
      variables: {
        hymn_1: "332",
        preacher: "Pastori Matti",
      },
    },
    rundown: [
      {
        id: "intro",
        title: "Alkuvirsi",
        cue: {
          type: "fuzzy",
          phrase: "Veisaamme virren {{hymn_1}}",
          threshold: 0.8,
        },
        actions: [
          { pipgm: { hymn: "{{hymn_1}}" } },
          { pipgm: { hymn: "{{undefined_hymn_var}}" } }, // Warning expected!
        ],
      },
      {
        id: "saarna",
        title: "Saarna",
        actions: [
          { var: { section: "Saarna", active_speaker: "{{missing_speaker}}" } }, // Warning expected!
          { var: { new_dynamic_var: "active" } },
        ],
      },
      {
        id: "after_var",
        title: "Jälkiosa",
        actions: [
          { switch: { cut: "{{new_dynamic_var}}" } }, // Should NOT flag, was defined in previous var action!
        ],
      },
    ],
  };

  const warnings = validateVariableInterpolations(doc);
  assert.equal(warnings.length, 2);

  const missingHymn = warnings.find((w) => w.variable === "undefined_hymn_var");
  assert.ok(missingHymn);
  assert.equal(missingHymn.itemId, "intro");

  const missingSpeaker = warnings.find((w) => w.variable === "missing_speaker");
  assert.ok(missingSpeaker);
  assert.equal(missingSpeaker.itemId, "saarna");
});
