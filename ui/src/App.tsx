import React, { useState, useEffect, useRef, useCallback } from "react";
import type {
  ServiceMetadata,
  HymnSelection,
  SpeakerParticipant,
  RundownItemData,
  ValidationResponse,
  LectionaryData,
  AgentChatMessage,
} from "./types/index.js";
import { Header } from "./components/Header.js";
import { ServiceInfoModal } from "./components/ServiceInfoModal.js";
import { SectionList } from "./components/SectionList.js";
import { YamlEditor } from "./components/YamlEditor.js";
import { AgentChatPanel } from "./components/AgentChatPanel.js";
import { VariableWarnings } from "./components/VariableWarnings.js";
import { LectionaryModal } from "./components/LectionaryModal.js";
import { StorageModal } from "./components/StorageModal.js";
import {
  Columns2,
  Columns3,
  Eye,
  Code2,
  AlertCircle,
  CheckCircle2,
  Church,
  Sliders,
  GripVertical,
  RotateCcw,
  Sparkles,
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

  // --- Agent Chat State ---
  const [chatHistory, setChatHistory] = useState<AgentChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  // --- UI View Modes & Modals ---
  const [viewMode, setViewMode] = useState<"3col" | "split" | "visual" | "code" | "agent">("3col");
  const [showServiceInfoModal, setShowServiceInfoModal] = useState(false);
  const [showLectionaryModal, setShowLectionaryModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushToast, setPushToast] = useState<{ success: boolean; message: string } | null>(null);

  // --- Resizing & Narrowing State ---
  const [splitRatio, setSplitRatio] = useState<number>(50); // For 2-column split (Left %)
  const [colRatio1, setColRatio1] = useState<number>(38); // For 3-column (Col 1 %)
  const [colRatio2, setColRatio2] = useState<number>(34); // For 3-column (Col 2 %) - Col 3 is (100 - colRatio1 - colRatio2)
  const [pageWidthPercent, setPageWidthPercent] = useState<number>(100); // 50% to 100%

  const isUpdatingFromCode = useRef(false);
  const activeDragSplit = useRef<"split2col" | "split3col_1" | "split3col_2" | null>(null);
  const isDraggingPageWidth = useRef<"left" | "right" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load session or default template on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await fetch("/api/v1/designer/state");
        if (res.ok) {
          const snap = await res.json();
          if (snap.state) {
            isUpdatingFromCode.current = true;
            setMetadata(snap.state.metadata);
            setSpeakers(snap.state.speakers || []);
            setHymns(snap.state.hymns || {});
            setRundown(snap.state.rundown || []);
            setYamlText(snap.yaml || "");
            setValidation({
              valid: snap.valid,
              errors: snap.errors,
              warnings: snap.warnings || [],
            });
            if (snap.chatHistory && snap.chatHistory.length > 0) {
              setChatHistory(snap.chatHistory);
            }
            return;
          }
        }
      } catch {
        // Fallback to template loading if server session route unavailable
      }
      loadTemplate("messu");
    };
    initSession();
  }, []);

  // Sync Visual -> Code & Session (debounced)
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
      const statePayload = {
        metadata,
        speakers,
        hymns,
        connectors: {},
        preflightFetches: [],
        customVariables: {},
        rundown,
      };

      const res = await fetch("/api/v1/designer/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: statePayload }),
      });

      if (res.ok) {
        const json = await res.json();
        const snap = json.snapshot;
        if (snap) {
          if (snap.yaml) setYamlText(snap.yaml);
          setValidation({
            valid: snap.valid,
            errors: snap.errors,
            warnings: snap.warnings || [],
          });
        }
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  const handleYamlChange = async (newYaml: string) => {
    setYamlText(newYaml);
    try {
      const res = await fetch("/api/v1/designer/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: newYaml }),
      });

      if (res.ok) {
        const json = await res.json();
        const snap = json.snapshot;
        if (snap) {
          setValidation({
            valid: snap.valid,
            errors: snap.errors,
            warnings: snap.warnings || [],
          });

          if (snap.valid && snap.state) {
            isUpdatingFromCode.current = true;
            setMetadata(snap.state.metadata);
            setSpeakers(snap.state.speakers || []);
            setHymns(snap.state.hymns || {});
            setRundown(snap.state.rundown || []);
          }
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
      const res = await fetch("/api/v1/designer/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (res.ok) {
        const json = await res.json();
        const snap = json.snapshot;
        if (snap) {
          isUpdatingFromCode.current = true;
          setMetadata(snap.state.metadata);
          setSpeakers(snap.state.speakers || []);
          setHymns(snap.state.hymns || {});
          setRundown(snap.state.rundown || []);
          setYamlText(snap.yaml || "");
          setValidation({
            valid: snap.valid,
            errors: snap.errors,
            warnings: snap.warnings || [],
          });
          setPushToast({
            success: true,
            message: `Mallipohja ladattu: ${templateId === "messu" ? "Messu" : "Sanajumalanpalvelus"}`,
          });
          setTimeout(() => setPushToast(null), 3000);
        }
      }
    } catch (err) {
      console.error("Template load error:", err);
    }
  };

  // Agent Chat Handler
  const handleSendAgentMessage = async (message: string) => {
    setIsThinking(true);
    try {
      const res = await fetch("/api/v1/designer/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.snapshot) {
          isUpdatingFromCode.current = true;
          setMetadata(data.snapshot.state.metadata);
          setSpeakers(data.snapshot.state.speakers || []);
          setHymns(data.snapshot.state.hymns || {});
          setRundown(data.snapshot.state.rundown || []);
          setYamlText(data.snapshot.yaml || "");
          setValidation({
            valid: data.snapshot.valid,
            errors: data.snapshot.errors,
            warnings: data.snapshot.warnings || [],
          });
          setChatHistory(data.snapshot.chatHistory || []);
        }

        if (data.actionsExecuted && data.actionsExecuted.length > 0) {
          setPushToast({
            success: true,
            message: `Agentti päivitti ajolistaa (${data.actionsExecuted.length} toimenpidettä)!`,
          });
          setTimeout(() => setPushToast(null), 4000);
        }
      }
    } catch (err: any) {
      console.error("Agent chat error:", err);
      setPushToast({
        success: false,
        message: `Agenttivirhe: ${err.message}`,
      });
      setTimeout(() => setPushToast(null), 4000);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearChatHistory = () => {
    setChatHistory([
      {
        id: `msg_cleared_${Date.now()}`,
        role: "assistant",
        content: "Keskusteluhistoria tyhjennetty. Miten voin auttaa ajolistan laadinnassa?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handlePushToPirundown = async () => {
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

  // --- Speaker Management Handlers ---
  const handleAddSpeaker = (spk: Omit<SpeakerParticipant, "id">) => {
    const newSpk: SpeakerParticipant = {
      ...spk,
      id: `spk_${Date.now()}`,
    };
    setSpeakers((prev) => [...prev, newSpk]);
  };

  const handleUpdateSpeaker = (id: string, patch: Partial<SpeakerParticipant>) => {
    setSpeakers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const handleDeleteSpeaker = (id: string) => {
    setSpeakers((prev) => prev.filter((s) => s.id !== id));
  };

  // --- Rundown Management Handlers ---
  const handleAddItem = (item: RundownItemData, section?: string) => {
    setRundown((prev) => [
      ...prev,
      { ...item, section: section || item.section || "Johdanto" },
    ]);
  };

  const handleUpdateItem = (id: string, patch: Partial<RundownItemData>) => {
    setRundown((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setRundown((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReorderRundown = (newRundown: RundownItemData[]) => {
    setRundown(newRundown);
  };

  // --- Drag Resizing Handlers ---
  const handleMouseDownSplit = (type: "split2col" | "split3col_1" | "split3col_2") => (e: React.MouseEvent) => {
    e.preventDefault();
    activeDragSplit.current = type;
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
      // 2-column or 3-column divider drag
      if (activeDragSplit.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const currentPercent = (offsetX / rect.width) * 100;

        if (activeDragSplit.current === "split2col") {
          const clamped = Math.max(20, Math.min(80, currentPercent));
          setSplitRatio(Math.round(clamped));
        } else if (activeDragSplit.current === "split3col_1") {
          // Adjust Col 1 vs Col 2
          const clampedCol1 = Math.max(20, Math.min(55, currentPercent));
          setColRatio1(Math.round(clampedCol1));
        } else if (activeDragSplit.current === "split3col_2") {
          // Adjust Col 2 vs Col 3
          const col1 = colRatio1;
          const targetCol2 = currentPercent - col1;
          const clampedCol2 = Math.max(20, Math.min(60, targetCol2));
          if (col1 + clampedCol2 < 82) {
            setColRatio2(Math.round(clampedCol2));
          }
        }
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
      if (activeDragSplit.current || isDraggingPageWidth.current) {
        activeDragSplit.current = null;
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
  }, [colRatio1, colRatio2]);

  const col3Ratio = Math.max(15, 100 - colRatio1 - colRatio2);

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
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setViewMode("3col")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === "3col"
                ? "bg-surface-container-high text-primary shadow-xs"
                : "text-outline hover:text-on-surface"
            }`}
            title="3 palstaa: Visuaalinen laadinta, YAML-koodi ja AI-Agentti rinnakkain"
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>3-palstaa (Kaikki)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === "split"
                ? "bg-surface-container-high text-primary shadow-xs"
                : "text-outline hover:text-on-surface"
            }`}
            title="2 palstaa: Visuaalinen ja YAML-koodi"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>2-palstaa</span>
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
            <span>Visuaalinen</span>
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
            <span>Koodi</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("agent")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === "agent"
                ? "bg-surface-container-high text-primary shadow-xs"
                : "text-outline hover:text-on-surface"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Agentti ✨</span>
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
          {/* Column 1: Visual Designer */}
          {(viewMode === "3col" || viewMode === "split" || viewMode === "visual") && (
            <div
              style={{
                width:
                  viewMode === "3col"
                    ? `${colRatio1}%`
                    : viewMode === "split"
                    ? `${splitRatio}%`
                    : "100%",
              }}
              className="h-full overflow-y-auto p-4 flex flex-col gap-4 shrink-0"
            >
              {/* Variable Interpolation Warnings */}
              <VariableWarnings warnings={validation.warnings} />

              {/* Service Info & People Quick Banner / Modal Opener */}
              <div
                onClick={() => setShowServiceInfoModal(true)}
                className="p-3.5 bg-surface-container hover:bg-surface-container-high rounded-2xl border border-outline-variant/20 cursor-pointer flex items-center justify-between gap-3 transition-all group shadow-xs select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <Church className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                      {metadata.title}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                        {metadata.service || "Pääjumalanpalvelus"}
                      </span>
                    </h2>
                    <p className="text-xs text-outline flex items-center gap-2 mt-0.5">
                      <span>{metadata.church}</span>
                      <span>•</span>
                      <span>{metadata.date}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-outline bg-surface-container-lowest/80 px-2.5 py-1 rounded-lg border border-outline-variant/20">
                    <Sliders className="w-3.5 h-3.5 text-primary" />
                    <span>Muokkaa perustietoja & virsiä</span>
                  </div>
                </div>
              </div>

              {/* Liturgical Rundown Items grouped by Section */}
              <SectionList
                rundown={rundown}
                onUpdateRundown={setRundown}
              />
            </div>
          )}

          {/* Divider between Col 1 and Col 2 */}
          {viewMode === "3col" && (
            <div
              onMouseDown={handleMouseDownSplit("split3col_1")}
              className="w-2 hover:w-2.5 bg-surface-container-high hover:bg-primary/30 cursor-col-resize flex items-center justify-center transition-all group shrink-0 select-none z-10 border-x border-outline-variant/20 hover:border-primary/50"
              title="Säädä visuaalisen laadinnan ja koodin suhdetta"
            >
              <div className="w-1 h-8 rounded-full bg-outline-variant/50 group-hover:bg-primary transition-colors" />
            </div>
          )}

          {viewMode === "split" && (
            <div
              onMouseDown={handleMouseDownSplit("split2col")}
              className="w-2.5 hover:w-3 bg-surface-container-high hover:bg-primary/30 cursor-col-resize flex items-center justify-center transition-all group shrink-0 select-none z-10 border-x border-outline-variant/20 hover:border-primary/50"
              title="Säädä jaetun näkymän leveyttä vetämällä"
            >
              <div className="w-1 h-10 rounded-full bg-outline-variant/50 group-hover:bg-primary transition-colors" />
            </div>
          )}

          {/* Column 2: Synchronized YAML Editor with Line Numbers */}
          {(viewMode === "3col" || viewMode === "split" || viewMode === "code") && (
            <div
              style={{
                width:
                  viewMode === "3col"
                    ? `${colRatio2}%`
                    : viewMode === "split"
                    ? `${100 - splitRatio}%`
                    : "100%",
              }}
              className="p-3 h-full overflow-hidden shrink-0"
            >
              <YamlEditor
                yamlText={yamlText}
                errors={validation.errors}
                onChangeYaml={handleYamlChange}
              />
            </div>
          )}

          {/* Divider between Col 2 and Col 3 */}
          {viewMode === "3col" && (
            <div
              onMouseDown={handleMouseDownSplit("split3col_2")}
              className="w-2 hover:w-2.5 bg-surface-container-high hover:bg-primary/30 cursor-col-resize flex items-center justify-center transition-all group shrink-0 select-none z-10 border-x border-outline-variant/20 hover:border-primary/50"
              title="Säädä koodin ja agentin suhdetta"
            >
              <div className="w-1 h-8 rounded-full bg-outline-variant/50 group-hover:bg-primary transition-colors" />
            </div>
          )}

          {/* Column 3: Rundown Designing Agent & Chat History */}
          {(viewMode === "3col" || viewMode === "agent") && (
            <div
              style={{
                width: viewMode === "3col" ? `${col3Ratio}%` : "100%",
              }}
              className="p-3 h-full overflow-hidden flex flex-col shrink-0"
            >
              <AgentChatPanel
                chatHistory={chatHistory}
                isThinking={isThinking}
                onSendMessage={handleSendAgentMessage}
                onClearHistory={handleClearChatHistory}
                className="h-full"
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
          onAddSpeaker={() => handleAddSpeaker({ role: "Uusi henkilö / rooli", hasName: false, isRoleOnly: true })}
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
