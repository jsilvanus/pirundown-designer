import type { RundownV2, RundownItem, ConnectorDefSchema } from "./rundown-v2.js";
import { z } from "zod";

export interface SpeakerParticipant {
  id: string;
  role: string;
  name?: string;
  title?: string;
  hasName: boolean;
  isRoleOnly: boolean;
}

export interface ServiceMetadata {
  title: string;
  service: string;
  church: string;
  date: string;
  liturgicalEvent?: string;
}

export interface HymnSelection {
  hymn_1?: string;
  hymn_2?: string;
  hymn_3?: string;
  communion_hymns?: string;
  [key: string]: string | undefined;
}

export const LITURGICAL_SECTIONS = [
  "Johdanto",
  "Sana",
  "Rukous",
  "Ehtoollinen",
  "Päätös",
] as const;

export type LiturgicalSection = typeof LITURGICAL_SECTIONS[number] | string;

export interface DesignerState {
  metadata: ServiceMetadata;
  speakers: SpeakerParticipant[];
  hymns: HymnSelection;
  connectors: Record<string, z.infer<typeof ConnectorDefSchema>>;
  preflightFetches: Array<{ connector: string; request: string }>;
  customVariables: Record<string, string | number | boolean>;
  rundown: RundownItem[];
}
