import { parse, stringify } from "yaml";
import { RundownV2Schema, type RundownV2, type RundownItem } from "../schema/rundown-v2.js";
import {
  type DesignerState,
  type SpeakerParticipant,
  type HymnSelection,
  LITURGICAL_SECTIONS,
} from "../schema/designer-state.js";
import {
  createSpeakerParticipant,
  exportSpeakersToVariables,
} from "./speaker-registry.js";
import { validateVariableInterpolations, type VariableWarning } from "./variable-validator.js";

export interface SyncResult {
  valid: boolean;
  doc?: RundownV2;
  state?: DesignerState;
  yaml?: string;
  errors?: string[];
  warnings: VariableWarning[];
}

/**
 * Transforms DesignerState into a validated RundownV2 object.
 */
export function designerStateToRundownV2(state: DesignerState): RundownV2 {
  // 1. Export speaker variables respecting the role-only invariant
  const speakerVars = exportSpeakersToVariables(state.speakers, state.metadata.church);

  // 2. Export hymns (supports arbitrary hymn keys)
  const hymnVars: Record<string, string> = {};
  if (state.hymns) {
    for (const [k, v] of Object.entries(state.hymns)) {
      if (typeof v === "string" && v.trim().length > 0) {
        hymnVars[k] = v.trim();
      }
    }
  }

  // 3. Merge preflight variables
  const preflightVariables = {
    ...speakerVars,
    ...hymnVars,
    ...state.customVariables,
  };

  const doc: RundownV2 = {
    version: 2,
    title: state.metadata.title || "Messu",
    service: state.metadata.service || undefined,
    church: state.metadata.church || "Riihimäen Keskuskirkko",
    date: state.metadata.date || undefined,
    connectors: Object.keys(state.connectors).length > 0 ? state.connectors : undefined,
    preflight: {
      fetch: state.preflightFetches.length > 0 ? state.preflightFetches : undefined,
      variables: Object.keys(preflightVariables).length > 0 ? preflightVariables : undefined,
    },
    rundown: state.rundown,
  };

  return doc;
}

/**
 * Converts a validated RundownV2 document into DesignerState for visual editing.
 */
export function rundownV2ToDesignerState(doc: RundownV2): DesignerState {
  const preflightVars = (doc.preflight?.variables || {}) as Record<string, any>;

  // Extract speakers from variables
  const speakers: SpeakerParticipant[] = [];

  // Check known role keys
  const roleDefinitions = [
    { role: "Liturgi", prefix: "liturgist", alt: "liturgi" },
    { role: "Saarnaaja", prefix: "preacher", alt: "saarnaaja" },
    { role: "Kanttori", prefix: "cantor", alt: "kanttori" },
    { role: "Tekstinlukija", prefix: "reader", alt: "tekstinlukija" },
  ];

  const processedKeys = new Set<string>();

  for (const def of roleDefinitions) {
    const nameVal = preflightVars[def.prefix] ?? preflightVars[def.alt];
    const titleVal = preflightVars[`${def.prefix}_title`] ?? preflightVars[`${def.alt}_title`];
    const isRoleOnlyFlag = preflightVars[`${def.prefix}_is_role_only`] ?? preflightVars[`${def.alt}_is_role_only`];

    if (nameVal !== undefined) {
      processedKeys.add(def.prefix);
      processedKeys.add(def.alt);
      processedKeys.add(`${def.prefix}_title`);
      processedKeys.add(`${def.alt}_title`);
      processedKeys.add(`${def.prefix}_role`);
      processedKeys.add(`${def.prefix}_is_role_only`);
      processedKeys.add(`${def.prefix}_strap_line1`);
      processedKeys.add(`${def.prefix}_strap_line2`);

      const nameStr = String(nameVal).trim();
      const titleStr = titleVal ? String(titleVal).trim() : undefined;
      // If nameStr equals the role itself or isRoleOnlyFlag is true, treat as role-only!
      const isRoleOnly = Boolean(isRoleOnlyFlag) || nameStr.toLowerCase() === def.role.toLowerCase() || nameStr.length === 0;

      speakers.push(
        createSpeakerParticipant(
          def.role,
          isRoleOnly ? undefined : nameStr,
          titleStr,
          `spk_${def.prefix}`
        )
      );
    }
  }

  // Ensure default roles exist if none were populated
  if (speakers.length === 0) {
    speakers.push(createSpeakerParticipant("Liturgi", "Pastori Matti", "Pastori", "spk_liturgist"));
    speakers.push(createSpeakerParticipant("Saarnaaja", "Kirkkoherra Eeva", "Kirkkoherra", "spk_preacher"));
    speakers.push(createSpeakerParticipant("Kanttori", "Kanttori Liisa", "Kanttori", "spk_cantor"));
    speakers.push(createSpeakerParticipant("Tekstinlukija", undefined, undefined, "spk_reader"));
  }

  // Extract hymns (supports dynamic hymn keys)
  const hymns: HymnSelection = {};
  for (const [k, v] of Object.entries(preflightVars)) {
    if (k.startsWith("hymn") || k === "communion_hymns" || k.endsWith("_hymn") || k.startsWith("virsi")) {
      hymns[k] = String(v);
      processedKeys.add(k);
    }
  }

  // Gather custom leftover variables
  const customVariables: Record<string, any> = {};
  for (const [k, v] of Object.entries(preflightVars)) {
    if (!processedKeys.has(k)) {
      customVariables[k] = v;
    }
  }

  return {
    metadata: {
      title: doc.title,
      service: doc.service || "",
      church: doc.church || "Riihimäen Keskuskirkko",
      date: doc.date || "",
    },
    speakers,
    hymns,
    connectors: doc.connectors || {},
    preflightFetches: doc.preflight?.fetch || [],
    customVariables,
    rundown: doc.rundown || [],
  };
}

/**
 * Converts DesignerState to formatted YAML with hierarchical section and item numbering comments.
 */
export function stateToYaml(state: DesignerState): string {
  const doc = designerStateToRundownV2(state);
  const rawYaml = stringify(doc, {
    indent: 2,
    lineWidth: 120,
  });

  if (!state.rundown || state.rundown.length === 0) {
    return rawYaml;
  }

  const lines = rawYaml.split("\n");
  const annotatedLines: string[] = [];
  let itemIdx = 0;
  let currentSection = "";
  let sectionNumber = 0;
  let itemNumberInSection = 0;

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- id:") || (trimmed.startsWith("-") && line.startsWith("  -"))) {
      const currentItem = state.rundown[itemIdx++];
      if (currentItem) {
        const sec = (currentItem.section || "Johdanto").trim();
        if (sec.toLowerCase() !== currentSection.toLowerCase()) {
          currentSection = sec;
          sectionNumber++;
          itemNumberInSection = 0;
          annotatedLines.push(`  # ----------------------------------------`);
          annotatedLines.push(`  # ${sectionNumber}. ${sec}`);
          annotatedLines.push(`  # ----------------------------------------`);
        }
        itemNumberInSection++;
        const hierBadge = `${sectionNumber}.${itemNumberInSection}`;
        if (!line.includes("#")) {
          const titleHint = currentItem.title ? ` ${currentItem.title}` : "";
          line = `${line} # ${hierBadge}${titleHint}`;
        }
      }
    }
    annotatedLines.push(line);
  }

  return annotatedLines.join("\n");
}

/**
 * Validates and converts YAML string into DesignerState with schema & interpolation checks.
 */
export function yamlToState(yamlText: string): SyncResult {
  let parsed: unknown;
  try {
    parsed = parse(yamlText);
  } catch (err: any) {
    return {
      valid: false,
      errors: [`YAML-jäsennysvirhe: ${err.message}`],
      warnings: [],
    };
  }

  const result = RundownV2Schema.safeParse(parsed);
  if (!result.success) {
    const errorDetails = result.error.errors.map(
      (e) => `[${e.path.join(".") || "juuri"}]: ${e.message}`
    );
    return {
      valid: false,
      errors: errorDetails,
      warnings: [],
    };
  }

  const doc = result.data as RundownV2;
  const warnings = validateVariableInterpolations(doc);
  const state = rundownV2ToDesignerState(doc);

  return {
    valid: true,
    doc,
    state,
    yaml: yamlText,
    warnings,
  };
}
