import React, { useState } from "react";
import type { RundownItemData } from "../types/index.js";
import { CueItemCard } from "./CueItemCard.js";
import { Layers, Plus, Filter } from "lucide-react";

interface SectionListProps {
  rundown: RundownItemData[];
  onUpdateRundown: (updated: RundownItemData[]) => void;
}

const LITURGICAL_SECTIONS = ["Kaikki", "Johdanto", "Sana", "Rukous", "Ehtoollinen", "Päätös"];

export const SectionList: React.FC<SectionListProps> = ({
  rundown,
  onUpdateRundown,
}) => {
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>("Kaikki");

  const handleUpdateItem = (index: number, updatedItem: RundownItemData) => {
    const next = [...rundown];
    next[index] = updatedItem;
    onUpdateRundown(next);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...rundown];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onUpdateRundown(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === rundown.length - 1) return;
    const next = [...rundown];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onUpdateRundown(next);
  };

  const handleDeleteItem = (index: number) => {
    const next = rundown.filter((_, idx) => idx !== index);
    onUpdateRundown(next);
  };

  const handleAddItem = (sectionName: string) => {
    const defaultSection = sectionName === "Kaikki" ? "Johdanto" : sectionName;
    const newItem: RundownItemData = {
      id: `item_${Date.now().toString(36)}`,
      title: "Uusi palveluskohta",
      section: defaultSection,
      notes: "",
      cue: {
        type: "fuzzy",
        phrase: "Tekstin tai puheen heräte",
        threshold: 0.8,
      },
      actions: [{ cam: { id: 1, preset: "altar" } }, { switch: { cut: 1 } }],
    };
    onUpdateRundown([...rundown, newItem]);
  };

  const filteredItems =
    activeSectionFilter === "Kaikki"
      ? rundown.map((item, idx) => ({ item, originalIndex: idx }))
      : rundown
          .map((item, idx) => ({ item, originalIndex: idx }))
          .filter((entry) => (entry.item.section || "").toLowerCase() === activeSectionFilter.toLowerCase());

  return (
    <div className="flex flex-col gap-3">
      {/* Section Filter Pills & Add Item */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-surface-container p-2 rounded-xl border border-outline-variant/15">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <Filter className="w-3.5 h-3.5 text-outline ml-1 shrink-0" />
          {LITURGICAL_SECTIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setActiveSectionFilter(sec)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeSectionFilter === sec
                  ? "bg-primary text-white shadow-sm"
                  : "text-outline hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleAddItem(activeSectionFilter)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 font-semibold transition-colors shrink-0 ml-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Lisää kohta ({activeSectionFilter === "Kaikki" ? "Johdanto" : activeSectionFilter})</span>
        </button>
      </div>

      {/* Cue Items List */}
      <div className="flex flex-col gap-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-surface-container rounded-xl border border-dashed border-outline-variant/30 text-outline text-xs">
            Ei kohtia osiossa "{activeSectionFilter}". Klikkaa "Lisää kohta" yläpuolelta aloittaaksesi.
          </div>
        ) : (
          filteredItems.map(({ item, originalIndex }) => (
            <CueItemCard
              key={item.id || originalIndex}
              item={item}
              index={originalIndex}
              totalItems={rundown.length}
              onUpdate={(updated) => handleUpdateItem(originalIndex, updated)}
              onMoveUp={() => handleMoveUp(originalIndex)}
              onMoveDown={() => handleMoveDown(originalIndex)}
              onDelete={() => handleDeleteItem(originalIndex)}
            />
          ))
        )}
      </div>
    </div>
  );
};
