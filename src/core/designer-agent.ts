import type { DesignerSessionStore, AgentChatMessage } from "./designer-session.js";
import type { AppConfig } from "../config.js";
import type { RundownItem } from "../schema/rundown-v2.js";

export interface AgentChatResult {
  message: AgentChatMessage;
  actionsExecuted: Array<{
    type: string;
    description: string;
    payload?: unknown;
  }>;
}

export class DesignerAgentHandler {
  constructor(
    private sessionStore: DesignerSessionStore,
    private config: AppConfig,
    private fetchFn: typeof fetch = fetch
  ) {}

  public async handleMessage(prompt: string): Promise<AgentChatResult> {
    const trimmed = prompt.trim();

    // 1. Record user message
    this.sessionStore.addChatMessage({
      role: "user",
      content: trimmed,
    });

    // 2. Attempt to invoke piagent (:3301)
    const piagentResult = await this.tryPiagentChat(trimmed);
    if (piagentResult) {
      const assistantMsg = this.sessionStore.addChatMessage({
        role: "assistant",
        content: piagentResult.content,
        actions: piagentResult.actionsExecuted,
      });
      return {
        message: assistantMsg,
        actionsExecuted: piagentResult.actionsExecuted,
      };
    }

    // 3. Fallback to smart deterministic compiler
    const deterministic = this.compileDeterministically(trimmed);
    const assistantMsg = this.sessionStore.addChatMessage({
      role: "assistant",
      content: deterministic.content,
      actions: deterministic.actionsExecuted,
    });

    return {
      message: assistantMsg,
      actionsExecuted: deterministic.actionsExecuted,
    };
  }

  private async tryPiagentChat(
    prompt: string
  ): Promise<{ content: string; actionsExecuted: Array<{ type: string; description: string; payload?: unknown }> } | null> {
    const url = `${this.config.piagentUrl || "http://127.0.0.1:3301"}/api/v1/agents/rundown-designer/chat`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await this.fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) return null;

      const data = (await res.json()) as {
        response?: string;
        toolCallsExecuted?: Array<{ tool: string; args: unknown; result: unknown }>;
      };

      if (!data.response) return null;

      const actionsExecuted = (data.toolCallsExecuted || []).map((tc) => ({
        type: tc.tool,
        description: `Suoritettu työkalu: ${tc.tool}`,
        payload: tc.args,
      }));

      return {
        content: data.response,
        actionsExecuted,
      };
    } catch {
      // piagent not running or timed out; seamless fallback
      return null;
    }
  }

  private compileDeterministically(prompt: string): {
    content: string;
    actionsExecuted: Array<{ type: string; description: string; payload?: unknown }>;
  } {
    const lower = prompt.toLowerCase();
    const actionsExecuted: Array<{ type: string; description: string; payload?: unknown }> = [];
    const snapshot = this.sessionStore.getSnapshot();

    // 1. Graphics options & TargetZone setup (e.g. for Sermon / Saarna)
    if (
      (lower.includes("saarna") || lower.includes("sermon")) &&
      (lower.includes("grafiik") || lower.includes("pulpit") || lower.includes("lowerthird") || lower.includes("lower-third") || lower.includes("overlay"))
    ) {
      const sermonItem = snapshot.state.rundown.find(
        (i) => i.id === "saarna" || (i.title && i.title.toLowerCase().includes("saarna"))
      );

      if (sermonItem && sermonItem.id) {
        const patch = {
          ai: {
            targetZone: "pulpit",
            graphicsOptions: {
              lowerThird: ["lower-third-speaker"],
              overlay: ["scripture-reading"],
            },
          },
        };
        this.sessionStore.updateItem(sermonItem.id, patch);

        actionsExecuted.push({
          type: "designer_update_item",
          description: `Päivitettiin saarnakohtaan (${sermonItem.title}) targetZone: 'pulpit' ja grafiikkavalinnat: lowerThird: ['lower-third-speaker'], overlay: ['scripture-reading']`,
          payload: { id: sermonItem.id, patch },
        });

        return {
          content: `Lisäsin kohtaan **${sermonItem.title}** AI-ohjausvyöhykkeeksi **pulpit** (saarnatuoli) sekä sallitut grafiikkapohjat: alokolmanneksen puhujanimistrapille (\`lower-third-speaker\`) ja raamatunkohtapeitteelle (\`scripture-reading\`).`,
          actionsExecuted,
        };
      }
    }

    // 2. Reading / Scripture ambo setup
    if (
      (lower.includes("tekstinluku") || lower.includes("lukukappale") || lower.includes("raamattu") || lower.includes("epistola")) &&
      (lower.includes("ambo") || lower.includes("grafiik") || lower.includes("overlay"))
    ) {
      const readingItem = snapshot.state.rundown.find(
        (i) =>
          (i.id && (i.id.includes("luku") || i.id.includes("epistola"))) ||
          (i.title && i.title.toLowerCase().includes("luku"))
      );

      if (readingItem && readingItem.id) {
        const patch = {
          ai: {
            targetZone: "ambo",
            graphicsOptions: {
              lowerThird: ["lower-third-speaker"],
              overlay: ["scripture-reading"],
            },
          },
        };
        this.sessionStore.updateItem(readingItem.id, patch);

        actionsExecuted.push({
          type: "designer_update_item",
          description: `Päivitettiin lukukohtaan (${readingItem.title}) targetZone: 'ambo' ja overlay: ['scripture-reading']`,
          payload: { id: readingItem.id, patch },
        });

        return {
          content: `Määritin kohtaan **${readingItem.title}** kameravyöhykkeeksi **ambo** (lukupulpetti) sekä raamatunkohtapeitteen (\`scripture-reading\`).`,
          actionsExecuted,
        };
      }
    }

    // 3. Set Hymns (e.g. "Aseta virret 332, 450, 228" or "Virret 123, 456")
    const hymnNumbersMatch = prompt.match(/\b(?:virsi|virret|virsiksi)\b[^0-9]*([0-9]+(?:[\s,]+[0-9]+)*)/i);
    if (hymnNumbersMatch && (lower.includes("aseta") || lower.includes("valitse") || lower.includes("vaihda") || lower.includes("päivitä") || lower.startsWith("virret"))) {
      const numbers = hymnNumbersMatch[1]!
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (numbers.length > 0) {
        const newHymns: Record<string, string> = {};
        for (const [k, v] of Object.entries(snapshot.state.hymns)) {
          if (v !== undefined) newHymns[k] = v;
        }
        numbers.forEach((num, idx) => {
          newHymns[`hymn_${idx + 1}`] = num;
        });

        this.sessionStore.setHymns(newHymns);

        actionsExecuted.push({
          type: "designer_set_metadata",
          description: `Päivitettiin virsivalinnat: ${numbers.join(", ")}`,
          payload: { hymns: newHymns },
        });

        return {
          content: `Päivitin virsivalinnat: ${numbers.map((n, i) => `Virsi ${i + 1}: **${n}**`).join(", ")}. Muutokset heijastuvat esitarkistusmuuttujiin ja ajolistan viittauksiin.`,
          actionsExecuted,
        };
      }
    }

    // 4. Add a new item to a section (e.g. "Lisää virsi 450 osioon Johdanto" or "Lisää esirukous osioon Sana")
    if (lower.startsWith("lisää") || lower.includes("luo uusi")) {
      let targetSection = "Johdanto";
      if (lower.includes("sana")) targetSection = "Sana";
      else if (lower.includes("rukous")) targetSection = "Rukous";
      else if (lower.includes("ehtoollinen")) targetSection = "Ehtoollinen";
      else if (lower.includes("päätös") || lower.includes("paatos")) targetSection = "Päätös";

      // Check if adding hymn
      const hymnAddMatch = prompt.match(/virsi\s*([0-9]+)/i);
      if (hymnAddMatch) {
        const hNum = hymnAddMatch[1];
        const newItem: RundownItem = {
          id: `virsi_${hNum}_${Date.now().toString(36).substring(4)}`,
          title: `Virsi ${hNum}`,
          section: targetSection,
          notes: `Seurakunta veisaa virren ${hNum}.`,
          cue: {
            type: "sound",
            mode: "next",
            event: "music_start",
          },
          actions: [
            {
              graphic: {
                template: "lower-third-hymn",
                action: "show",
              },
            },
          ],
          ai: {
            targetZone: "congregation",
            graphicsOptions: {
              lowerThird: ["lower-third-hymn"],
            },
          },
        };

        const added = this.sessionStore.addItem(newItem, targetSection);

        actionsExecuted.push({
          type: "designer_add_item",
          description: `Lisättiin ${added.title} osioon ${targetSection}`,
          payload: added,
        });

        return {
          content: `Lisäsin kohdan **Virsi ${hNum}** osioon **${targetSection}** musiikkialoitushedelmin sekä virrenalokolmanneksen (\`lower-third-hymn\`) esityksellä.`,
          actionsExecuted,
        };
      }

      // Check if adding prayer or intercession
      if (lower.includes("esirukous") || lower.includes("rukous")) {
        const actualSection = targetSection === "Johdanto" ? "Sana" : targetSection;
        const newItem: RundownItem = {
          id: `esirukous_${Date.now().toString(36).substring(4)}`,
          title: "Yhteinen esirukous",
          section: actualSection,
          notes: "Seurakunnan yhteinen esirukous.",
          cue: {
            type: "manual",
            mode: "next",
          },
          actions: [
            {
              cam: {
                id: 1,
                preset: "altar_wide",
              },
            },
          ],
          ai: {
            targetZone: "altar",
          },
        };

        const added = this.sessionStore.addItem(newItem, actualSection);

        actionsExecuted.push({
          type: "designer_add_item",
          description: `Lisättiin ${added.title} osioon ${added.section}`,
          payload: added,
        });

        return {
          content: `Lisäsin kohdan **Yhteinen esirukous** osioon **${added.section}** alttarikameran esivalinnalla (\`altar_wide\`).`,
          actionsExecuted,
        };
      }
    }

    // 5. Template loading
    if (lower.includes("lataa") && (lower.includes("pohja") || lower.includes("mallipohja") || lower.includes("messu") || lower.includes("sanajumalanpalvelus"))) {
      let tId = "messu";
      if (lower.includes("sana")) tId = "sanajumalanpalvelus";
      const ok = this.sessionStore.loadTemplate(tId);
      if (ok) {
        actionsExecuted.push({
          type: "designer_load_template",
          description: `Ladattiin mallipohja: ${tId}`,
          payload: { templateId: tId },
        });
        return {
          content: `Latasin mallipohjan **${tId === "messu" ? "Messu (Pääjumalanpalvelus)" : "Sanajumalanpalvelus"}**. Kaikki osiot ja esitarkistusmuuttujat on palautettu ja synkronoitu.`,
          actionsExecuted,
        };
      }
    }

    // 6. Delete item
    if (lower.startsWith("poista") || lower.includes("ota pois")) {
      const targetWord = prompt.replace(/^(?:poista|ota pois)\s+/i, "").trim().toLowerCase();
      const match = snapshot.state.rundown.find(
        (i) => (i.id && i.id.toLowerCase() === targetWord) || (i.title && i.title.toLowerCase().includes(targetWord))
      );

      if (match && match.id) {
        this.sessionStore.deleteItem(match.id);
        actionsExecuted.push({
          type: "designer_delete_item",
          description: `Poistettiin kohta: ${match.title} (${match.id})`,
          payload: { id: match.id },
        });
        return {
          content: `Poistin kohdan **${match.title}** ajolistasta.`,
          actionsExecuted,
        };
      }
    }

    // 7. Validation & Diagnostics Check
    if (lower.includes("tarkista") || lower.includes("validoi") || lower.includes("herät") || lower.includes("varoitus") || lower.includes("kunnossa")) {
      const warnings = snapshot.warnings;
      const valid = snapshot.valid;

      if (!valid) {
        return {
          content: `⚠️ Ajolistassa on syntaksivirheitä:\n${(snapshot.errors || []).map((e) => `- ${e}`).join("\n")}`,
          actionsExecuted,
        };
      }

      if (warnings.length === 0) {
        return {
          content: `✅ Ajolista on täysin eheä! Kaikki ${snapshot.state.rundown.length} kohtaa noudattavat Rundown v2 -skeemaa, eikä määrittelemättömiä muuttujaviittauksia havaittu.`,
          actionsExecuted,
        };
      }

      const warningItems = warnings.map((w) => `- **${w.itemTitle || "Ajolistakohta"}**: Muuttujaa \`\${variables.${w.variable}}\` ei ole määritelty (${w.field})`).join("\n");
      return {
        content: `⚠️ Ajolistassa havaittiin **${warnings.length}** puuttuvaa muuttujaviittausta:\n${warningItems}\n\nVoit korjata nämä lisäämällä puuttuvat muuttujat Perustiedot & Virret -valikosta.`,
        actionsExecuted,
      };
    }

    // 8. Overview / General Query
    const sections = Array.from(new Set(snapshot.state.rundown.map((i) => i.section || "Johdanto")));
    const hymns = Object.entries(snapshot.state.hymns)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    return {
      content: `Ajolistassa on tällä hetkellä **${snapshot.state.rundown.length}** kohtaa jaettuna osioihin: **${sections.join(", ")}**.\n\nValitut virret: ${hymns || "ei asetettu"}.\n\nVoit pyytää minua esimerkiksi:\n- *"Lisää saarnaan pulpit ja grafiikat"*\n- *"Aseta virret 332, 450, 228"*\n- *"Lisää virsi 123 osioon Johdanto"*\n- *"Tarkista herätteet ja muuttujat"*`,
      actionsExecuted,
    };
  }
}
