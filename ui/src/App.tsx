import React, { useState, useEffect, useRef, useCallback } from "react";
import type {
  ServiceMetadata,
  HymnSelection,
  SpeakerParticipant,
  RundownItemData,
  ValidationResponse,
  LectionaryData,
} from "./types/index.js";
import { Header } from "./components/Header.js";
import { ServiceInfoModal } from "./components/ServiceInfoModal.js";
import { SectionList } from "./components/SectionList.js";
import { YamlEditor } from "./components/YamlEditor.js";
import { VariableWarnings } from "./components/VariableWarnings.js";
import { LectionaryModal } from "./components/LectionaryModal.js";
import { StorageModal } from "./components/StorageModal.js";
import {
  Columns2,
  Eye,
  Code2,
  AlertCircle,
  CheckCircle2,
  Church,
  Sliders,
  GripVertical,
  RotateCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";

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

  // --- UI View Modes & Modals ---
  const [viewMode, setViewMode] = useState<"split" | "visual" | "code">("split");
  const [showServiceInfoModal, setShowServiceInfoModal] = useState(false);
  const [showLectionaryModal, setShowLectionaryModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushToast, setPushToast] = useState<{ success: boolean; message: string } | null>(null);

  // --- Resizing & Narrowing State ---
  const [splitRatio, setSplitRatio] = useState<number>(50); // 50% left, 50% right
  const [pageWidthPercent, setPageWidthPercent] = useState<number>(100); // 50% to 100%

  const isUpdatingFromCode = useRef(false);
  const isDraggingSplit = useRef(false);
  const isDraggingPageWidth = useRef<"left" | "right" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // --- Mouse Drag Resizing Logic ---
  const handleMouseDownSplit = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSplit.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseDownPageWidth = (side: "left" | "right") => (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingPageWidth.current = side;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Split view divider drag
      if (isDraggingSplit.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const newPercent = (offsetX / rect.width) * 100;
        const clamped = Math.max(25, Math.min(75, newPercent));
        setSplitRatio(Math.round(clamped));
      }

      // Page width narrowing drag
      if (isDraggingPageWidth.current) {
        const screenWidth = window.innerWidth;
        const side = isDraggingPageWidth.current;
        let deltaFromCenter = 0;
        const center = screenWidth / 2;

        if (side === "right") {
          deltaFromCenter = Math.abs(e.clientX - center);
        } else {
          deltaFromCenter = Math.abs(center - e.clientX);
        }

        const calculatedPercent = (deltaFromCenter * 2 / screenWidth) * 100;
        const clamped = Math.max(45, Math.min(100, calculatedPercent));
        setPageWidthPercent(Math.round(clamped));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingSplit.current || isDraggingPageWidth.current) {
        isDraggingSplit.current = false;
        isDraggingPageWidth.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-on-surface">
      {/* App Header */}
      <Header
        onLoadTemplate={loadTemplate}
        onOpenServiceInfo={() => setShowServiceInfoModal(true)}
        onPushToPirundown={handlePushToPirundown}
        onOpenStorage={() => setShowStorageModal(true)}
        onExportYaml={handleExportYaml}
        onCopyYaml={handleCopyYaml}
        onOpenLectionary={() => setShowLectionaryModal(true)}
        isPushing={isPushing}
        pushStatus={pushToast}
        isValid={validation.valid}
        errorCount={validation.errors?.length || 0}
        warningCount={validation.warnings.length}
      />

      {/* View Switcher & Page Width Sub-bar */}
      <div className="h-9 px-4 bg-surface-container-low border-b border-outline-variant/15 flex items-center justify-between text-xs shrink-0 select-none">
        {/* Left: View Mode Switches */}
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

        {/* Right: Page Width Controls & Info */}
        <div className="flex items-center gap-3">
          {/* Page Width Indicator & Presets */}
          <div className="flex items-center gap-1.5 bg-surface-container px-2 py-0.5 rounded-lg border border-outline-variant/15 text-[11px] text-outline font-mono">
            <span>Leveys: {pageWidthPercent}%</span>
            <button
              type="button"
              onClick={() => setPageWidthPercent(100)}
              className={`p-0.5 rounded hover:text-on-surface transition-colors ${
                pageWidthPercent === 100 ? "text-primary" : "text-outline"
              }`}
              title="Palauta täyteen leveyteen (100%)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <span className="text-outline/30">|</span>
            <button
              type="button"
              onClick={() => setPageWidthPercent(80)}
              className={`px-1 rounded hover:text-on-surface ${pageWidthPercent === 80 ? "text-primary font-bold" : ""}`}
              title="80% leveys"
            >
              80%
            </button>
            <button
              type="button"
              onClick={() => setPageWidthPercent(65)}
              className={`px-1 rounded hover:text-on-surface ${pageWidthPercent === 65 ? "text-primary font-bold" : ""}`}
              title="65% leveys"
            >
              65%
            </button>
          </div>

          <div className="h-3 w-px bg-outline-variant/20" />

          {/* Live Status indicator */}
          <div className="flex items-center gap-2 text-[11px] text-outline font-mono">
            <span>Kohtia: {rundown.length}</span>
            <span>•</span>
            <span>Puhujia: {speakers.length}</span>
            <span>•</span>
            <span>Virsiä: {Object.keys(hymns || {}).length}</span>
          </div>
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

      {/* Main Outer Workspace Wrapper with Page Narrowing Handles */}
      <div className="flex-1 overflow-hidden flex justify-center bg-surface-container-lowest relative select-none">
        {/* Left Page Narrowing Handle */}
        <div
          onMouseDown={handleMouseDownPageWidth("left")}
          className="w-3.5 hover:w-4 bg-transparent hover:bg-primary/20 cursor-ew-resize flex items-center justify-center transition-all group shrink-0 select-none z-20 border-r border-transparent hover:border-primary/40"
          title="Kavenna tai levennä sivua vetämällä (Vasen kahva)"
        >
          <div className="w-1 h-12 rounded-full bg-outline-variant/30 group-hover:bg-primary transition-colors flex items-center justify-center">
            <GripVertical className="w-3 h-3 text-outline/60 group-hover:text-white" />
          </div>
        </div>

        {/* Centered Adjustable Width Content Canvas */}
        <div
          ref={containerRef}
          style={{ width: `${pageWidthPercent}%` }}
          className="h-full flex overflow-hidden border-x border-outline-variant/15 bg-background shadow-lg transition-[width] duration-75"
        >
          {/* Left Side: Visual Designer */}
          {(viewMode === "split" || viewMode === "visual") && (
            <div
              style={{
                width: viewMode === "split" ? `${splitRatio}%` : "100%",
              }}
              className="h-full overflow-y-auto p-4 flex flex-col gap-4"
            >
              {/* Variable Interpolation Warnings */}
              <VariableWarnings warnings={validation.warnings} />

              {/* Service Info & People Quick Banner / Modal Opener */}
              <div
                onClick={() => setShowServiceInfoModal(true)}
                className="p-3.5 bg-surface-container hover:bg-surface-container-high rounded-2xl border border-outline-variant/20 cursor-pointer flex items-center justify-between gap-3 transition-all group shadow-xs select-none"
                title="Avaa palveluksen perustiedot, virret ja henkilöt"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Church className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-on-surface">
                        {metadata.title || "Messu"}
                      </span>
                      {metadata.service && (
                        <span className="text-[11px] text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10">
                          {metadata.service}
                        </span>
                      )}
                      <span className="text-[10px] text-outline font-mono">
                        {metadata.date}
                      </span>
                    </div>
                    <div className="text-[11px] text-outline truncate flex items-center gap-2 mt-0.5">
                      <span>{metadata.church}</span>
                      <span>•</span>
                      <span>{speakers.length} osallistujaa</span>
                      <span>•</span>
                      <span>{Object.keys(hymns || {}).length} virttä</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary bg-primary/15 group-hover:bg-primary/25 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Muokkaa tietoja & henkilöitä</span>
                  </button>
                </div>
              </div>

              {/* Hierarchical Rundown & Cue Items */}
              <SectionList rundown={rundown} onUpdateRundown={setRundown} />
            </div>
          )}

          {/* Split Resizer Divider Handle */}
          {viewMode === "split" && (
            <div
              onMouseDown={handleMouseDownSplit}
              className="w-2.5 hover:w-3 bg-surface-container-high hover:bg-primary/30 cursor-col-resize flex items-center justify-center transition-all group shrink-0 select-none z-10 border-x border-outline-variant/20 hover:border-primary/50"
              title="Säädä jaetun näkymän leveyttä vetämällä"
            >
              <div className="w-1 h-10 rounded-full bg-outline-variant/50 group-hover:bg-primary transition-colors" />
            </div>
          )}

          {/* Right Side: Synchronized YAML Editor with Line Numbers */}
          {(viewMode === "split" || viewMode === "code") && (
            <div
              style={{
                width: viewMode === "split" ? `${100 - splitRatio}%` : "100%",
              }}
              className="p-4 h-full overflow-hidden"
            >
              <YamlEditor
                yamlText={yamlText}
                errors={validation.errors}
                onChangeYaml={handleYamlChange}
              />
            </div>
          )}
        </div>

        {/* Right Page Narrowing Handle */}
        <div
          onMouseDown={handleMouseDownPageWidth("right")}
          className="w-3.5 hover:w-4 bg-transparent hover:bg-primary/20 cursor-ew-resize flex items-center justify-center transition-all group shrink-0 select-none z-20 border-l border-transparent hover:border-primary/40"
          title="Kavenna tai levennä sivua vetämällä (Oikea kahva)"
        >
          <div className="w-1 h-12 rounded-full bg-outline-variant/30 group-hover:bg-primary transition-colors flex items-center justify-center">
            <GripVertical className="w-3 h-3 text-outline/60 group-hover:text-white" />
          </div>
        </div>
      </div>

      {/* Service Info, Hymns & Personnel Modal */}
      {showServiceInfoModal && (
        <ServiceInfoModal
          metadata={metadata}
          hymns={hymns}
          speakers={speakers}
          onChangeMetadata={(m) => setMetadata((prev) => ({ ...prev, ...m }))}
          onChangeHymns={(h) => setHymns(h)}
          onAddSpeaker={handleAddSpeaker}
          onUpdateSpeaker={handleUpdateSpeaker}
          onDeleteSpeaker={handleDeleteSpeaker}
          onClose={() => setShowServiceInfoModal(false)}
        />
      )}

      {/* Lectionary Kirkkovuosi Modal */}
      {showLectionaryModal && (
        <LectionaryModal
          currentDate={metadata.date}
          onApplyLectionary={handleApplyLectionary}
          onClose={() => setShowLectionaryModal(false)}
        />
      )}

      {/* Storage & Archive Modal */}
      {showStorageModal && (
        <StorageModal
          currentYaml={yamlText}
          currentTitle={metadata.title}
          currentDate={metadata.date}
          onLoadRundownYaml={(loadedYaml) => {
            handleYamlChange(loadedYaml);
            setPushToast({
              success: true,
              message: "Ajolista ladattu onnistuneesti suunnittelijaan tallennustilasta!",
            });
            setTimeout(() => setPushToast(null), 4000);
          }}
          onClose={() => setShowStorageModal(false)}
        />
      )}
    </div>
  );
};
