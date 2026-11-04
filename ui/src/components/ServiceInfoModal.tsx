import React, { useState, useEffect } from "react";
import type {
  ServiceMetadata,
  HymnSelection,
  SpeakerParticipant,
} from "../types/index.js";
import { computeStrapPreview } from "../utils/speaker.js";
import {
  Church,
  Calendar,
  Music,
  Users,
  Plus,
  Trash2,
  X,
  ShieldAlert,
  CheckCircle,
  Tv,
  FileText,
  Sliders,
} from "lucide-react";

interface ServiceInfoModalProps {
  metadata: ServiceMetadata;
  hymns: HymnSelection;
  speakers: SpeakerParticipant[];
  onChangeMetadata: (meta: Partial<ServiceMetadata>) => void;
  onChangeHymns: (hymns: HymnSelection) => void;
  onAddSpeaker: () => void;
  onUpdateSpeaker: (id: string, updates: Partial<SpeakerParticipant>) => void;
  onDeleteSpeaker: (id: string) => void;
  onClose: () => void;
}

interface HymnItem {
  id: string;
  key: string;
  label: string;
  value: string;
}

const COMMON_ROLES = [
  "Liturgi",
  "Saarnaaja",
  "Avustava pappi",
  "Kanttori",
  "Urkuri",
  "Tekstinlukija",
  "Avustaja",
];

const DEFAULT_HYMN_LABELS: Record<string, string> = {
  hymn_1: "Alkuvirsi",
  hymn_2: "Päivän virsi",
  hymn_3: "Päätösvirsi",
  communion_hymns: "Ehtoollisvirret",
};

export const ServiceInfoModal: React.FC<ServiceInfoModalProps> = ({
  metadata,
  hymns,
  speakers,
  onChangeMetadata,
  onChangeHymns,
  onAddSpeaker,
  onUpdateSpeaker,
  onDeleteSpeaker,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "speakers">("info");

  // Local state for dynamic hymns list
  const [hymnList, setHymnList] = useState<HymnItem[]>(() => {
    const list: HymnItem[] = [];
    const entries = Object.entries(hymns || {});

    // If no hymns, initialize with default 3 hymns + communion
    if (entries.length === 0) {
      return [
        { id: "hymn_1", key: "hymn_1", label: "Alkuvirsi", value: "332" },
        { id: "hymn_2", key: "hymn_2", label: "Päivän virsi", value: "450" },
        { id: "hymn_3", key: "hymn_3", label: "Päätösvirsi", value: "228" },
        { id: "communion_hymns", key: "communion_hymns", label: "Ehtoollisvirret", value: "227, 230" },
      ];
    }

    // Map existing keys
    for (const [k, v] of entries) {
      list.push({
        id: k,
        key: k,
        label: DEFAULT_HYMN_LABELS[k] || (k.startsWith("hymn_") ? `Virsi ${k.replace("hymn_", "")}` : k),
        value: v || "",
      });
    }

    return list;
  });

  // Sync hymnList to parent HymnSelection
  const syncHymnsToParent = (items: HymnItem[]) => {
    setHymnList(items);
    const result: HymnSelection = {};
    for (const item of items) {
      const cleanKey = item.key.trim();
      if (cleanKey) {
        result[cleanKey] = item.value;
      }
    }
    onChangeHymns(result);
  };

  const handleAddHymn = () => {
    // Generate next key
    let idx = hymnList.length + 1;
    let nextKey = `hymn_${idx}`;
    while (hymnList.some((h) => h.key === nextKey)) {
      idx++;
      nextKey = `hymn_${idx}`;
    }

    const newItem: HymnItem = {
      id: `hymn_${Date.now()}`,
      key: nextKey,
      label: `Virsi ${idx}`,
      value: "",
    };

    syncHymnsToParent([...hymnList, newItem]);
  };

  const handleRemoveHymn = (id: string) => {
    const next = hymnList.filter((h) => h.id !== id);
    syncHymnsToParent(next);
  };

  const handleUpdateHymn = (id: string, updates: Partial<HymnItem>) => {
    const next = hymnList.map((h) => (h.id === id ? { ...h, ...updates } : h));
    syncHymnsToParent(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container w-full max-w-4xl max-h-[92vh] rounded-2xl border border-outline-variant/20 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-outline-variant/15 bg-surface-container-high shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
              <Church className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-on-surface">
                Palveluksen perustiedot, virret & henkilöt
              </h2>
              <p className="text-[11px] text-outline">
                {metadata.title || "Messu"} • {metadata.date || "Ei päivämäärää"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/15 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  activeTab === "info"
                    ? "bg-primary text-white shadow-xs"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Perustiedot & Virret ({hymnList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("speakers")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  activeTab === "speakers"
                    ? "bg-primary text-white shadow-xs"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Henkilöt ({speakers.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors ml-2"
              title="Sulje ikkuna"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "info" ? (
            <div className="space-y-6">
              {/* Basic Info Fields */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-outline uppercase tracking-wider border-b border-outline-variant/10 pb-2">
                  <Church className="w-4 h-4 text-primary" />
                  <span>Jumalanpalveluksen yleistiedot</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium text-outline mb-1">
                      Palveluksen otsikko
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      value={metadata.title}
                      onChange={(e) => onChangeMetadata({ title: e.target.value })}
                      placeholder="Esim. Messu (Pääjumalanpalvelus)"
                    />
                  </div>

                  {/* Liturgical event */}
                  <div>
                    <label className="block text-xs font-medium text-outline mb-1">
                      Liturginen tapahtuma / Teema
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      value={metadata.service || ""}
                      onChange={(e) => onChangeMetadata({ service: e.target.value })}
                      placeholder="Esim. 24. sunnuntai helluntaista"
                    />
                  </div>

                  {/* Church */}
                  <div>
                    <label className="block text-xs font-medium text-outline mb-1">
                      Kirkko / Seurakunta
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      value={metadata.church}
                      onChange={(e) => onChangeMetadata({ church: e.target.value })}
                      placeholder="Riihimäen Keskuskirkko"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-medium text-outline mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>Päivämäärä</span>
                    </label>
                    <input
                      type="date"
                      className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      value={metadata.date || ""}
                      onChange={(e) => onChangeMetadata({ date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Hymns Section */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-amber-400" />
                    <div>
                      <h3 className="text-xs font-semibold text-outline uppercase tracking-wider">
                        Virsivalinnat (Muuttujat järjestelmiin)
                      </h3>
                      <p className="text-[11px] text-outline">
                        Virret viedään automaattisesti preflight-muuttujiksi (esim. <code>{"{{hymn_1}}"}</code>) PiPGM-esitysjärjestelmään ja grafiikoihin.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddHymn}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 font-medium transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Lisää virsi</span>
                  </button>
                </div>

                {/* Hymn items list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {hymnList.map((hymn, idx) => (
                    <div
                      key={hymn.id}
                      className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 flex flex-col gap-2 relative group hover:border-outline-variant/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <input
                            type="text"
                            value={hymn.label}
                            onChange={(e) =>
                              handleUpdateHymn(hymn.id, { label: e.target.value })
                            }
                            className="text-xs font-semibold text-on-surface bg-transparent border-b border-transparent hover:border-outline-variant/40 focus:border-primary focus:outline-none px-1 py-0.5 truncate"
                            placeholder="Virren kuvaus (esim. Alkuvirsi)"
                          />
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container-highest text-outline shrink-0">
                            {`{{${hymn.key}}}`}
                          </span>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveHymn(hymn.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-outline hover:text-error hover:bg-error/15 transition-colors shrink-0"
                          title="Poista virsi"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={hymn.value}
                          onChange={(e) =>
                            handleUpdateHymn(hymn.id, { value: e.target.value })
                          }
                          className="flex-1 text-xs font-mono font-medium bg-surface-container-high border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Virren numero (esim. 332 tai 124:1-4)"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {hymnList.length === 0 && (
                  <div className="text-center py-6 text-xs text-outline border border-dashed border-outline-variant/20 rounded-lg">
                    Ei virsiä määritetty. Klikkaa yläpuolelta "+ Lisää virsi" lisätäksesi uuden virren.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Personnel / Speakers Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-outline flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Palveluksen osallistujat & Pappisrekisteri</span>
                  </h3>
                  <p className="text-[11px] text-outline mt-0.5">
                    Määritä liturgi, saarnaaja, kanttori ja lukijat.{" "}
                    <strong className="text-amber-400 font-medium">Invariantti:</strong> Mikäli nimeä ei ole annettu, henkilö merkitään vain rooliksi (ei tyhjää nimiriviä grafiikassa).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onAddSpeaker}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 font-medium transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Lisää osallistuja</span>
                </button>
              </div>

              {/* Speaker Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {speakers.map((spk) => {
                  const strap = computeStrapPreview(spk, metadata.church);
                  const isRoleOnly = !spk.name || spk.name.trim().length === 0;

                  return (
                    <div
                      key={spk.id}
                      className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all shadow-xs ${
                        isRoleOnly
                          ? "bg-amber-500/5 border-amber-500/30"
                          : "bg-surface-container-low border-outline-variant/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <select
                            className="text-xs font-semibold bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-lg px-2 py-1 focus:ring-1 focus:ring-primary focus:outline-none"
                            value={spk.role}
                            onChange={(e) => onUpdateSpeaker(spk.id, { role: e.target.value })}
                          >
                            {COMMON_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                            {!COMMON_ROLES.includes(spk.role) && (
                              <option value={spk.role}>{spk.role}</option>
                            )}
                          </select>

                          {isRoleOnly ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <ShieldAlert className="w-3 h-3 text-amber-400" />
                              <span>Vain rooli</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Nimi määritetty</span>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteSpeaker(spk.id)}
                          className="p-1.5 rounded-md text-outline hover:text-error hover:bg-error/15 transition-colors"
                          title="Poista osallistuja"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Inputs */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-outline mb-0.5">
                            Nimi (Valinnainen)
                          </label>
                          <input
                            type="text"
                            className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                            value={spk.name || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const hasName = val.trim().length > 0;
                              onUpdateSpeaker(spk.id, {
                                name: val,
                                hasName,
                                isRoleOnly: !hasName,
                              });
                            }}
                            placeholder="Esim. Matti Meikäläinen"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-outline mb-0.5">
                            Titteli (Valinnainen)
                          </label>
                          <input
                            type="text"
                            className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                            value={spk.title || ""}
                            onChange={(e) => onUpdateSpeaker(spk.id, { title: e.target.value })}
                            placeholder="Esim. Pastori"
                          />
                        </div>
                      </div>

                      {/* Broadcast Lower-Third Live Simulation */}
                      <div className="mt-1 bg-surface-container-highest/70 rounded-lg p-2.5 border border-outline-variant/15 flex items-center gap-2.5">
                        <Tv className="w-4 h-4 text-primary shrink-0" />
                        <div className="text-[11px] leading-tight overflow-hidden flex-1">
                          <div className="font-semibold text-on-surface truncate">
                            {strap.line1}
                          </div>
                          <div className="text-[10px] text-outline truncate">
                            {strap.line2}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-outline uppercase px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/20 shrink-0">
                          pigraphics :3107
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-outline-variant/15 bg-surface-container-high flex items-center justify-between shrink-0">
          <div className="text-xs text-outline font-mono">
            {metadata.church} • {speakers.length} puhujaa • {hymnList.length} virttä
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-white font-medium text-xs hover:bg-primary/90 transition-colors shadow-sm"
          >
            Valmis & Sulje
          </button>
        </div>
      </div>
    </div>
  );
};
