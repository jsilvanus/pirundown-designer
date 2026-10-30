import test from "node:test";
import assert from "node:assert/strict";
import {
  createSpeakerParticipant,
  formatSpeakerStrap,
  exportSpeakersToVariables,
  resolveSpeakerForCue,
} from "../src/core/speaker-registry.js";

test("speaker-registry: strictly enforces role-only invariant when name is missing", () => {
  const p1 = createSpeakerParticipant("Tekstinlukija", "");
  assert.equal(p1.hasName, false);
  assert.equal(p1.isRoleOnly, true);
  assert.equal(p1.name, undefined);

  const strap = formatSpeakerStrap({
    role: "Tekstinlukija",
    name: "",
    defaultParish: "Riihimäen Keskuskirkko",
  });
  assert.equal(strap.hasName, false);
  assert.equal(strap.isRoleOnly, true);
  // Main display line MUST be the role itself
  assert.equal(strap.speaker, "Tekstinlukija");
  assert.equal(strap.title, "Riihimäen Keskuskirkko");
});

test("speaker-registry: correctly displays person name when present", () => {
  const p2 = createSpeakerParticipant("Saarnaaja", "Pastori Matti", "Pastori");
  assert.equal(p2.hasName, true);
  assert.equal(p2.isRoleOnly, false);
  assert.equal(p2.name, "Pastori Matti");

  const strap = formatSpeakerStrap({
    role: "Saarnaaja",
    name: "Pastori Matti",
    title: "Pastori",
  });
  assert.equal(strap.hasName, true);
  assert.equal(strap.isRoleOnly, false);
  assert.equal(strap.speaker, "Pastori Matti");
  assert.equal(strap.title, "Pastori");
});

test("speaker-registry: exportSpeakersToVariables produces correct variables for preflight", () => {
  const speakers = [
    createSpeakerParticipant("Liturgi", "Pastori Matti", "Pastori"),
    createSpeakerParticipant("Saarnaaja", "Kirkkoherra Eeva", "Kirkkoherra"),
    createSpeakerParticipant("Tekstinlukija", undefined, undefined), // Role-only!
  ];

  const vars = exportSpeakersToVariables(speakers);
  assert.equal(vars.liturgist, "Pastori Matti");
  assert.equal(vars.liturgist_is_role_only, false);
  assert.equal(vars.preacher, "Kirkkoherra Eeva");
  assert.equal(vars.preacher_is_role_only, false);

  // Invariant test: reader has no name, so it must be marked role-only
  assert.equal(vars.reader, "Tekstinlukija");
  assert.equal(vars.reader_is_role_only, true);
});

test("speaker-registry: resolves speaker for cue items based on section and role", () => {
  const speakers = [
    createSpeakerParticipant("Liturgi", "Pastori Matti", "Pastori"),
    createSpeakerParticipant("Saarnaaja", "Kirkkoherra Eeva", "Kirkkoherra"),
  ];

  const saarnaStrap = resolveSpeakerForCue(speakers, { id: "saarna", title: "Päivän saarna" });
  assert.ok(saarnaStrap);
  assert.equal(saarnaStrap.speaker, "Kirkkoherra Eeva");
  assert.equal(saarnaStrap.role, "Saarnaaja");

  const ehtoollinenStrap = resolveSpeakerForCue(speakers, { id: "ehtoollisrukous", section: "Ehtoollinen" });
  assert.ok(ehtoollinenStrap);
  assert.equal(ehtoollinenStrap.speaker, "Pastori Matti");
  assert.equal(ehtoollinenStrap.role, "Liturgi");
});
