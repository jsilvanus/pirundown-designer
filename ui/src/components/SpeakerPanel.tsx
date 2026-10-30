import React from "react";
import type { SpeakerParticipant } from "../types/index.js";
import { computeStrapPreview } from "../utils/speaker.js";
import { Users, Plus, Trash2, ShieldAlert, CheckCircle, Tv } from "lucide-react";

interface SpeakerPanelProps {
  speakers: SpeakerParticipant[];
  churchName: string;
  onAddSpeaker: () => void;
  onUpdateSpeaker: (id: string, updates: Partial<SpeakerParticipant>) => void;
  onDeleteSpeaker: (id: string) => void;
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

export const SpeakerPanel: React.FC<SpeakerPanelProps> = ({
  speakers,
  churchName,
  onAddSpeaker,
  onUpdateSpeaker,
  onDeleteSpeaker,
}) => {
  return (
    <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/15 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-outline">
            Palveluksen osallistujat & Pappisrekisteri (Multi-Speaker Registry)
          </h3>
        </div>
        <button
          type="button"
          onClick={onAddSpeaker}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-primary/15 text-primary hover:bg-primary/25 font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Lisää osallistuja</span>
        </button>
      </div>

      <p className="text-[11px] text-outline">
        Määritä liturgi, saarnaaja, kanttori ja lukijat.{" "}
        <strong className="text-amber-400 font-medium">Invariantti:</strong> Mikäli nimeä ei ole annettu, järjestelmä merkitsee osallistujan <em>vain rooliksi</em>, jolloin lähetysgrafiikka (lower-third) näyttää ainoastaan roolin ilman tyhjää nimikenttää.
      </p>

      {/* Speaker Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
        {speakers.map((spk) => {
          const strap = computeStrapPreview(spk, churchName);
          const isRoleOnly = !spk.name || spk.name.trim().length === 0;

          return (
            <div
              key={spk.id}
              className={`p-3 rounded-lg border flex flex-col gap-2.5 transition-all ${
                isRoleOnly
                  ? "bg-amber-500/5 border-amber-500/30"
                  : "bg-surface-container-low border-outline-variant/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Role Input / Select */}
                  <select
                    className="text-xs font-semibold bg-surface-container-high border border-outline-variant/30 text-on-surface rounded px-2 py-1 focus:ring-1 focus:ring-primary focus:outline-none"
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

                  {/* Role-Only Invariant Pill */}
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
                  className="p-1 rounded text-outline hover:text-error hover:bg-error/10 transition-colors"
                  title="Poista osallistuja"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Name & Title Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-outline mb-0.5">Henkilön nimi (Valinnainen)</label>
                  <input
                    type="text"
                    className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded px-2 py-1 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
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
                  <label className="block text-[10px] text-outline mb-0.5">Titteli / Virkanimi (Valinnainen)</label>
                  <input
                    type="text"
                    className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded px-2 py-1 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    value={spk.title || ""}
                    onChange={(e) => onUpdateSpeaker(spk.id, { title: e.target.value })}
                    placeholder="Esim. Pastori, Kirkkoherra"
                  />
                </div>
              </div>

              {/* Broadcast Lower-Third Live Simulation */}
              <div className="mt-1 bg-surface-container-highest/60 rounded-md p-2 border border-outline-variant/15 flex items-center gap-2">
                <Tv className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="text-[11px] leading-tight overflow-hidden">
                  <div className="font-semibold text-on-surface truncate">
                    {strap.line1}
                  </div>
                  <div className="text-[10px] text-outline truncate">
                    {strap.line2}
                  </div>
                </div>
                <span className="ml-auto text-[9px] font-mono text-outline uppercase px-1 py-0.2 rounded bg-surface-container border border-outline-variant/20 shrink-0">
                  pigraphics :3107
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
