import React, { useState, useMemo } from "react";
import type { RundownItemData } from "../types/index.js";
import { CueItemCard } from "./CueItemCard.js";
import {
  Layers,
  Plus,
  Filter,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  FolderOpen,
  FolderPlus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Check,
  X,
} from "lucide-react";

interface SectionListProps {
  rundown: RundownItemData[];
  onUpdateRundown: (updated: RundownItemData[]) => void;
}

const DEFAULT_LITURGICAL_SECTIONS = [
  "Johdanto",
  "Sana",
  "Rukous",
  "Ehtoollinen",
  "Päätös",
];

const COMMON_EXTRA_SECTIONS = [
  "Kaste",
  "Konfirmaatio",
  "Avioliittoon vihkiminen",
  "Hautaan siunaaminen",
  "Yhteislaulut",
  "Musiikkiosuus",
  "Todistukset",
  "Kolehti & Ilmoitukset",
];

interface SectionGroup {
  sectionIndex: number; // 1-based (1, 2, 3...)
  name: string;
  items: Array<{
    item: RundownItemData;
    originalIndex: number;
    itemIndexInSection: number; // 1-based (1, 2, 3...)
    hierarchicalNumber: string; // e.g. "1.1", "1.2", "2.1"
  }>;
}

export const SectionList: React.FC<SectionListProps> = ({
  rundown,
  onUpdateRundown,
}) => {
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>("Kaikki");

  // Track collapsed state for sections and items
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});

  // Add Section Dialog state
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  // Editing Section Name state
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Compute hierarchical groups
  const { sections, allFilterOptions, uniqueSectionNames } = useMemo(() => {
    // Collect all unique sections in order
    const sectionOrder: string[] = [];
    for (const item of rundown) {
      const sec = (item.section || "Muu").trim();
      if (!sectionOrder.includes(sec)) {
        sectionOrder.push(sec);
      }
    }

    // Include standard liturgical sections that might not be in the list yet
    for (const def of DEFAULT_LITURGICAL_SECTIONS) {
      if (!sectionOrder.includes(def) && rundown.some((i) => i.section === def)) {
        sectionOrder.push(def);
      }
    }

    if (sectionOrder.length === 0) {
      sectionOrder.push("Johdanto");
    }

    const groups: SectionGroup[] = [];
    const secCounters: Record<string, number> = {};

    // Group items
    rundown.forEach((item, originalIndex) => {
      const secName = (item.section || "Johdanto").trim();
      let group = groups.find((g) => g.name.toLowerCase() === secName.toLowerCase());

      if (!group) {
        const sectionNum = groups.length + 1;
        group = {
          sectionIndex: sectionNum,
          name: secName,
          items: [],
        };
        groups.push(group);
      }

      secCounters[secName] = (secCounters[secName] || 0) + 1;
      const itemNum = secCounters[secName];
      const hierarchicalNumber = `${group.sectionIndex}.${itemNum}`;

      group.items.push({
        item,
        originalIndex,
        itemIndexInSection: itemNum,
        hierarchicalNumber,
      });
    });

    const filterOptions = ["Kaikki", ...groups.map((g) => g.name)];
    const sectionNames = groups.map((g) => g.name);

    return {
      sections: groups,
      allFilterOptions: filterOptions,
      uniqueSectionNames: sectionNames,
    };
  }, [rundown]);

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
    const defaultSection =
      sectionName === "Kaikki"
        ? sections[0]?.name || "Johdanto"
        : sectionName;

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

  // --- Add Section Handlers ---
  const handleCreateSection = (secName: string) => {
    const trimmed = secName.trim();
    if (!trimmed) return;

    // Create a new section by adding an initial item with this section name
    const newItem: RundownItemData = {
      id: `item_${Date.now().toString(36)}`,
      title: `Uusi kohta (${trimmed})`,
      section: trimmed,
      notes: "",
      cue: {
        type: "fuzzy",
        phrase: "Tekstin heräte",
        threshold: 0.8,
      },
      actions: [{ cam: { id: 1, preset: "altar" } }, { switch: { cut: 1 } }],
    };

    onUpdateRundown([...rundown, newItem]);
    setShowAddSectionModal(false);
    setNewSectionName("");
    setActiveSectionFilter("Kaikki");
  };

  // --- Section Renaming ---
  const handleStartRename = (secName: string) => {
    setEditingSection(secName);
    setRenameValue(secName);
  };

  const handleSaveRename = (oldName: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingSection(null);
      return;
    }

    const next = rundown.map((item) => {
      if ((item.section || "Johdanto").toLowerCase() === oldName.toLowerCase()) {
        return { ...item, section: trimmed };
      }
      return item;
    });

    onUpdateRundown(next);
    if (activeSectionFilter.toLowerCase() === oldName.toLowerCase()) {
      setActiveSectionFilter(trimmed);
    }
    setEditingSection(null);
  };

  // --- Move Entire Section Up/Down ---
  const handleMoveSectionUp = (secIndex: number) => {
    if (secIndex <= 0) return;
    const prevGroup = sections[secIndex - 1];
    const currGroup = sections[secIndex];

    const prevItems = prevGroup.items.map((i) => i.item);
    const currItems = currGroup.items.map((i) => i.item);

    const newRundown: RundownItemData[] = [];
    for (let i = 0; i < sections.length; i++) {
      if (i === secIndex - 1) {
        newRundown.push(...currItems);
      } else if (i === secIndex) {
        newRundown.push(...prevItems);
      } else {
        newRundown.push(...sections[i].items.map((x) => x.item));
      }
    }
    onUpdateRundown(newRundown);
  };

  const handleMoveSectionDown = (secIndex: number) => {
    if (secIndex >= sections.length - 1) return;
    const currGroup = sections[secIndex];
    const nextGroup = sections[secIndex + 1];

    const currItems = currGroup.items.map((i) => i.item);
    const nextItems = nextGroup.items.map((i) => i.item);

    const newRundown: RundownItemData[] = [];
    for (let i = 0; i < sections.length; i++) {
      if (i === secIndex) {
        newRundown.push(...nextItems);
      } else if (i === secIndex + 1) {
        newRundown.push(...currItems);
      } else {
        newRundown.push(...sections[i].items.map((x) => x.item));
      }
    }
    onUpdateRundown(newRundown);
  };

  // --- Delete Section with confirmation ---
  const handleDeleteSection = (secName: string) => {
    const count = rundown.filter(
      (i) => (i.section || "Johdanto").toLowerCase() === secName.toLowerCase()
    ).length;

    if (
      window.confirm(
        `Haluatko varmasti poistaa osion "${secName}" ja sen kaikki ${count} kohtaa?`
      )
    ) {
      const next = rundown.filter(
        (i) => (i.section || "Johdanto").toLowerCase() !== secName.toLowerCase()
      );
      onUpdateRundown(next);
      if (activeSectionFilter.toLowerCase() === secName.toLowerCase()) {
        setActiveSectionFilter("Kaikki");
      }
    }
  };

  // Section collapse toggle
  const toggleSectionCollapse = (secName: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secName]: !prev[secName],
    }));
  };

  // Item collapse toggle
  const toggleItemCollapse = (itemId: string) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Collapse / Expand All
  const collapseAll = () => {
    const allSecs: Record<string, boolean> = {};
    const allIts: Record<string, boolean> = {};
    for (const g of sections) {
      allSecs[g.name] = false;
      for (const i of g.items) {
        allIts[i.item.id] = true;
      }
    }
    setCollapsedSections(allSecs);
    setCollapsedItems(allIts);
  };

  const expandAll = () => {
    setCollapsedSections({});
    setCollapsedItems({});
  };

  // Filter groups
  const displayedSections =
    activeSectionFilter === "Kaikki"
      ? sections
      : sections.filter(
          (s) => s.name.toLowerCase() === activeSectionFilter.toLowerCase()
        );

  return (
    <div className="flex flex-col gap-3">
      {/* Top Filter and Actions Toolbar */}
      <div className="flex items-center justify-between gap-2 bg-surface-container p-2.5 rounded-xl border border-outline-variant/15 select-none min-w-0">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 min-w-0 flex-1">
          <Filter className="w-3.5 h-3.5 text-outline ml-1 shrink-0" />
          {allFilterOptions.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setActiveSectionFilter(sec)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                activeSectionFilter === sec
                  ? "bg-primary text-white shadow-xs"
                  : "text-outline hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Global Expand/Collapse & Section Actions */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <button
            type="button"
            onClick={collapseAll}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors shrink-0"
            title="Tiivistä kaikki kohdat yhdelle riville"
          >
            <ChevronsUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tiivistä</span>
          </button>

          <button
            type="button"
            onClick={expandAll}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors shrink-0"
            title="Laajenna kaikki kohdat"
          >
            <ChevronsDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Laajenna</span>
          </button>

          <div className="h-4 w-px bg-outline-variant/20 mx-0.5 shrink-0" />

          {/* Add Section Button */}
          <button
            type="button"
            onClick={() => setShowAddSectionModal(true)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/25 transition-colors font-medium shrink-0"
            title="Luo uusi osio ajolistaan"
          >
            <FolderPlus className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">+ Lisää osio</span>
            <span className="md:hidden">+ Osio</span>
          </button>

          {/* Add Item Button */}
          <button
            type="button"
            onClick={() => handleAddItem(activeSectionFilter)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 font-semibold transition-colors shrink-0"
            title="Lisää uusi kohta"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Lisää kohta</span>
            <span className="md:hidden">+ Kohta</span>
          </button>
        </div>
      </div>

      {/* Hierarchical Sections & Items List */}
      <div className="flex flex-col gap-4">
        {displayedSections.length === 0 ? (
          <div className="p-8 text-center bg-surface-container rounded-xl border border-dashed border-outline-variant/30 text-outline text-xs">
            Ei kohtia osiossa "{activeSectionFilter}". Klikkaa "Lisää kohta" yläpuolelta aloittaaksesi.
          </div>
        ) : (
          displayedSections.map((group, secIdx) => {
            const isSecCollapsed = Boolean(collapsedSections[group.name]);
            const isEditing = editingSection === group.name;

            return (
              <div
                key={group.name}
                className="flex flex-col gap-2 rounded-2xl bg-surface-container/60 p-3 border border-outline-variant/15 shadow-xs"
              >
                {/* Section Header with Hierarchical Number & Section Controls */}
                <div
                  onClick={() => toggleSectionCollapse(group.name)}
                  className="flex items-center justify-between p-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest cursor-pointer transition-colors select-none gap-2 min-w-0"
                >
                  {/* Left: Collapse, Number, Name, Count */}
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionCollapse(group.name);
                      }}
                      className="p-1 rounded text-outline hover:text-on-surface transition-colors shrink-0"
                    >
                      {isSecCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Section Number Badge e.g. "1", "2" */}
                    <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-primary text-white text-xs font-bold font-mono shadow-xs shrink-0">
                      {group.sectionIndex}
                    </span>

                    {/* Section Title (Editable) */}
                    {isEditing ? (
                      <div
                        className="flex items-center gap-1.5 min-w-0 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(group.name);
                            if (e.key === "Escape") setEditingSection(null);
                          }}
                          autoFocus
                          className="text-xs font-bold bg-surface-container-lowest border border-primary rounded px-2 py-0.5 text-on-surface focus:outline-none min-w-[120px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(group.name)}
                          className="p-1 rounded bg-primary text-white hover:bg-primary/90 shrink-0"
                          title="Tallenna uusi nimi"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSection(null)}
                          className="p-1 rounded text-outline hover:text-on-surface shrink-0"
                          title="Peruuta"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <h3 className="font-bold text-xs sm:text-sm text-on-surface tracking-tight truncate">
                          {group.name}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(group.name);
                          }}
                          className="p-1 rounded text-outline hover:text-primary transition-colors opacity-60 hover:opacity-100 shrink-0"
                          title="Nimeä osio uudelleen"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <span className="text-[10px] font-mono text-outline px-1.5 py-0.5 rounded bg-surface-container shrink-0 hidden sm:inline">
                      {group.items.length} {group.items.length === 1 ? "kohta" : "kohtaa"}
                    </span>
                  </div>

                  {/* Right: Consolidated Action Button Group (Never wraps or overlaps) */}
                  <div
                    className="flex items-center gap-1 shrink-0 bg-surface-container/70 p-0.5 rounded-lg border border-outline-variant/15"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Move Section Up */}
                    <button
                      type="button"
                      onClick={() => handleMoveSectionUp(secIdx)}
                      disabled={secIdx === 0}
                      className={`p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors ${
                        secIdx === 0 ? "opacity-25 cursor-not-allowed" : ""
                      }`}
                      title="Siirrä koko osio ylemmäs"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Section Down */}
                    <button
                      type="button"
                      onClick={() => handleMoveSectionDown(secIdx)}
                      disabled={secIdx === sections.length - 1}
                      className={`p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors ${
                        secIdx === sections.length - 1 ? "opacity-25 cursor-not-allowed" : ""
                      }`}
                      title="Siirrä koko osio alemmas"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Section */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(group.name)}
                      className="p-1 rounded text-outline hover:text-error hover:bg-error/15 transition-colors"
                      title={`Poista osio "${group.name}" ja sen kohdat`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="h-3.5 w-px bg-outline-variant/30 mx-0.5" />

                    {/* Add item directly to this section */}
                    <button
                      type="button"
                      onClick={() => handleAddItem(group.name)}
                      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-primary/15 text-primary hover:bg-primary/25 font-medium transition-colors"
                      title={`Lisää uusi kohta osioon ${group.name}`}
                    >
                      <Plus className="w-3 h-3" />
                      <span className="hidden sm:inline">Lisää kohta</span>
                    </button>
                  </div>
                </div>

                {/* Section Items (Collapsible) */}
                {!isSecCollapsed && (
                  <div className="flex flex-col gap-2 pl-2">
                    {group.items.map(
                      ({ item, originalIndex, hierarchicalNumber }) => (
                        <CueItemCard
                          key={item.id || originalIndex}
                          item={item}
                          index={originalIndex}
                          totalItems={rundown.length}
                          hierarchicalNumber={hierarchicalNumber}
                          availableSections={uniqueSectionNames}
                          isCollapsed={Boolean(collapsedItems[item.id])}
                          onToggleCollapse={() => toggleItemCollapse(item.id)}
                          onUpdate={(updated) => handleUpdateItem(originalIndex, updated)}
                          onMoveUp={() => handleMoveUp(originalIndex)}
                          onMoveDown={() => handleMoveDown(originalIndex)}
                          onDelete={() => handleDeleteItem(originalIndex)}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal / Dialog for Adding a New Section */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container w-full max-w-md rounded-2xl border border-outline-variant/20 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/15 bg-surface-container-high">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-on-surface">
                  Luo uusi osio ajolistaan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="p-1 rounded text-outline hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-outline mb-1.5">
                  Osion nimi
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateSection(newSectionName);
                  }}
                  autoFocus
                  placeholder="Esim. Kaste, Yhteislaulut, Todistukset..."
                  className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="block text-[11px] text-outline mb-1.5 font-medium">
                  Yleisiä toimituksia & osioita:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_EXTRA_SECTIONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleCreateSection(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-primary/20 hover:text-primary text-on-surface border border-outline-variant/20 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 px-4 border-t border-outline-variant/15 bg-surface-container-high flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-outline hover:text-on-surface"
              >
                Peruuta
              </button>
              <button
                type="button"
                onClick={() => handleCreateSection(newSectionName)}
                disabled={!newSectionName.trim()}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium bg-primary text-white transition-all ${
                  !newSectionName.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-primary/90 shadow-xs"
                }`}
              >
                Luo osio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
