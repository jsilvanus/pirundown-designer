import React, { useState, useEffect } from "react";
import {
  FolderArchive,
  RefreshCw,
  X,
  Play,
  FileEdit,
  Trash2,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  HardDrive,
  AlertCircle,
} from "lucide-react";

export interface StoredRundownItem {
  id: string;
  name: string;
  filename: string;
  title?: string;
  service?: string;
  church?: string;
  date?: string;
  itemCount: number;
  modifiedAt: string;
  sizeBytes: number;
  active?: boolean;
}

interface StorageModalProps {
  currentYaml: string;
  currentTitle: string;
  currentDate: string;
  onLoadRundownYaml: (yaml: string) => void;
  onClose: () => void;
}

export const StorageModal: React.FC<StorageModalProps> = ({
  currentYaml,
  currentTitle,
  currentDate,
  onLoadRundownYaml,
  onClose,
}) => {
  const [items, setItems] = useState<StoredRundownItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saveId, setSaveId] = useState<string>(
    `${currentTitle.toLowerCase().replace(/[^a-z0-9_\-]/g, "_")}${currentDate ? `_${currentDate}` : ""}`
  );
  const [autoLoad, setAutoLoad] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStorage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/storage");
      if (!res.ok) {
        throw new Error(`Palvelin vastasi virheellä: ${res.status}`);
      }
      const data = await res.json();
      if (data.rundowns) {
        setItems(data.rundowns);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      setError(`Tallennustilan haku epäonnistui: ${err.message}. Varmista että pirundown (:3400) on käynnissä.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, []);

  const handleSaveCurrent = async () => {
    if (!saveId.trim()) return;
    setSaving(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/v1/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: saveId.trim(),
          yaml: currentYaml,
          load: autoLoad,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage(`Ajolista tallennettu onnistuneesti nimellä '${saveId}'!`);
        fetchStorage();
      } else {
        setActionMessage(`Tallennusvirhe: ${data.error || "Tuntematon virhe"}`);
      }
    } catch (err: any) {
      setActionMessage(`Tallennusvirhe: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleOpenInDesigner = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/storage/${id}`);
      if (!res.ok) throw new Error("Tiedoston lataus epäonnistui");
      const data = await res.json();
      if (data.rundown?.yaml) {
        onLoadRundownYaml(data.rundown.yaml);
        onClose();
      }
    } catch (err: any) {
      setActionMessage(`Latausvirhe: ${err.message}`);
    }
  };

  const handleLoadIntoEngine = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/storage/${id}/load`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage(`Ajolista '${id}' asetettu aktiiviseksi pirundown-moottoriin (:3400)!`);
        fetchStorage();
      } else {
        setActionMessage(`Aktivointivirhe: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Aktivointivirhe: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Haluatko varmasti poistaa tallennetun ajolistan '${id}'?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/storage/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        fetchStorage();
      } else {
        setActionMessage(`Poistovirhe: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Poistovirhe: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container w-full max-w-2xl rounded-2xl border border-outline-variant/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm text-on-surface">PiRundown Tallennustila & Arkisto</h3>
              <p className="text-[11px] text-outline">
                pirundown (:3400) palvelimelle tallennetut YAML-ajolistat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStorage}
              className="p-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
              title="Päivitä lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action / Notification Banner */}
        {actionMessage && (
          <div className="bg-primary/15 border-b border-primary/25 px-4 py-2 text-xs text-primary flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Save Current Rundown Box */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/15 flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5 text-primary" />
            Tallenna nykyinen ajolista pirundowniin
          </span>

          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 text-xs font-mono bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              value={saveId}
              onChange={(e) => setSaveId(e.target.value)}
              placeholder="ajolistan_nimi (esim. messu_2026-11-01)"
            />
            <label className="flex items-center gap-1.5 text-xs text-outline cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoLoad}
                onChange={(e) => setAutoLoad(e.target.checked)}
                className="accent-primary rounded"
              />
              <span>Aseta samalla aktiiviseksi</span>
            </label>
            <button
              type="button"
              onClick={handleSaveCurrent}
              disabled={saving || !saveId.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{saving ? "Tallennetaan..." : "Tallenna :3400"}</span>
            </button>
          </div>
        </div>

        {/* Rundowns List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && items.length === 0 ? (
            <div className="p-8 text-center text-outline text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              <span>Haetaan tallennustilaa...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-outline text-xs bg-surface-container-low rounded-xl border border-dashed border-outline-variant/20">
              Ei tallennettuja ajolistoja. Käytä yllä olevaa lomaketta tallentaaksesi nykyisen ajolistan.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  item.active
                    ? "bg-primary/10 border-primary/40 ring-1 ring-primary/25"
                    : "bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/40"
                }`}
              >
                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-on-surface truncate">
                      {item.title || item.name}
                    </span>
                    <span className="text-[10px] font-mono text-outline px-1.5 py-0.2 rounded bg-surface-container-high border border-outline-variant/20">
                      {item.filename}
                    </span>
                    {item.active && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Aktiivinen
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-outline">
                    {item.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.date}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {item.itemCount} kohtaa
                    </span>
                    <span>Muokattu: {new Date(item.modifiedAt).toLocaleDateString("fi-FI")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenInDesigner(item.id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/30 transition-colors"
                    title="Avaa tämä ajolista suunnittelijassa"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-primary" />
                    <span>Avaa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadIntoEngine(item.id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary font-medium transition-colors"
                    title="Lataa tämä ajolista suoraan pirundown-moottoriin aktiiviseksi"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Aja</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-colors"
                    title="Poista ajolista tallennustilasta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-outline-variant/15 flex justify-end bg-surface-container-low">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Sulje
          </button>
        </div>
      </div>
    </div>
  );
};
