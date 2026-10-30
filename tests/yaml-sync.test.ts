import test from "node:test";
import assert from "node:assert/strict";
import { yamlToState, stateToYaml, designerStateToRundownV2 } from "../src/core/yaml-sync.js";
import { TEMPLATE_MESSU, TEMPLATE_SANAJUMALANPALVELUS } from "../src/core/template-library.js";
import { RundownV2Schema } from "../src/schema/rundown-v2.js";

test("yaml-sync: validates and parses TEMPLATE_MESSU correctly", () => {
  const result = RundownV2Schema.safeParse(TEMPLATE_MESSU);
  assert.equal(result.success, true);
});

test("yaml-sync: round-trip converts between DesignerState and YAML without schema failure", () => {
  const yamlText = stateToYaml({
    metadata: {
      title: "Messu",
      service: "Pääjumalanpalvelus",
      church: "Riihimäen Keskuskirkko",
      date: "2026-11-01",
    },
    speakers: [
      { id: "1", role: "Liturgi", name: "Pastori Matti", title: "Pastori", hasName: true, isRoleOnly: false },
      { id: "2", role: "Tekstinlukija", hasName: false, isRoleOnly: true },
    ],
    hymns: { hymn_1: "332", hymn_2: "450" },
    connectors: {},
    preflightFetches: [],
    customVariables: { custom_note: "Test" },
    rundown: [
      {
        id: "alkusoitto",
        title: "Alkusoitto",
        section: "Johdanto",
        cue: { type: "sound", event: "music_stop" },
        actions: [{ cam: { id: 1, preset: "organ" } }],
      },
    ],
  });

  assert.ok(yamlText.includes("version: 2"));
  assert.ok(yamlText.includes("Riihimäen Keskuskirkko"));

  const parsed = yamlToState(yamlText);
  assert.equal(parsed.valid, true);
  assert.ok(parsed.state);
  assert.equal(parsed.state.metadata.title, "Messu");
  assert.equal(parsed.state.speakers.length, 2);

  // Invariant test: reader is role-only
  const reader = parsed.state.speakers.find((s) => s.role === "Tekstinlukija");
  assert.ok(reader);
  assert.equal(reader.hasName, false);
  assert.equal(reader.isRoleOnly, true);
});

test("templates: all built-in templates conform to RundownV2 schema", () => {
  const messuValidation = RundownV2Schema.safeParse(TEMPLATE_MESSU);
  assert.equal(messuValidation.success, true);

  const sanaValidation = RundownV2Schema.safeParse(TEMPLATE_SANAJUMALANPALVELUS);
  assert.equal(sanaValidation.success, true);
});
