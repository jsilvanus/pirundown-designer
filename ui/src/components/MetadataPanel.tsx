import React from "react";
import type { ServiceMetadata, HymnSelection } from "../types/index.js";
import { Music, Calendar, Church, BookOpen } from "lucide-react";

interface MetadataPanelProps {
  metadata: ServiceMetadata;
  hymns: HymnSelection;
  onChangeMetadata: (meta: Partial<ServiceMetadata>) => void;
  onChangeHymns: (hymns: Partial<HymnSelection>) => void;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({
  metadata,
  hymns,
  onChangeMetadata,
  onChangeHymns,
}) => {
  return (
    <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/15 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-outline flex items-center gap-1.5">
          <Church className="w-3.5 h-3.5 text-primary" />
          Palveluksen perustiedot & virret
        </h3>
        <span className="text-[11px] font-mono text-outline">Versio 2.0</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Title */}
        <div>
          <label className="block text-[11px] font-medium text-outline mb-1">Palveluksen otsikko</label>
          <input
            type="text"
            className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            value={metadata.title}
            onChange={(e) => onChangeMetadata({ title: e.target.value })}
            placeholder="Messu"
          />
        </div>

        {/* Liturgical Event / Subtitle */}
        <div>
          <label className="block text-[11px] font-medium text-outline mb-1">Liturginen tapahtuma / Teema</label>
          <input
            type="text"
            className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            value={metadata.service || ""}
            onChange={(e) => onChangeMetadata({ service: e.target.value })}
            placeholder="Pääjumalanpalvelus"
          />
        </div>

        {/* Church Name */}
        <div>
          <label className="block text-[11px] font-medium text-outline mb-1">Kirkko / Sijainti</label>
          <input
            type="text"
            className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            value={metadata.church}
            onChange={(e) => onChangeMetadata({ church: e.target.value })}
            placeholder="Riihimäen Keskuskirkko"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-[11px] font-medium text-outline mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-outline" />
            Päivämäärä (YYYY-MM-DD)
          </label>
          <input
            type="date"
            className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            value={metadata.date || ""}
            onChange={(e) => onChangeMetadata({ date: e.target.value })}
          />
        </div>
      </div>

      {/* Hymn Selection Row */}
      <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/10 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
          <Music className="w-3.5 h-3.5 text-amber-400" />
          <span>Virsivalinnat (Automaattiset muuttujat PiPGM- ja tekstijärjestelmiin)</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] text-outline mb-0.5">Alkuvirsi <code>{"{{hymn_1}}"}</code></label>
            <input
              type="text"
              className="w-full text-xs font-mono bg-surface-container-high border border-outline-variant/30 rounded px-2 py-1 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              value={hymns.hymn_1 || ""}
              onChange={(e) => onChangeHymns({ hymn_1: e.target.value })}
              placeholder="332"
            />
          </div>

          <div>
            <label className="block text-[10px] text-outline mb-0.5">Päivänvirsi <code>{"{{hymn_2}}"}</code></label>
            <input
              type="text"
              className="w-full text-xs font-mono bg-surface-container-high border border-outline-variant/30 rounded px-2 py-1 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              value={hymns.hymn_2 || ""}
              onChange={(e) => onChangeHymns({ hymn_2: e.target.value })}
              placeholder="450"
            />
          </div>

          <div>
            <label className="block text-[10px] text-outline mb-0.5">Päätösvirsi <code>{"{{hymn_3}}"}</code></label>
            <input
              type="text"
              className="w-full text-xs font-mono bg-surface-container-high border border-outline-variant/30 rounded px-2 py-1 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              value={hymns.hymn_3 || ""}
              onChange={(e) => onChangeHymns({ hymn_3: e.target.value })}
              placeholder="228"
            />
          </div>

          <div>
            <label className="block text-[10px] text-outline mb-0.5">Ehtoollisvirret <code>{"{{communion_hymns}}"}</code></label>
            <input
              type="text"
              className="w-full text-xs font-mono bg-surface-container-high border border-outline-variant/30 rounded px-2 py-1 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              value={hymns.communion_hymns || ""}
              onChange={(e) => onChangeHymns({ communion_hymns: e.target.value })}
              placeholder="227, 230"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
