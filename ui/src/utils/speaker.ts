import type { SpeakerParticipant } from "../types/index.js";

export interface SpeakerStrapPreview {
  line1: string;
  line2: string;
  role: string;
  hasName: boolean;
  isRoleOnly: boolean;
}

export function computeStrapPreview(
  participant: Partial<SpeakerParticipant>,
  defaultParish: string = "Riihimäen Keskuskirkko"
): SpeakerStrapPreview {
  const role = (participant.role || "Liturgi").trim();
  const name = participant.name?.trim() || "";
  const title = participant.title?.trim() || "";
  const hasName = name.length > 0;

  if (hasName) {
    return {
      line1: name,
      line2: title || role,
      role,
      hasName: true,
      isRoleOnly: false,
    };
  }

  // Invariant: Name is not provided -> ONLY role can be displayed!
  return {
    line1: role,
    line2: title && title !== role ? title : defaultParish,
    role,
    hasName: false,
    isRoleOnly: true,
  };
}
