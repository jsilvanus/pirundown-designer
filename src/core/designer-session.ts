import { TEMPLATES } from "./template-library.js";
import { stateToYaml, yamlToState, rundownV2ToDesignerState } from "./yaml-sync.js";
import type {
  DesignerState,
  ServiceMetadata,
  SpeakerParticipant,
  HymnSelection,
} from "../schema/designer-state.js";
import type { RundownItem, RundownV2 } from "../schema/rundown-v2.js";
import type { VariableWarning } from "./variable-validator.js";

export interface AgentChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  actions?: Array<{
    type: string;
    description: string;
    payload?: unknown;
  }>;
  timestamp: string;
}

export interface SessionStateSnapshot {
  valid: boolean;
  version: number;
  state: DesignerState;
  yaml: string;
  warnings: VariableWarning[];
  errors?: string[];
  chatHistory: AgentChatMessage[];
}

export class DesignerSessionStore {
  private version = 1;
  private state: DesignerState;
  private yamlText: string;
  private valid = true;
  private warnings: VariableWarning[] = [];
  private errors?: string[];
  private chatHistory: AgentChatMessage[] = [];
  private listeners: Set<() => void> = new Set();

  constructor(initialTemplateId = "messu") {
    const template = TEMPLATES.find((t) => t.id === initialTemplateId) || TEMPLATES[0]!;
    this.state = rundownV2ToDesignerState(template.rundown);
    this.yamlText = stateToYaml(this.state);
    const sync = yamlToState(this.yamlText);
    this.valid = sync.valid;
    this.warnings = sync.warnings;
    this.errors = sync.errors;

    // Welcome message in chat history
    this.chatHistory.push({
      id: "msg_init",
      role: "assistant",
      content:
        "Tervehdys! Olen jumalanpalveluksen ajolistan suunnitteluagentti. Voin auttaa jäsentämään messun osiot, virret, tekstinluvut, kamerakomennot sekä grafiikkamääritykset (kuten pulpit-vyöhykkeet ja nimistrapit). Mitä haluaisit tehdä?",
      timestamp: new Date().toISOString(),
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.version++;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error("Session listener error:", err);
      }
    }
  }

  public getSnapshot(): SessionStateSnapshot {
    return {
      valid: this.valid,
      version: this.version,
      state: JSON.parse(JSON.stringify(this.state)),
      yaml: this.yamlText,
      warnings: [...this.warnings],
      errors: this.errors ? [...this.errors] : undefined,
      chatHistory: [...this.chatHistory],
    };
  }

  public applyYaml(yaml: string): { valid: boolean; errors?: string[]; warnings: VariableWarning[] } {
    const res = yamlToState(yaml);
    if (!res.valid || !res.state) {
      return {
        valid: false,
        errors: res.errors || ["Virheellinen YAML-rakenne"],
        warnings: res.warnings,
      };
    }

    this.state = res.state;
    this.yamlText = yaml;
    this.valid = true;
    this.warnings = res.warnings;
    this.errors = undefined;
    this.notify();

    return {
      valid: true,
      warnings: this.warnings,
    };
  }

  public setState(partial: Partial<DesignerState>): void {
    this.state = {
      ...this.state,
      ...partial,
    };
    this.rebuildYaml();
    this.notify();
  }

  public addItem(item: RundownItem, section?: string, index?: number): RundownItem {
    const newItem: RundownItem = {
      ...item,
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      section: item.section || section || "Johdanto",
    };

    const rundown = [...this.state.rundown];
    if (typeof index === "number" && index >= 0 && index <= rundown.length) {
      rundown.splice(index, 0, newItem);
    } else {
      rundown.push(newItem);
    }

    this.state.rundown = rundown;
    this.rebuildYaml();
    this.notify();
    return newItem;
  }

  public updateItem(id: string, patch: Partial<RundownItem>): RundownItem | null {
    const idx = this.state.rundown.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    const current = this.state.rundown[idx]!;
    const updated: RundownItem = {
      ...current,
      ...patch,
      id: current.id, // Preserve id unless explicitly replaced
    };

    // Deep merge ai options if present
    if (patch.ai) {
      const currentAi = typeof current.ai === "object" ? current.ai : {};
      const patchAi = typeof patch.ai === "object" ? patch.ai : {};
      const currentGfx = typeof (currentAi as any).graphicsOptions === "object" ? (currentAi as any).graphicsOptions : {};
      const patchGfx = typeof (patchAi as any).graphicsOptions === "object" ? (patchAi as any).graphicsOptions : {};

      updated.ai = {
        ...currentAi,
        ...patchAi,
        graphicsOptions: {
          ...currentGfx,
          ...patchGfx,
        },
      } as any;
    }

    this.state.rundown[idx] = updated;
    this.rebuildYaml();
    this.notify();
    return updated;
  }

  public deleteItem(id: string): boolean {
    const initialLen = this.state.rundown.length;
    this.state.rundown = this.state.rundown.filter((i) => i.id !== id);
    if (this.state.rundown.length === initialLen) return false;

    this.rebuildYaml();
    this.notify();
    return true;
  }

  public setMetadata(patch: Partial<ServiceMetadata>): ServiceMetadata {
    this.state.metadata = {
      ...this.state.metadata,
      ...patch,
    };
    this.rebuildYaml();
    this.notify();
    return this.state.metadata;
  }

  public setHymns(hymns: HymnSelection): HymnSelection {
    this.state.hymns = {
      ...this.state.hymns,
      ...hymns,
    };
    this.rebuildYaml();
    this.notify();
    return this.state.hymns;
  }

  public setSpeakers(speakers: SpeakerParticipant[]): SpeakerParticipant[] {
    this.state.speakers = [...speakers];
    this.rebuildYaml();
    this.notify();
    return this.state.speakers;
  }

  public loadTemplate(templateId: string): boolean {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return false;

    this.state = rundownV2ToDesignerState(template.rundown);
    this.rebuildYaml();
    this.notify();
    return true;
  }

  public addChatMessage(msg: Omit<AgentChatMessage, "id" | "timestamp">): AgentChatMessage {
    const fullMsg: AgentChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.chatHistory.push(fullMsg);
    // Limit chat history to last 50 messages
    if (this.chatHistory.length > 50) {
      this.chatHistory = this.chatHistory.slice(-50);
    }
    this.notify();
    return fullMsg;
  }

  private rebuildYaml(): void {
    try {
      this.yamlText = stateToYaml(this.state);
      const sync = yamlToState(this.yamlText);
      this.valid = sync.valid;
      this.warnings = sync.warnings;
      this.errors = sync.errors;
    } catch (err: any) {
      this.valid = false;
      this.errors = [`YAML-sarjallistusvirhe: ${err.message}`];
    }
  }
}
