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
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono bg-surface-container-highest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors shadow-xs"
          title="Manuaalinen heräte (NEXT)"
        >
          <Hand className="w-3 h-3 text-outline" />
          <span>{compact ? "Man" : "Manuaali (NEXT)"}</span>
          {!compact && <Sliders className="w-2.5 h-2.5 opacity-50 ml-0.5" />}
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
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono bg-violet-500/15 text-violet-200 hover:bg-violet-500/25 transition-colors shadow-xs"
          title={`Puhe: "${cue.phrase}" (${pct})`}
        >
          <Mic className="w-3 h-3 text-violet-300" />
          <span className={`font-sans font-medium text-[11px] truncate ${compact ? "max-w-[130px]" : "max-w-[220px]"}`}>
            "{cue.phrase || "puhetta"}"
          </span>
          <span className="text-[10px] bg-violet-500/30 px-1 py-0.2 rounded font-semibold text-violet-100">
            {pct}
          </span>
          {!compact && <Sliders className="w-2.5 h-2.5 opacity-50 ml-0.5" />}
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
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 transition-colors shadow-xs"
          title="Ääniheräte"
        >
          <Volume2 className="w-3 h-3 text-emerald-300" />
          <span className="font-sans font-medium text-[11px]">{cue.event || "music_stop"}</span>
          {!compact && <Sliders className="w-2.5 h-2.5 opacity-50 ml-0.5" />}
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
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-blue-500/15 text-blue-200 hover:bg-blue-500/25 transition-colors shadow-xs"
      >
        <Mic className="w-3 h-3 text-blue-300" />
        <span className="font-sans text-[11px]">{cue.type}</span>
      </button>
    );
  };

  // Render individual action item badge
  const renderActionBadge = (action: any, actionIdx: number, compact = false) => {
    let icon = <Sliders className="w-3 h-3" />;
    let text = "toiminto";
    let bg = "bg-surface-container-highest text-on-surface-variant";

    if (typeof action === "string") {
      text = action;
    } else if ("cam" in action) {
      icon = <Video className="w-3 h-3 text-sky-400" />;
      text = `Cam ${action.cam.id}:${action.cam.preset || "ptz"}`;
      bg = "bg-sky-500/15 text-sky-200";
    } else if ("switch" in action || "atem" in action) {
      icon = <MonitorPlay className="w-3 h-3 text-rose-400" />;
      const sw = action.switch || action.atem;
      if (sw.cut !== undefined) text = `Cut ${sw.cut}`;
      else if (sw.dsk !== undefined) text = `DSK ${sw.dsk} ${sw.state || "toggle"}`;
      else if (sw.auto) text = "AUTO";
      else if (sw.ftb) text = "FTB";
      bg = "bg-rose-500/15 text-rose-200";
    } else if ("graphic" in action) {
      icon = <Tv className="w-3 h-3 text-pink-400" />;
      const g = action.graphic;
      text = `${g.template || "strap"}[${g.role || g.action}]`;
      bg = "bg-pink-500/15 text-pink-200";
    } else if ("pipgm" in action) {
      icon = <Music2 className="w-3 h-3 text-amber-400" />;
      text = `Virsi ${action.pipgm.hymn || action.pipgm.slide}`;
      bg = "bg-amber-500/15 text-amber-200";
    } else if ("var" in action) {
      icon = <Variable className="w-3 h-3 text-purple-400" />;
      const keys = Object.keys(action.var);
      text = `${keys[0]}=${action.var[keys[0]]}`;
      bg = "bg-purple-500/15 text-purple-200";
    }

    return (
      <span
        key={actionIdx}
        className={`group/action inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono shadow-xs ${bg}`}
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
            className="text-outline hover:text-error transition-colors p-0.5 rounded ml-0.5"
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
        className="bg-surface-container/70 hover:bg-surface-container-high/90 px-3 py-2 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer shadow-xs border-l-3 border-outline-variant/40 hover:border-primary group"
      >
        {/* Left: Expand toggle, Hierarchical Number & Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.();
            }}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors shrink-0"
            title="Laajenna kohta"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <span className="flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded-md bg-surface-container-highest text-[11px] font-bold text-primary font-mono shrink-0 shadow-xs">
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

          {/* AI Graphics Indicator Pill */}
          {(item.ai?.targetZone || item.ai?.graphicsOptions) && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowGraphicsModal(true);
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-pink-500/15 text-pink-200 hover:bg-pink-500/25 transition-colors cursor-pointer shadow-xs"
              title="Avaa AI grafiikka-asetukset"
            >
              <Sparkles className="w-2.5 h-2.5 text-pink-300" />
              <span>{item.ai?.targetZone || "grafiikat"}</span>
            </span>
          )}

          <div className="hidden sm:flex items-center gap-1">
            {(item.actions || []).slice(0, 3).map((act, aIdx) => renderActionBadge(act, aIdx, true))}
            {(item.actions || []).length > 3 && (
              <span className="text-[10px] text-outline font-mono bg-surface-container-highest px-1.5 py-0.5 rounded">
                +{item.actions.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Reorder & Delete */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={index === 0}
            className={`p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors ${
              index === 0 ? "opacity-25 cursor-not-allowed" : ""
            }`}
            title="Siirrä ylemmäs"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={index === totalItems - 1}
            className={`p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors ${
              index === totalItems - 1 ? "opacity-25 cursor-not-allowed" : ""
            }`}
            title="Siirrä alemmas"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded text-outline hover:text-error hover:bg-error/15 transition-colors ml-0.5"
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
    <div className="bg-surface-container/85 hover:bg-surface-container-high/70 p-3.5 rounded-xl transition-all flex flex-col gap-2.5 shadow-sm border-l-3 border-primary/50">
      {/* Top Bar: Collapse, Hierarchical Index, ID, Section, Reorder & Delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors shrink-0"
            title="Tiivistä kohta"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <span className="flex items-center justify-center min-w-[32px] h-6 px-1.5 rounded-md bg-surface-container-highest text-xs font-bold text-primary font-mono shrink-0 shadow-xs">
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
            className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-xs border-none"
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
            className={`p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors ${
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
            className={`p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors ${
              index === totalItems - 1 ? "opacity-30 cursor-not-allowed" : ""
            }`}
            title="Siirrä alemmas"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-outline hover:text-error hover:bg-error/15 transition-colors ml-1"
            title="Poista kohta"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Notes Editable Inputs (Borderless with gentle contrast) */}
      <div className="flex flex-col gap-1.5">
        <input
          type="text"
          className="w-full text-xs font-semibold bg-surface-container-lowest/65 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/60 border-none shadow-xs"
          value={item.title}
          onChange={(e) => onUpdate({ ...item, title: e.target.value })}
          placeholder="Kohdan otsikko..."
        />
        <input
          type="text"
          className="w-full text-[11px] italic bg-surface-container-lowest/40 rounded-lg px-2.5 py-1 text-outline focus:outline-none focus:ring-1 focus:ring-primary/40 border-none"
          value={item.notes || ""}
          onChange={(e) => onUpdate({ ...item, notes: e.target.value })}
          placeholder="Muistiinpanot ohjaajalle tai teologiselle avustajalle..."
        />
      </div>

      {/* Bottom Bar: Trigger Badge & Action Palette */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/10 mt-1">
        {/* Cue Trigger & AI Graphics */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-outline font-medium uppercase tracking-wider">Heräte:</span>
            {renderTriggerBadge()}
          </div>

          <button
            type="button"
            onClick={() => setShowGraphicsModal(true)}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-colors shadow-xs ${
              item.ai?.graphicsOptions || item.ai?.targetZone
                ? "bg-pink-500/15 text-pink-200 hover:bg-pink-500/25"
                : "bg-surface-container-highest text-outline hover:text-on-surface"
            }`}
            title="Määritä AI targetZone ja grafiikkojen sallitut listat (graphicsOptions)"
          >
            <Sparkles className="w-3 h-3 text-pink-300" />
            <span>AI Grafiikat</span>
            {item.ai?.targetZone && (
              <span className="text-[10px] font-mono bg-pink-500/30 px-1 rounded text-pink-100">
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
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/15 text-primary hover:bg-primary/25 font-medium transition-colors shadow-xs"
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
