import type { RundownV2, RundownItem, ActionItem, Cue } from "../schema/rundown-v2.js";

export interface VariableWarning {
  variable: string;
  itemId?: string;
  itemTitle?: string;
  field: string;
  message: string;
  suggestion?: string;
}

const SYSTEM_VARIABLES = new Set([
  "section",
  "service",
  "church",
  "date",
  "item_id",
  "item_title",
  "current_time",
  "timestamp",
]);

/**
 * Extracts all {{variable}} patterns from a string.
 */
export function extractInterpolations(text: string): string[] {
  const matches: string[] = [];
  const regex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      matches.push(match[1].trim());
    }
  }
  return matches;
}

/**
 * Recursively inspects a cue structure for variable interpolations.
 */
function extractCueVariables(cue?: Cue): string[] {
  if (!cue) return [];
  const results: string[] = [];

  if ("phrase" in cue && typeof cue.phrase === "string") {
    results.push(...extractInterpolations(cue.phrase));
  }
  if ("pattern" in cue && typeof cue.pattern === "string") {
    results.push(...extractInterpolations(cue.pattern));
  }
  if ("conditions" in cue && Array.isArray(cue.conditions)) {
    for (const c of cue.conditions) {
      results.push(...extractCueVariables(c));
    }
  }
  return results;
}

/**
 * Recursively inspects an action for variable interpolations.
 */
function extractActionVariables(action: ActionItem): Array<{ field: string; variable: string }> {
  const vars: Array<{ field: string; variable: string }> = [];

  if (typeof action === "string") {
    extractInterpolations(action).forEach((v) => vars.push({ field: "action-string", variable: v }));
    return vars;
  }

  if ("pipgm" in action) {
    if (typeof action.pipgm.hymn === "string") {
      extractInterpolations(action.pipgm.hymn).forEach((v) =>
        vars.push({ field: "pipgm.hymn", variable: v })
      );
    }
    if (typeof action.pipgm.slide === "string") {
      extractInterpolations(action.pipgm.slide).forEach((v) =>
        vars.push({ field: "pipgm.slide", variable: v })
      );
    }
  }

  if ("cam" in action) {
    if (typeof action.cam.preset === "string") {
      extractInterpolations(action.cam.preset).forEach((v) =>
        vars.push({ field: "cam.preset", variable: v })
      );
    }
  }

  if ("switch" in action || "atem" in action) {
    const sw = "switch" in action ? action.switch : action.atem;
    ["cut", "preview", "program"].forEach((key) => {
      const val = (sw as any)[key];
      if (typeof val === "string") {
        extractInterpolations(val).forEach((v) => vars.push({ field: `switch.${key}`, variable: v }));
      }
    });
  }

  if ("tally" in action) {
    if (typeof action.tally.cue === "string") {
      extractInterpolations(action.tally.cue).forEach((v) =>
        vars.push({ field: "tally.cue", variable: v })
      );
    }
  }

  if ("graphic" in action) {
    const g = action.graphic;
    ["name", "role", "title", "scripture", "text"].forEach((key) => {
      const val = (g as any)[key];
      if (typeof val === "string") {
        extractInterpolations(val).forEach((v) => vars.push({ field: `graphic.${key}`, variable: v }));
      }
    });
  }

  if ("var" in action) {
    for (const [k, v] of Object.entries(action.var)) {
      if (typeof v === "string") {
        extractInterpolations(v).forEach((varName) =>
          vars.push({ field: `var.${k}`, variable: varName })
        );
      }
    }
  }

  return vars;
}

/**
 * Validates that all {{variable}} references in a RundownV2 document are defined
 * in preflight, connector mappings, system defaults, or preceding var actions.
 */
export function validateVariableInterpolations(doc: RundownV2): VariableWarning[] {
  const warnings: VariableWarning[] = [];
  const definedVars = new Set<string>(SYSTEM_VARIABLES);

  // 1. Preflight variables
  if (doc.preflight?.variables) {
    Object.keys(doc.preflight.variables).forEach((k) => definedVars.add(k));
  }

  // 2. Connector mapping variables
  if (doc.connectors) {
    for (const conn of Object.values(doc.connectors)) {
      if (conn.requests) {
        for (const req of Object.values(conn.requests)) {
          if (req.mappings) {
            for (const map of req.mappings) {
              if (map.variable) {
                definedVars.add(map.variable);
              }
            }
          }
        }
      }
    }
  }

  // Helper to find closest match
  const findSuggestion = (target: string): string | undefined => {
    let bestMatch: string | undefined;
    let minDistance = 3;
    for (const candidate of definedVars) {
      if (candidate.toLowerCase() === target.toLowerCase()) return candidate;
      const dist = levenshtein(target, candidate);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = candidate;
      }
    }
    return bestMatch;
  };

  // 3. Process rundown items sequentially (tracking dynamic vars introduced by `var` actions)
  const inspectItem = (item: RundownItem) => {
    const itemId = item.id || "unnamed";
    const itemTitle = item.title || "";

    // Check notes
    if (item.notes) {
      const noteVars = extractInterpolations(item.notes);
      for (const v of noteVars) {
        if (!definedVars.has(v)) {
          warnings.push({
            variable: v,
            itemId,
            itemTitle,
            field: "notes",
            message: `Määrittelemätön muuttuja "{{${v}}}" kentässä notes kohteessa "${itemTitle || itemId}"`,
            suggestion: findSuggestion(v),
          });
        }
      }
    }

    // Check cue
    if (item.cue) {
      const cueVars = extractCueVariables(item.cue);
      for (const v of cueVars) {
        if (!definedVars.has(v)) {
          warnings.push({
            variable: v,
            itemId,
            itemTitle,
            field: "cue",
            message: `Määrittelemätön muuttuja "{{${v}}}" herätteessä (cue) kohteessa "${itemTitle || itemId}"`,
            suggestion: findSuggestion(v),
          });
        }
      }
    }

    // Check actions
    if (Array.isArray(item.actions)) {
      for (const action of item.actions) {
        const actionVars = extractActionVariables(action);
        for (const { field, variable } of actionVars) {
          if (!definedVars.has(variable)) {
            warnings.push({
              variable,
              itemId,
              itemTitle,
              field,
              message: `Määrittelemätön muuttuja "{{${variable}}}" toiminnossa (${field}) kohteessa "${itemTitle || itemId}"`,
              suggestion: findSuggestion(variable),
            });
          }
        }

        // If this action sets a variable, register it for subsequent items!
        if (typeof action === "object" && action !== null && "var" in action) {
          for (const key of Object.keys(action.var)) {
            definedVars.add(key);
          }
        }
      }
    }

    // Check subitems
    if (item.subitems) {
      for (const sub of item.subitems) {
        inspectItem(sub as unknown as RundownItem);
      }
    }
  };

  for (const item of doc.rundown) {
    inspectItem(item);
  }

  return warnings;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
}
