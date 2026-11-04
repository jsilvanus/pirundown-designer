import React, { useState } from "react";
import type { RundownItemData, RundownCue } from "../types/index.js";
import { TriggerConfigModal } from "./TriggerConfigModal.js";
import { ActionPaletteModal } from "./ActionPaletteModal.js";
import { GraphicsOptionsModal } from "./GraphicsOptionsModal.js";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Mic,
  Volume2,
  Hand,
  Sliders,
  Plus,
  Video,
  MonitorPlay,
  Tv,
  Music2,
  Variable,
  Radio,
  Repeat,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface CueItemCardProps {
  item: RundownItemData;
  index: number;
  totalItems: number;
  hierarchicalNumber?: string;
  isCollapsed?: boolean;
  availableSections?: string[];
  onToggleCollapse?: () => void;
  onUpdate: (updated: RundownItemData) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export const CueItemCard: React.FC<CueItemCardProps> = ({
  item,
  index,
  totalItems,
  hierarchicalNumber,
  isCollapsed = false,
  availableSections = [],
  onToggleCollapse,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}) => {
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showGraphicsModal, setShowGraphicsModal] = useState(false);

  const displayNum = hierarchicalNumber || String(index + 1);

  const handleUpdateCue = (cue: RundownCue) => {
    onUpdate({ ...item, cue });
  };

  const handleAddAction = (action: any) => {
    const currentActions = Array.isArray(item.actions) ? item.actions : [];
    onUpdate({ ...item, actions: [...currentActions, action] });
  };

  const handleRemoveAction = (actionIdx: number) => {
    const currentActions = Array.isArray(item.actions) ? item.actions : [];
    onUpdate({ ...item, actions: currentActions.filter((_, idx) => idx !== actionIdx) });
  };

  // Render Trigger Summary Badge
  const renderTriggerBadge = (compact = false) => {
    const cue = item.cue;
    if (!cue || cue.type === "manual") {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowTriggerModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono bg-surface-container-high text-outline hover:text-on-surface hover:bg-surface-container-highest border border-outline-variant/30 transition-colors"
          title="Manuaalinen heräte (NEXT)"
        >
          <Hand className="w-3 h-3" />
          <span>{compact ? "Man" : "Manuaali (NEXT)"}</span>
          {!compact && <Sliders className="w-2.5 h-2.5 opacity-60 ml-0.5" />}
        </button>
      );
    }

    if (cue.type === "fuzzy") {
      const pct = cue.threshold !== undefined ? `${Math.round(cue.threshold * 100)}%` : "80%";
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowTriggerModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border border-violet-500/30 transition-colors"
          title={`Puhe: "${cue.phrase}" (${pct})`}
        >
          <Mic className="w-3 h-3 text-violet-400" />
          <span className={`font-sans font-medium text-[11px] truncate ${compact ? "max-w-[130px]" : "max-w-[220px]"}`}>
            "{cue.phrase || "puhetta"}"
          </span>
          <span className="text-[10px] bg-violet-500/30 px-1 py-0.2 rounded font-semibold text-violet-200">
            {pct}
          </span>
          {!compact && <Sliders className="w-2.5 h-2.5 opacity-60 ml-0.5" />}
        </button>
      );
    }

    if (cue.type === "sound") {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowTriggerModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
          title="Ääniheräte"
        >
          <Volume2 className="w-3 h-3 text-emerald-400" />
          <span className="font-sans font-medium text-[11px]">{cue.event || "music_stop"}</span>
          {!compact && <Sliders className="w-2.5 h-2.5 opacity-60 ml-0.5" />}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowTriggerModal(true);
        }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/30 transition-colors"
      >
        <Mic className="w-3 h-3" />
        <span className="font-sans text-[11px]">{cue.type}</span>
      </button>
    );
  };

  // Render individual action item badge
  const renderActionBadge = (action: any, actionIdx: number, compact = false) => {
    let icon = <Sliders className="w-3 h-3" />;
    let text = "toiminto";
    let bg = "bg-surface-container-high text-on-surface-variant";

    if (typeof action === "string") {
      text = action;
    } else if ("cam" in action) {
      icon = <Video className="w-3 h-3 text-blue-400" />;
      text = `Cam ${action.cam.id}:${action.cam.preset || "ptz"}`;
      bg = "bg-blue-500/10 text-blue-300 border-blue-500/25";
    } else if ("switch" in action || "atem" in action) {
      icon = <MonitorPlay className="w-3 h-3 text-red-400" />;
      const sw = action.switch || action.atem;
      if (sw.cut !== undefined) text = `Cut ${sw.cut}`;
      else if (sw.dsk !== undefined) text = `DSK ${sw.dsk} ${sw.state || "toggle"}`;
      else if (sw.auto) text = "AUTO";
      else if (sw.ftb) text = "FTB";
      bg = "bg-red-500/10 text-red-300 border-red-500/25";
    } else if ("graphic" in action) {
      icon = <Tv className="w-3 h-3 text-pink-400" />;
      const g = action.graphic;
      text = `${g.template || "strap"}[${g.role || g.action}]`;
      bg = "bg-pink-500/10 text-pink-300 border-pink-500/25";
    } else if ("pipgm" in action) {
      icon = <Music2 className="w-3 h-3 text-amber-400" />;
      text = `Virsi ${action.pipgm.hymn || action.pipgm.slide}`;
      bg = "bg-amber-500/10 text-amber-300 border-amber-500/25";
    } else if ("tally" in action) {
      icon = <Radio className="w-3 h-3 text-emerald-400" />;
      text = `Tally ${action.tally.unit}[${action.tally.state || action.tally.cue}]`;
      bg = "bg-emerald-500/10 text-emerald-300 border-emerald-500/25";
    } else if ("alternate" in action) {
      icon = <Repeat className="w-3 h-3 text-cyan-400" />;
      text = `Vuorottelu (${action.alternate.interval_sec}s)`;
      bg = "bg-cyan-500/10 text-cyan-300 border-cyan-500/25";
    } else if ("var" in action) {
      icon = <Variable className="w-3 h-3 text-purple-400" />;
      const keys = Object.keys(action.var);
      text = `${keys[0]}=${action.var[keys[0]]}`;
      bg = "bg-purple-500/10 text-purple-300 border-purple-500/25";
    }

    return (
      <span
        key={actionIdx}
        className={`group/action inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono border ${bg}`}
      >
        {icon}
        <span className="font-sans text-[11px] font-medium truncate max-w-[120px]">{text}</span>
        {!compact && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveAction(actionIdx);
            }}
            className="text-outline hover:text-error transition-colors p-0.5 rounded"
            title="Poista toiminto"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </span>
    );
  };

  // --- Render Collapsed View ---
  if (isCollapsed) {
    return (
      <div
        onClick={onToggleCollapse}
        className="bg-surface-container-low/80 hover:bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/15 hover:border-outline-variant/35 transition-all flex items-center justify-between gap-3 cursor-pointer shadow-xs group"
      >
        {/* Left: Expand toggle, Hierarchical Number & Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.();
            }}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors shrink-0"
            title="Laajenna kohta"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <span className="flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded-md bg-surface-container-highest text-[11px] font-bold text-primary font-mono shrink-0">
            {displayNum}
          </span>

          <span className="font-semibold text-xs text-on-surface truncate">
            {item.title}
          </span>

          {item.notes && (
            <span className="text-[11px] text-outline/70 italic truncate hidden md:inline max-w-[160px]">
              — {item.notes}
            </span>
          )}
        </div>

        {/* Middle: Trigger Badge, AI Graphics Badge & Actions summary */}
        <div className="flex items-center gap-2 shrink-0">
          {renderTriggerBadge(true)}

          {/* AI Graphics Options Pill */}
          {(item.ai?.graphicsOptions || item.ai?.targetZone) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowGraphicsModal(true);
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-pink-500/15 text-pink-300 border border-pink-500/30 hover:bg-pink-500/25 transition-colors"
              title={`AI / Grafiikat: Zone=${item.ai?.targetZone || "none"}, LT=${item.ai?.graphicsOptions?.lowerThird?.length || 0}, Overlay=${item.ai?.graphicsOptions?.overlay?.length || 0}`}
            >
              <Sparkles className="w-2.5 h-2.5 text-pink-400" />
              <span>{item.ai?.targetZone || "gfx"}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1">
            {(item.actions || []).slice(0, 3).map((act, idx) => renderActionBadge(act, idx, true))}
            {(item.actions || []).length > 3 && (
              <span className="text-[10px] font-mono text-outline px-1 rounded bg-surface-container-high">
                +{(item.actions || []).length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Right: Reorder & Delete Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className={`p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors ${
              index === 0 ? "opacity-25 cursor-not-allowed" : ""
            }`}
            title="Siirrä ylemmäs"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalItems - 1}
            className={`p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors ${
              index === totalItems - 1 ? "opacity-25 cursor-not-allowed" : ""
            }`}
            title="Siirrä alemmas"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-outline hover:text-error hover:bg-error/10 transition-colors ml-0.5"
            title="Poista kohta"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // --- Render Expanded View ---
  return (
    <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 hover:border-outline-variant/40 transition-all flex flex-col gap-2.5 shadow-sm">
      {/* Top Bar: Collapse, Hierarchical Index, ID, Section, Reorder & Delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors shrink-0"
            title="Tiivistä kohta"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <span className="flex items-center justify-center min-w-[32px] h-6 px-1.5 rounded-md bg-surface-container-highest text-xs font-bold text-primary font-mono shrink-0">
            {displayNum}
          </span>

          <span className="font-mono text-xs text-outline font-medium">#{item.id}</span>

          {/* Section Selector */}
          <select
            value={item.section || "Johdanto"}
            onChange={(e) => {
              if (e.target.value === "__new__") {
                const custom = window.prompt("Syötä uuden osion nimi:", "Uusi osio");
                if (custom && custom.trim().length > 0) {
                  onUpdate({ ...item, section: custom.trim() });
                }
              } else {
                onUpdate({ ...item, section: e.target.value });
              }
            }}
            className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface-container-highest text-on-surface-variant border border-outline-variant/30 hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            title="Vaihda tämän kohdan osiota tai luo uusi osio"
          >
            {(availableSections.length > 0
              ? availableSections
              : ["Johdanto", "Sana", "Rukous", "Ehtoollinen", "Päätös"]
            ).map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
            {!availableSections.includes(item.section || "Johdanto") && item.section && (
              <option value={item.section}>{item.section}</option>
            )}
            <option value="__new__">+ Luo uusi osio...</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className={`p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors ${
              index === 0 ? "opacity-30 cursor-not-allowed" : ""
            }`}
            title="Siirrä ylemmäs"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalItems - 1}
            className={`p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors ${
              index === totalItems - 1 ? "opacity-30 cursor-not-allowed" : ""
            }`}
            title="Siirrä alemmas"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-outline hover:text-error hover:bg-error/10 transition-colors ml-1"
            title="Poista kohta"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Notes Editable Inputs */}
      <div className="flex flex-col gap-1.5">
        <input
          type="text"
          className="w-full text-xs font-semibold bg-surface-container-high border border-outline-variant/25 rounded px-2.5 py-1 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          value={item.title}
          onChange={(e) => onUpdate({ ...item, title: e.target.value })}
          placeholder="Kohdan otsikko..."
        />
        <input
          type="text"
          className="w-full text-[11px] italic bg-surface-container-high/60 border border-outline-variant/15 rounded px-2 py-1 text-outline focus:outline-none focus:ring-1 focus:ring-primary"
          value={item.notes || ""}
          onChange={(e) => onUpdate({ ...item, notes: e.target.value })}
          placeholder="Muistiinpanot ohjaajalle tai teologiselle avustajalle..."
        />
      </div>

      {/* Bottom Bar: Trigger Badge & Action Palette */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/15 mt-1">
        {/* Cue Trigger & AI Graphics */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-outline font-medium uppercase tracking-wider">Heräte:</span>
            {renderTriggerBadge()}
          </div>

          <button
            type="button"
            onClick={() => setShowGraphicsModal(true)}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
              item.ai?.graphicsOptions || item.ai?.targetZone
                ? "bg-pink-500/15 text-pink-300 border-pink-500/35 hover:bg-pink-500/25"
                : "bg-surface-container-high text-outline hover:text-on-surface border-outline-variant/30"
            }`}
            title="Määritä AI targetZone ja grafiikkojen sallitut listat (graphicsOptions)"
          >
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>AI Grafiikat</span>
            {item.ai?.targetZone && (
              <span className="text-[10px] font-mono bg-pink-500/30 px-1 rounded text-pink-200">
                {item.ai.targetZone}
              </span>
            )}
            {item.ai?.graphicsOptions?.lowerThird && (
              <span className="text-[10px] font-mono bg-surface-container px-1 rounded text-outline">
                LT:{item.ai.graphicsOptions.lowerThird.length}
              </span>
            )}
          </button>
        </div>

        {/* Actions list & Add Action Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(item.actions || []).map((action, aIdx) => renderActionBadge(action, aIdx))}
          <button
            type="button"
            onClick={() => setShowActionModal(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
            title="Lisää toiminto tähän kohtaan"
          >
            <Plus className="w-3 h-3" />
            <span>Toiminto</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showTriggerModal && (
        <TriggerConfigModal
          cue={item.cue}
          onSave={handleUpdateCue}
          onClose={() => setShowTriggerModal(false)}
        />
      )}

      {showActionModal && (
        <ActionPaletteModal
          onAddAction={handleAddAction}
          onClose={() => setShowActionModal(false)}
        />
      )}

      {showGraphicsModal && (
        <GraphicsOptionsModal
          itemTitle={item.title}
          ai={item.ai}
          onSave={(ai) => onUpdate({ ...item, ai })}
          onClose={() => setShowGraphicsModal(false)}
        />
      )}
    </div>
  );
};
