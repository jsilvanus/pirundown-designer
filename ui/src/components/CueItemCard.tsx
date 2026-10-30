import React, { useState } from "react";
import type { RundownItemData, RundownCue } from "../types/index.js";
import { TriggerConfigModal } from "./TriggerConfigModal.js";
import { ActionPaletteModal } from "./ActionPaletteModal.js";
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
} from "lucide-react";

interface CueItemCardProps {
  item: RundownItemData;
  index: number;
  totalItems: number;
  onUpdate: (updated: RundownItemData) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export const CueItemCard: React.FC<CueItemCardProps> = ({
  item,
  index,
  totalItems,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}) => {
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

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
  const renderTriggerBadge = () => {
    const cue = item.cue;
    if (!cue || cue.type === "manual") {
      return (
        <button
          type="button"
          onClick={() => setShowTriggerModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-surface-container-high text-outline hover:text-on-surface hover:bg-surface-container-highest border border-outline-variant/30 transition-colors"
          title="Klikkaa muokataksesi herätettä"
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Manuaali (NEXT)</span>
          <Sliders className="w-3 h-3 opacity-60 ml-0.5" />
        </button>
      );
    }

    if (cue.type === "fuzzy") {
      const pct = cue.threshold !== undefined ? `${Math.round(cue.threshold * 100)}%` : "80%";
      return (
        <button
          type="button"
          onClick={() => setShowTriggerModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border border-violet-500/30 transition-colors"
          title="Klikkaa muokataksesi puhetunnistusta"
        >
          <Mic className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-sans font-medium text-[11px] truncate max-w-[220px]">
            "{cue.phrase || "puhetta"}"
          </span>
          <span className="text-[10px] bg-violet-500/30 px-1 py-0.2 rounded font-semibold text-violet-200">
            {pct}
          </span>
          <Sliders className="w-3 h-3 opacity-60 ml-0.5" />
        </button>
      );
    }

    if (cue.type === "sound") {
      return (
        <button
          type="button"
          onClick={() => setShowTriggerModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
          title="Klikkaa muokataksesi ääniherätettä"
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-sans font-medium text-[11px]">{cue.event || "music_stop"}</span>
          <Sliders className="w-3 h-3 opacity-60 ml-0.5" />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setShowTriggerModal(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/30 transition-colors"
      >
        <Mic className="w-3.5 h-3.5" />
        <span className="font-sans text-[11px]">{cue.type}</span>
      </button>
    );
  };

  // Render individual action item badge
  const renderActionBadge = (action: any, actionIdx: number) => {
    let icon = <Sliders className="w-3 h-3" />;
    let text = "toiminto";
    let bg = "bg-surface-container-high text-on-surface-variant";

    if (typeof action === "string") {
      text = action;
    } else if ("cam" in action) {
      icon = <Video className="w-3 h-3 text-blue-400" />;
      text = `Cam ${action.cam.id} : ${action.cam.preset || "ptz"}`;
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
      text = `${g.template || "strap"} [${g.role || g.action}]`;
      bg = "bg-pink-500/10 text-pink-300 border-pink-500/25";
    } else if ("pipgm" in action) {
      icon = <Music2 className="w-3 h-3 text-amber-400" />;
      text = `Virsi ${action.pipgm.hymn || action.pipgm.slide}`;
      bg = "bg-amber-500/10 text-amber-300 border-amber-500/25";
    } else if ("tally" in action) {
      icon = <Radio className="w-3 h-3 text-emerald-400" />;
      text = `Tally ${action.tally.unit} [${action.tally.state || action.tally.cue}]`;
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
        className={`group/action inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono border ${bg}`}
      >
        {icon}
        <span className="font-sans text-[11px] font-medium">{text}</span>
        <button
          type="button"
          onClick={() => handleRemoveAction(actionIdx)}
          className="text-outline hover:text-error transition-colors p-0.5 rounded"
          title="Poista toiminto"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </span>
    );
  };

  return (
    <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 hover:border-outline-variant/40 transition-all flex flex-col gap-2.5 shadow-sm">
      {/* Top Bar: Index, ID, Section, Reorder & Delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-container-highest text-[11px] font-bold text-on-surface font-mono">
            {index + 1}
          </span>
          <span className="font-mono text-xs text-outline font-medium">#{item.id}</span>
          {item.section && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface-container-highest text-on-surface-variant">
              {item.section}
            </span>
          )}
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
        {/* Cue Trigger */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-outline font-medium uppercase tracking-wider">Heräte:</span>
          {renderTriggerBadge()}
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
    </div>
  );
};
