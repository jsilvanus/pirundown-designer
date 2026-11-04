import React, { useState } from "react";
import type { AiGraphicsOptions, AiItemInstructions } from "../types/index.js";
import {
  Sparkles,
  Tv,
  Layers,
  MapPin,
  Plus,
  X,
  Check,
  CheckSquare,
  Square,
  Sliders,
} from "lucide-react";

interface GraphicsOptionsModalProps {
  itemTitle: string;
  ai?: AiItemInstructions;
  onSave: (ai: AiItemInstructions) => void;
  onClose: () => void;
}

const PREMADE_LOWER_THIRDS = [
  { id: "lower-third-speaker", label: "Puhujan niminauha (Speaker Lower Third)", desc: "Nimi, rooli & seurakunta" },
  { id: "scripture-reading", label: "Raamatuntekstin nauha (Scripture Reading)", desc: "Raamatunkohta & lukukappale" },
  { id: "corner-logo", label: "Kanavatunnus / Bugi (Corner Watermark)", desc: "Oikean yläkulman logo" },
  { id: "ticker-banner", label: "Alapalkki (Ticker / Hymn Banner)", desc: "Koko kuvan levyinen alateksti" },
];

const PREMADE_OVERLAYS = [
  { id: "scripture-reading", label: "Raamatuntekstipeitto (Scripture Overlay)", desc: "Täysi lukukappaleen teksti" },
  { id: "corner-logo", label: "Logo-peite (Corner Bug Overlay)", desc: "Kiinteä logonäyttö" },
  { id: "ticker-banner", label: "Uutis- / Virsinauhapeitto", desc: "Virsinumerot ja ilmoitukset" },
  { id: "slide-overlay", label: "Esityksen diatekstipeitto (Slide Overlay)", desc: "PiPGM diatekstit" },
];

const PREMADE_TARGET_ZONES = [
  { id: "pulpit", label: "Saarnatuoli (pulpit)" },
  { id: "altar", label: "Alttari (altar)" },
  { id: "ambo", label: "Lukupulpetti (ambo)" },
  { id: "organ", label: "Urkulehteri (organ)" },
  { id: "choir", label: "Kuori / Esiintyjät (choir)" },
  { id: "congregation", label: "Kirkkosali (congregation)" },
];

export const GraphicsOptionsModal: React.FC<GraphicsOptionsModalProps> = ({
  itemTitle,
  ai,
  onSave,
  onClose,
}) => {
  const currentGraphics = ai?.graphicsOptions || {};

  const [targetZone, setTargetZone] = useState<string>(ai?.targetZone || "pulpit");
  const [lowerThird, setLowerThird] = useState<string[]>(currentGraphics.lowerThird || []);
  const [overlay, setOverlay] = useState<string[]>(currentGraphics.overlay || []);

  const [customLowerThird, setCustomLowerThird] = useState("");
  const [customOverlay, setCustomOverlay] = useState("");

  const toggleLowerThird = (id: string) => {
    setLowerThird((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleOverlay = (id: string) => {
    setOverlay((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddCustomLowerThird = () => {
    const trimmed = customLowerThird.trim();
    if (trimmed && !lowerThird.includes(trimmed)) {
      setLowerThird([...lowerThird, trimmed]);
      setCustomLowerThird("");
    }
  };

  const handleAddCustomOverlay = () => {
    const trimmed = customOverlay.trim();
    if (trimmed && !overlay.includes(trimmed)) {
      setOverlay([...overlay, trimmed]);
      setCustomOverlay("");
    }
  };

  const handleSave = () => {
    const newGraphicsOptions: AiGraphicsOptions = {};
    if (lowerThird.length > 0) newGraphicsOptions.lowerThird = lowerThird;
    if (overlay.length > 0) newGraphicsOptions.overlay = overlay;

    const newAi: AiItemInstructions = {
      ...(typeof ai === "object" ? ai : {}),
      targetZone: targetZone || undefined,
      graphicsOptions:
        Object.keys(newGraphicsOptions).length > 0 ? newGraphicsOptions : undefined,
    };

    onSave(newAi);
    onClose();
  };

  const handleClear = () => {
    const newAi: AiItemInstructions = {
      ...(typeof ai === "object" ? ai : {}),
      targetZone: undefined,
      graphicsOptions: undefined,
    };
    onSave(newAi);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container w-full max-w-2xl max-h-[90vh] rounded-2xl border border-outline-variant/20 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-outline-variant/15 bg-surface-container-high shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-on-surface flex items-center gap-2">
                <span>AI & Grafiikkavalinnat (graphicsOptions)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-container-highest text-outline">
                  pirundown
                </span>
              </h3>
              <p className="text-[11px] text-outline truncate max-w-md">
                Kohta: <strong className="text-on-surface">{itemTitle}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Zone Selector */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-outline uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Kohdealue / Target Zone</span>
            </div>
            <p className="text-[11px] text-outline">
              Määrittää AI-ohjaajalle ja kameroille toiminnan keskiön kirkkotilassa.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {PREMADE_TARGET_ZONES.map((zone) => {
                const isSelected = targetZone === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setTargetZone(zone.id)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-primary/15 border-primary text-primary font-semibold shadow-xs"
                        : "bg-surface-container hover:bg-surface-container-high border-outline-variant/20 text-on-surface"
                    }`}
                  >
                    <span>{zone.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lower Third Whitelist */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-outline uppercase tracking-wider">
                <Tv className="w-4 h-4 text-pink-400" />
                <span>Sallitut alareunanauhat (lowerThird whitelist)</span>
              </div>
              <span className="text-[11px] font-mono text-outline">
                {lowerThird.length} valittu
              </span>
            </div>

            <p className="text-[11px] text-outline">
              Valitse grafiikkapohjat, jotka AI-ohjaaja tai operaattori saa aktivoida tämän kohdan aikana.
            </p>

            <div className="space-y-1.5 pt-1">
              {PREMADE_LOWER_THIRDS.map((tpl) => {
                const isSelected = lowerThird.includes(tpl.id);
                return (
                  <div
                    key={tpl.id}
                    onClick={() => toggleLowerThird(tpl.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? "bg-pink-500/10 border-pink-500/35 text-on-surface"
                        : "bg-surface-container hover:bg-surface-container-high border-outline-variant/20 text-outline"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-pink-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-outline/50 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-xs text-on-surface flex items-center gap-2">
                          <span>{tpl.label}</span>
                          <code className="text-[10px] font-mono px-1 rounded bg-surface-container-highest text-outline">
                            "{tpl.id}"
                          </code>
                        </div>
                        <p className="text-[10px] text-outline truncate">{tpl.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Custom lowerThird tags */}
              {lowerThird
                .filter((id) => !PREMADE_LOWER_THIRDS.some((p) => p.id === id))
                .map((customId) => (
                  <div
                    key={customId}
                    className="p-2 rounded-lg bg-pink-500/15 border border-pink-500/40 text-xs flex items-center justify-between text-on-surface"
                  >
                    <span className="font-mono text-pink-300">"{customId}" (Oma pohja)</span>
                    <button
                      type="button"
                      onClick={() => toggleLowerThird(customId)}
                      className="text-outline hover:text-error p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

              {/* Add custom lowerThird input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customLowerThird}
                  onChange={(e) => setCustomLowerThird(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCustomLowerThird();
                  }}
                  placeholder="Muu lower-third ID..."
                  className="flex-1 text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleAddCustomLowerThird}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface font-medium border border-outline-variant/20 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Lisää</span>
                </button>
              </div>
            </div>
          </div>

          {/* Overlay Whitelist */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-outline uppercase tracking-wider">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Sallitut ruutugrafiikat (overlay whitelist)</span>
              </div>
              <span className="text-[11px] font-mono text-outline">
                {overlay.length} valittu
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {PREMADE_OVERLAYS.map((tpl) => {
                const isSelected = overlay.includes(tpl.id);
                return (
                  <div
                    key={tpl.id}
                    onClick={() => toggleOverlay(tpl.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? "bg-purple-500/10 border-purple-500/35 text-on-surface"
                        : "bg-surface-container hover:bg-surface-container-high border-outline-variant/20 text-outline"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-outline/50 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-xs text-on-surface flex items-center gap-2">
                          <span>{tpl.label}</span>
                          <code className="text-[10px] font-mono px-1 rounded bg-surface-container-highest text-outline">
                            "{tpl.id}"
                          </code>
                        </div>
                        <p className="text-[10px] text-outline truncate">{tpl.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Custom overlay tags */}
              {overlay
                .filter((id) => !PREMADE_OVERLAYS.some((p) => p.id === id))
                .map((customId) => (
                  <div
                    key={customId}
                    className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/40 text-xs flex items-center justify-between text-on-surface"
                  >
                    <span className="font-mono text-purple-300">"{customId}" (Oma overlay)</span>
                    <button
                      type="button"
                      onClick={() => toggleOverlay(customId)}
                      className="text-outline hover:text-error p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

              {/* Add custom overlay input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customOverlay}
                  onChange={(e) => setCustomOverlay(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCustomOverlay();
                  }}
                  placeholder="Muu overlay ID..."
                  className="flex-1 text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleAddCustomOverlay}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface font-medium border border-outline-variant/20 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Lisää</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-outline-variant/15 bg-surface-container-high flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-outline hover:text-error transition-colors"
          >
            Tyhjennä AI & grafiikkavalinnat
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-outline hover:text-on-surface transition-colors"
            >
              Peruuta
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-primary text-white font-medium text-xs hover:bg-primary/90 transition-colors shadow-sm"
            >
              Tallenna valinnat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
