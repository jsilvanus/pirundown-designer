import type { SpeakerParticipant } from "../schema/designer-state.js";

export interface SpeakerStrapData {
  speaker: string;
  title: string;
  role: string;
  hasName: boolean;
  isRoleOnly: boolean;
}

export interface ResolveSpeakerParams {
  role: string;
  name?: string | null;
  title?: string | null;
  defaultParish?: string;
}

/**
 * Creates a normalized SpeakerParticipant, strictly enforcing the invariant:
 * If a person's name is not provided, the item is marked as role-only so lower-thirds only display the role.
 */
export function createSpeakerParticipant(
  role: string,
  name?: string | null,
  title?: string | null,
  id?: string
): SpeakerParticipant {
  const cleanRole = role.trim();
  const cleanName = name ? name.trim() : "";
  const cleanTitle = title ? title.trim() : "";
  const hasName = cleanName.length > 0;

  return {
    id: id || `spk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    role: cleanRole || "Liturgi",
    name: hasName ? cleanName : undefined,
    title: cleanTitle.length > 0 ? cleanTitle : undefined,
    hasName,
    isRoleOnly: !hasName,
  };
}

/**
 * Formats speaker strap bindings adhering strictly to the invariant:
 * If name is absent, ONLY role is displayed as the primary strap text.
 */
export function formatSpeakerStrap(params: ResolveSpeakerParams): SpeakerStrapData {
  const defaultParish = params.defaultParish || "Riihimäen Keskuskirkko";
  const name = params.name?.trim();
  const role = params.role.trim() || "Liturgi";
  const title = params.title?.trim();
  const hasName = Boolean(name && name.length > 0);

  if (hasName && name) {
    return {
      speaker: name,
      title: title || role,
      role,
      hasName: true,
      isRoleOnly: false,
    };
  }

  // Name is not present -> ONLY role can be displayed!
  return {
    speaker: role,
    title: title && title !== role ? title : defaultParish,
    role,
    hasName: false,
    isRoleOnly: true,
  };
}

/**
 * Converts a list of SpeakerParticipants to a dictionary of variables suitable for preflight.variables.
 * E.g., sets `liturgist`, `preacher`, `cantor`, `reader`, and their respective titles,
 * while respecting the role-only invariant.
 */
export function exportSpeakersToVariables(
  speakers: SpeakerParticipant[],
  defaultParish: string = "Riihimäen Keskuskirkko"
): Record<string, string | boolean> {
  const vars: Record<string, string | boolean> = {};

  speakers.forEach((spk) => {
    const roleLower = spk.role.toLowerCase();
    const strap = formatSpeakerStrap({
      role: spk.role,
      name: spk.name,
      title: spk.title,
      defaultParish,
    });

    let rolePrefix = "speaker";
    if (roleLower.includes("saarna")) {
      rolePrefix = "preacher";
    } else if (roleLower.includes("liturg")) {
      rolePrefix = "liturgist";
    } else if (roleLower.includes("kanttor") || roleLower.includes("urkur")) {
      rolePrefix = "cantor";
    } else if (roleLower.includes("lukij") || roleLower.includes("teksti")) {
      rolePrefix = "reader";
    } else {
      rolePrefix = `speaker_${spk.role.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    }

    if (spk.hasName && spk.name) {
      vars[rolePrefix] = spk.name;
      if (spk.title) {
        vars[`${rolePrefix}_title`] = spk.title;
      }
      vars[`${rolePrefix}_is_role_only`] = false;
    } else {
      // Role only! No name variable is exported or set to role
      vars[`${rolePrefix}`] = spk.role;
      if (spk.title) {
        vars[`${rolePrefix}_title`] = spk.title;
      }
      vars[`${rolePrefix}_is_role_only`] = true;
    }

    vars[`${rolePrefix}_role`] = spk.role;
    vars[`${rolePrefix}_strap_line1`] = strap.speaker;
    vars[`${rolePrefix}_strap_line2`] = strap.title;
  });

  return vars;
}

/**
 * Auto-resolves active speaker strap from rundown item context and participant list.
 */
export function resolveSpeakerForCue(
  speakers: SpeakerParticipant[],
  context: { id?: string; title?: string; section?: string; explicitRole?: string },
  defaultParish: string = "Riihimäen Keskuskirkko"
): SpeakerStrapData | null {
  if (speakers.length === 0) return null;

  // 1. Explicit role match
  if (context.explicitRole) {
    const found = speakers.find(
      (s) => s.role.toLowerCase() === context.explicitRole?.toLowerCase()
    );
    if (found) {
      return formatSpeakerStrap({
        role: found.role,
        name: found.name,
        title: found.title,
        defaultParish,
      });
    }
  }

  // 2. Section / ID / Title inference
  const id = (context.id || "").toLowerCase();
  const title = (context.title || "").toLowerCase();
  const section = (context.section || "").toLowerCase();

  const matchRole = (pattern: string): SpeakerParticipant | undefined => {
    return speakers.find((s) => s.role.toLowerCase().includes(pattern));
  };

  if (id.includes("saarna") || title.includes("saarna") || section.includes("sana")) {
    const spk = matchRole("saarna");
    if (spk) return formatSpeakerStrap({ ...spk, defaultParish });
  }

  if (
    id.includes("siunaus") ||
    id.includes("ehtoollinen") ||
    id.includes("rukous") ||
    section.includes("johdanto") ||
    section.includes("päätös")
  ) {
    const spk = matchRole("liturg");
    if (spk) return formatSpeakerStrap({ ...spk, defaultParish });
  }

  if (id.includes("virsi") || id.includes("soitto") || title.includes("musiikki")) {
    const spk = matchRole("kanttor") || matchRole("urkur");
    if (spk) return formatSpeakerStrap({ ...spk, defaultParish });
  }

  if (id.includes("evankeliumi") || id.includes("luku") || title.includes("lukukappale")) {
    const spk = matchRole("teksti") || matchRole("lukij") || matchRole("liturg");
    if (spk) return formatSpeakerStrap({ ...spk, defaultParish });
  }

  // Default to first speaker in registry if present
  const first = speakers[0];
  return formatSpeakerStrap({ ...first, defaultParish });
}
