import React, { useState } from "react";
import type { RundownCue } from "../types/index.js";
import { Mic, Volume2, Hand, X, Sliders } from "lucide-react";

interface TriggerConfigModalProps {
  cue?: RundownCue;
  onSave: (cue: RundownCue) => void;
  onClose: () => void;
}

export const TriggerConfigModal: React.FC<TriggerConfigModalProps> = ({
  cue,
  onSave,
  onClose,
}) => {
  const [triggerType, setTriggerType] = useState<"fuzzy" | "phrase" | "sound" | "manual">(
    (cue?.type as any) || "fuzzy"
  );
  const [phrase, setPhrase] = useState<string>(cue?.phrase || "");
  const [threshold, setThreshold] = useState<number>(cue?.threshold ?? 0.8);
  const [soundEvent, setSoundEvent] = useState<string>(cue?.event || "music_stop");

  const handleSave = () => {
    if (triggerType === "fuzzy") {
      onSave({
        type: "fuzzy",
        phrase: phrase.trim() || "Herra olkoon teidän kanssanne",
        threshold,
      });
    } else if (triggerType === "phrase") {
      onSave({
        type: "phrase",
        phrase: phrase.trim() || "Rukoilkaamme",
        caseSensitive: false,
      });
    } else if (triggerType === "sound") {
      onSave({
        type: "sound",
        event: soundEvent as any,
      });
    } else {
      onSave({
        type: "manual",
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container w-full max-w-md rounded-2xl border border-outline-variant/20 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-on-surface">Määritä heräte / Cue Trigger</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trigger Type Tabs */}
        <div className="grid grid-cols-3 gap-1 p-3 bg-surface-container-low border-b border-outline-variant/10 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTriggerType("fuzzy")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              triggerType === "fuzzy"
                ? "bg-primary text-white shadow-sm"
                : "text-outline hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Puhetunnistus</span>
          </button>

          <button
            type="button"
            onClick={() => setTriggerType("sound")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              triggerType === "sound"
                ? "bg-primary text-white shadow-sm"
                : "text-outline hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Ääni / Akustinen</span>
          </button>

          <button
            type="button"
            onClick={() => setTriggerType("manual")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              triggerType === "manual"
                ? "bg-primary text-white shadow-sm"
                : "text-outline hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Manuaalinen</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 flex flex-col gap-4">
          {triggerType === "fuzzy" && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-outline mb-1">
                  Tunnistettava puhelauseke (Whisper / liturgos-auditor)
                </label>
                <input
                  type="text"
                  className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  placeholder="Esim. Isän ja Pojan ja Pyhän Hengen nimeen"
                />
                <span className="text-[10px] text-outline mt-1 block">
                  Voit käyttää muuttujia: <code>{"{{hymn_1}}"}</code>, <code>{"{{preacher}}"}</code>
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-outline">
                    Sumean vastaavuuden kynnysarvo (Fuzzy Threshold)
                  </label>
                  <span className="text-xs font-mono font-semibold text-primary">
                    {Math.round(threshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-outline">
                  <span>50% (Salliva)</span>
                  <span>80% (Suositeltu oletus)</span>
                  <span>100% (Tarkka)</span>
                </div>
              </div>
            </div>
          )}

          {triggerType === "sound" && (
            <div className="flex flex-col gap-2">
              <label className="block text-xs font-medium text-outline mb-1">
                Äänitapahtuma (PiVoice & PiSound telemetria)
              </label>
              <select
                className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                value={soundEvent}
                onChange={(e) => setSoundEvent(e.target.value)}
              >
                <option value="music_stop">Musiikin loppuminen (music_stop) — Alkusoiton / virren päättyminen</option>
                <option value="speech_start">Puheen alkaminen (speech_start) — Saarnaaja alkaa puhua</option>
                <option value="music_start">Musiikin alkaminen (music_start) — Ehtoollismusiikki / urut</option>
                <option value="silence">Hiljaisuus (silence) — Hiljainen hetki</option>
                <option value="speech_stop">Puheen taukoaminen (speech_stop)</option>
              </select>
            </div>
          )}

          {triggerType === "manual" && (
            <div className="p-3 bg-surface-container-low rounded-lg text-xs text-outline border border-outline-variant/10">
              <p>
                Manuaalinen heräte: Kohta ei laukea automaattisesti äänestä tai puheesta, vaan odottaa ohjaajan tai teologisen operaattorin NEXT-painallusta.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/15 flex justify-end gap-2 bg-surface-container-low">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-outline hover:text-on-surface hover:bg-surface-container-high"
          >
            Peruuta
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90"
          >
            Tallenna heräte
          </button>
        </div>
      </div>
    </div>
  );
};
