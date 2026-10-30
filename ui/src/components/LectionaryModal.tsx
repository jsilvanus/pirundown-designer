import React, { useState, useEffect } from "react";
import type { LectionaryData } from "../types/index.js";
import { BookOpen, Calendar, Check, X, RefreshCw, Sparkles } from "lucide-react";

interface LectionaryModalProps {
  currentDate: string;
  onApplyLectionary: (data: LectionaryData) => void;
  onClose: () => void;
}

export const LectionaryModal: React.FC<LectionaryModalProps> = ({
  currentDate,
  onApplyLectionary,
  onClose,
}) => {
  const [date, setDate] = useState<string>(currentDate || new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<LectionaryData | null>(null);

  const fetchLectionary = async (fetchDate: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/lectionary/today?date=${fetchDate}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Lectionary fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectionary(date);
  }, []);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    fetchLectionary(newDate);
  };

  const handleApply = () => {
    if (data) {
      onApplyLectionary(data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container w-full max-w-xl rounded-2xl border border-outline-variant/20 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm text-on-surface">Kirkkovuosi & Lektionaari (Varfetch)</h3>
              <p className="text-[11px] text-outline">Suomen ev.-lut. kirkon kirkkovuosikalenterin haku ja automaattiset muuttujat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Selector */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-outline">Valitse pyhäpäivä:</span>
            <input
              type="date"
              className="text-xs bg-surface-container-high border border-outline-variant/30 rounded px-2.5 py-1 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => fetchLectionary(date)}
            className="p-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
            title="Päivitä tiedot"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-outline text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              <span>Haetaan kirkkovuoden tekstejä...</span>
            </div>
          ) : data ? (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                  Päivän pyhä & liturginen väri
                </span>
                <h4 className="text-sm font-semibold text-on-surface">{data.holyDayName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-container-highest font-medium text-on-surface-variant">
                    Väri: {data.liturgicalColor}
                  </span>
                  <span className="text-xs text-outline italic">{data.theme}</span>
                </div>
              </div>

              {/* Readings */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/10">
                  <span className="text-[10px] text-outline uppercase font-semibold block mb-0.5">
                    Evankeliumi <code>{"{{evankeliumi_viite}}"}</code>
                  </span>
                  <p className="font-semibold text-primary">{data.readings.gospel.reference}</p>
                  {data.readings.gospel.text && (
                    <p className="text-[11px] text-outline mt-1 line-clamp-2 italic">
                      "{data.readings.gospel.text}"
                    </p>
                  )}
                </div>

                <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/10">
                  <span className="text-[10px] text-outline uppercase font-semibold block mb-0.5">
                    Epistola <code>{"{{epistola_viite}}"}</code>
                  </span>
                  <p className="font-semibold text-primary">{data.readings.epistle.reference}</p>
                  {data.readings.epistle.text && (
                    <p className="text-[11px] text-outline mt-1 line-clamp-2 italic">
                      "{data.readings.epistle.text}"
                    </p>
                  )}
                </div>
              </div>

              {/* Prayer */}
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/10 text-xs">
                <span className="text-[10px] text-outline uppercase font-semibold block mb-1">
                  Päivän rukous (Kollehta) <code>{"{{paivan_rukous}}"}</code>
                </span>
                <p className="italic text-on-surface-variant leading-relaxed">
                  "{data.prayer}"
                </p>
              </div>

              {/* Varfetch connector notice */}
              <div className="text-[11px] text-outline bg-primary/5 p-2 rounded border border-primary/20">
                💡 <em>Varfetch-integraatio:</em> Tuonti lisää <code>connectors.kirkkovuosi</code> -määrittelyn ja sitoo muuttujat suoraan alempaan grafiikkaan ja evankeliumikuulutukseen.
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-error p-4">Tietoja ei saatu ladattua.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/15 flex justify-end gap-2 bg-surface-container-low">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-outline hover:text-on-surface hover:bg-surface-container-high"
          >
            Sulje
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!data}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tuo palvelukseen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
