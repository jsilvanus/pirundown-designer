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

export interface CueItemAction {
  type: string;
  payload: any;
}

export interface RundownCue {
  type: "fuzzy" | "phrase" | "regex" | "sound" | "manual" | "all" | "any";
  phrase?: string;
  threshold?: number;
  caseSensitive?: boolean;
  pattern?: string;
  flags?: string;
  event?: "music_start" | "music_stop" | "speech_start" | "speech_stop" | "silence";
  duration_ms?: number;
  conditions?: RundownCue[];
}

export interface AiGraphicsOptions {
  lowerThird?: string[];
  overlay?: string[];
  templates?: string[];
  [key: string]: any;
}

export interface AiItemInstructions {
  targetZone?: string;
  primarySubject?: string;
  preferredCameras?: Array<number | string>;
  framing?: string;
  pacing?: string;
  instructions?: string;
  graphicsOptions?: AiGraphicsOptions;
  [key: string]: any;
}

export interface RundownItemData {
  id: string;
  title: string;
  section?: string;
  notes?: string;
  ai?: AiItemInstructions;
  cue?: RundownCue;
  actions: any[];
}

export interface VariableWarning {
  variable: string;
  itemId?: string;
  itemTitle?: string;
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResponse {
  valid: boolean;
  errors?: string[];
  warnings: VariableWarning[];
}

export interface LectionaryData {
  holyDayName: string;
  date: string;
  liturgicalColor: string;
  theme: string;
  readings: {
    gospel: { reference: string; text?: string };
    epistle: { reference: string; text?: string };
    oldTestament?: { reference: string; text?: string };
    psalm?: { reference: string; text?: string };
  };
  prayer: string;
}

export interface AgentActionPayload {
  type: string;
  description: string;
  payload?: any;
}

export interface AgentChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  actions?: AgentActionPayload[];
  timestamp: string;
}
