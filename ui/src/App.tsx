import React, { useState, useEffect, useRef } from "react";
import type {
  ServiceMetadata,
  HymnSelection,
  SpeakerParticipant,
  RundownItemData,
  ValidationResponse,
  LectionaryData,
} from "./types/index.js";
import { Header } from "./components/Header.js";
import { MetadataPanel } from "./components/MetadataPanel.js";
import { SpeakerPanel } from "./components/SpeakerPanel.js";
import { SectionList } from "./components/SectionList.js";
import { YamlEditor } from "./components/YamlEditor.js";
import { VariableWarnings } from "./components/VariableWarnings.js";
import { LectionaryModal } from "./components/LectionaryModal.js";
import { computeStrapPreview } from "./utils/speaker.js";
import { Columns2, Eye, Code2, AlertCircle, CheckCircle2 } from "lucide-react";

export const App: React.FC = () => {
  // --- Visual State ---
  const [metadata, setMetadata] = useState<ServiceMetadata>({
    title: "Messu (Pääjumalanpalvelus)",
    service: "Pääjumalanpalvelus",
    church: "Riihimäen Keskuskirkko",
    date: new Date().toISOString().slice(0, 10),
  });

  const [speakers, setSpeakers] = useState<SpeakerParticipant[]>([
    { id: "spk_1", role: "Liturgi", name: "Pastori Matti", title: "Pastori", hasName: true, isRoleOnly: false },
    { id: "spk_2", role: "Saarnaaja", name: "Kirkkoherra Eeva", title: "Kirkkoherra", hasName: true, isRoleOnly: false },
    { id: "spk_3", role: "Kanttori", name: "Kanttori Liisa", title: "Kanttori", hasName: true, isRoleOnly: false },
    { id: "spk_4", role: "Tekstinlukija", hasName: false, isRoleOnly: true },
  ]);

  const [hymns, setHymns] = useState<HymnSelection>({
    hymn_1: "332",
    hymn_2: "450",
    hymn_3: "228",
    communion_hymns: "227, 230",
  });

  const [rundown, setRundown] = useState<RundownItemData[]>([]);

  // --- Code & Validation State ---
  const [yamlText, setYamlText] = useState<string>("");
  const [validation, setValidation] = useState<ValidationResponse>({
    valid: true,
    warnings: [],
  });

  // --- UI Controls ---
  const [viewMode, setViewMode] = useState<"split" | "visual" | "code">("split");
  const [showLectionaryModal, setShowLectionaryModal] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushToast, setPushToast] = useState<{ success: boolean; message: string } | null>(null);

  const isUpdatingFromCode = useRef(false);

  // Load default template on mount
  useEffect(() => {
    loadTemplate("messu");
  }, []);

  // Sync Visual -> Code (debounced)
  useEffect(() => {
    if (isUpdatingFromCode.current) {
      isUpdatingFromCode.current = false;
      return;
    }

    const timer = setTimeout(() => {
      syncVisualToCode();
    }, 250);

    return () => clearTimeout(timer);
  }, [metadata, speakers, hymns, rundown]);

  const syncVisualToCode = async () => {
    try {
      const res = await fetch("/api/v1/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: {
            metadata,
            speakers,
            hymns,
            connectors: {},
            preflightFetches: [],
            customVariables: {},
            rundown,
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.yaml) {
          setYamlText(json.yaml);
        }
        setValidation({
          valid: json.valid,
          errors: json.errors,
          warnings: json.warnings || [],
        });
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  const handleYamlChange = async (newYaml: string) => {
    setYamlText(newYaml);
    try {
      const res = await fetch("/api/v1/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: newYaml }),
      });

      if (res.ok) {
        const json = await res.json();
        setValidation({
          valid: json.valid,
          errors: json.errors,
          warnings: json.warnings || [],
        });

        if (json.valid && json.state) {
          isUpdatingFromCode.current = true;
          setMetadata(json.state.metadata);
          setSpeakers(json.state.speakers || []);
          setHymns(json.state.hymns || {});
          setRundown(json.state.rundown || []);
        }
      }
    } catch (err) {
      console.error("YAML change error:", err);
    }
  };

  const loadTemplate = async (templateId: string) => {
    if (templateId === "empty") {
      setMetadata({
        title: "Uusi jumalanpalvelus",
        service: "",
        church: "Riihimäen Keskuskirkko",
        date: new Date().toISOString().slice(0, 10),
      });
      setSpeakers([
        { id: "1", role: "Liturgi", name: "", hasName: false, isRoleOnly: true },
      ]);
      setHymns({});
      setRundown([]);
      return;
    }

    try {
      const res = await fetch(`/api/v1/templates/${templateId}`);
      if (res.ok) {
        const tpl = await res.json();
        const validateRes = await fetch("/api/v1/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: {
              metadata: {
                title: tpl.rundown.title,
                service: tpl.rundown.service || "",
                church: tpl.rundown.church || "Riihimäen Keskuskirkko",
                date: tpl.rundown.date || "",
              },
              speakers,
              hymns,
              connectors: tpl.rundown.connectors || {},
              preflightFetches: tpl.rundown.preflight?.fetch || [],
              customVariables: {},
              rundown: tpl.rundown.rundown,
            },
          }),
        });

        if (validateRes.ok) {
          const valJson = await validateRes.json();
          if (valJson.state) {
            setMetadata(valJson.state.metadata);
            setSpeakers(valJson.state.speakers);
            setHymns(valJson.state.hymns);
            setRundown(valJson.state.rundown);
            setYamlText(valJson.yaml || "");
            setValidation({
              valid: valJson.valid,
              errors: valJson.errors,
              warnings: valJson.warnings || [],
            });
          }
        }
      }
    } catch (err) {
      console.error("Template load error:", err);
    }
  };

  const handlePushToPirundown = async () => {
    if (!validation.valid) return;
    setIsPushing(true);
    setPushToast(null);

    try {
      const res = await fetch("/api/v1/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: yamlText }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setPushToast({
          success: true,
          message: "Rundown ladattu onnistuneesti pirundown-moottoriin (:3400)!",
        });
      } else {
        setPushToast({
          success: false,
          message: json.error || "Lataus pirundowniin epäonnistui",
        });
      }
    } catch (err: any) {
      setPushToast({
        success: false,
        message: `Yhteysvirhe pirundowniin (:3400): ${err.message}`,
      });
    } finally {
      setIsPushing(false);
      setTimeout(() => setPushToast(null), 6000);
    }
  };

  const handleExportYaml = () => {
    const blob = new Blob([yamlText], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedTitle = metadata.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.download = `${sanitizedTitle || "rundown"}_${metadata.date || "service"}.yaml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(yamlText);
    setPushToast({ success: true, message: "YAML kopioitu leikepöydälle!" });
    setTimeout(() => setPushToast(null), 3000);
  };

  const handleApplyLectionary = (data: LectionaryData) => {
    setMetadata((prev) => ({
      ...prev,
      title: `Messu - ${data.holyDayName}`,
      service: data.theme,
      date: data.date,
    }));
    setPushToast({
      success: true,
      message: `Kirkkovuositiedot tuotu: ${data.holyDayName}`,
    });
    setTimeout(() => setPushToast(null), 4000);
  };

  // --- Speaker Registry Helpers ---
  const handleAddSpeaker = () => {
    const newSpk: SpeakerParticipant = {
      id: `spk_${Date.now()}`,
      role: "Avustava pappi",
      name: "",
      hasName: false,
      isRoleOnly: true,
    };
    setSpeakers([...speakers, newSpk]);
  };

  const handleUpdateSpeaker = (id: string, updates: Partial<SpeakerParticipant>) => {
    setSpeakers((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...updates };
        const hasName = Boolean(next.name && next.name.trim().length > 0);
        return {
          ...next,
          hasName,
          isRoleOnly: !hasName,
        };
      })
    );
  };

  const handleDeleteSpeaker = (id: string) => {
    setSpeakers((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-on-surface">
      {/* App Header */}
      <Header
        onLoadTemplate={loadTemplate}
        onPushToPirundown={handlePushToPirundown}
        onExportYaml={handleExportYaml}
        onCopyYaml={handleCopyYaml}
        onOpenLectionary={() => setShowLectionaryModal(true)}
        isPushing={isPushing}
        pushStatus={pushToast}
        isValid={validation.valid}
        errorCount={validation.errors?.length || 0}
        warningCount={validation.warnings.length}
      />

      {/* View Switcher Sub-bar */}
      <div className="h-9 px-4 bg-surface-container-low border-b border-outline-variant/15 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === "split"
                ? "bg-surface-container-high text-primary shadow-xs"
                : "text-outline hover:text-on-surface"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Jaettu näkymä (Split)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("visual")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === "visual"
                ? "bg-surface-container-high text-primary shadow-xs"
                : "text-outline hover:text-on-surface"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vain visuaalinen laadinta</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("code")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === "code"
                ? "bg-surface-container-high text-primary shadow-xs"
                : "text-outline hover:text-on-surface"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Vain YAML-koodi</span>
          </button>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-3 text-[11px] text-outline font-mono">
          <span>Kohtia: {rundown.length}</span>
          <span>•</span>
          <span>Puhujia: {speakers.length} ({speakers.filter((s) => s.isRoleOnly).length} vain rooli)</span>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {pushToast && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between transition-all shrink-0 ${
            pushToast.success
              ? "bg-emerald-500/20 text-emerald-200 border-b border-emerald-500/30"
              : "bg-error/20 text-error border-b border-error/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {pushToast.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-error" />
            )}
            <span className="font-medium">{pushToast.message}</span>
          </div>
          <button
            onClick={() => setPushToast(null)}
            className="text-xs opacity-75 hover:opacity-100"
          >
            Sulje
          </button>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Side: Visual Designer */}
        {(viewMode === "split" || viewMode === "visual") && (
          <div
            className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 border-r border-outline-variant/15 ${
              viewMode === "split" ? "w-1/2 max-w-[55%]" : "w-full"
            }`}
          >
            {/* Variable Interpolation Warnings */}
            <VariableWarnings warnings={validation.warnings} />

            {/* Service Metadata & Hymn Selection */}
            <MetadataPanel
              metadata={metadata}
              hymns={hymns}
              onChangeMetadata={(m) => setMetadata((prev) => ({ ...prev, ...m }))}
              onChangeHymns={(h) => setHymns((prev) => ({ ...prev, ...h }))}
            />

            {/* Multi-Speaker / Priest Registry */}
            <SpeakerPanel
              speakers={speakers}
              churchName={metadata.church}
              onAddSpeaker={handleAddSpeaker}
              onUpdateSpeaker={handleUpdateSpeaker}
              onDeleteSpeaker={handleDeleteSpeaker}
            />

            {/* Visual Section & Cue Items */}
            <SectionList rundown={rundown} onUpdateRundown={setRundown} />
          </div>
        )}

        {/* Right Side: Synchronized YAML Editor */}
        {(viewMode === "split" || viewMode === "code") && (
          <div className={`p-4 flex-1 h-full overflow-hidden ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
            <YamlEditor
              yamlText={yamlText}
              errors={validation.errors}
              onChangeYaml={handleYamlChange}
            />
          </div>
        )}
      </div>

      {/* Lectionary Kirkkovuosi Modal */}
      {showLectionaryModal && (
        <LectionaryModal
          currentDate={metadata.date}
          onApplyLectionary={handleApplyLectionary}
          onClose={() => setShowLectionaryModal(false)}
        />
      )}
    </div>
  );
};
