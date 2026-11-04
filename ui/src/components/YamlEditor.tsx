import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Code,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Edit3,
  Eye,
  Minimize2,
} from "lucide-react";

interface YamlEditorProps {
  yamlText: string;
  errors?: string[];
  onChangeYaml: (newYaml: string) => void;
}

interface FoldableBlock {
  startLine: number; // 0-based
  endLine: number; // 0-based (inclusive)
  indent: number;
  type: "root" | "section" | "item" | "sub";
  title?: string;
  hierarchicalNumber?: string;
}

export const YamlEditor: React.FC<YamlEditorProps> = ({
  yamlText,
  errors = [],
  onChangeYaml,
}) => {
  const [copied, setCopied] = useState(false);
  const [localText, setLocalText] = useState(yamlText);
  const [editorMode, setEditorMode] = useState<"foldable" | "raw">("foldable");

  // Track which startLine indexes are folded
  const [foldedStarts, setFoldedStarts] = useState<Set<number>>(new Set());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalText(yamlText);
  }, [yamlText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(localText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setLocalText(next);
    onChangeYaml(next);
  };

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // --- Parsing lines and foldable blocks ---
  const { lines, foldableBlocks, blocksByStart } = useMemo(() => {
    const rawLines = localText.split("\n");
    const blocks: FoldableBlock[] = [];
    const byStart = new Map<number, FoldableBlock>();

    // Identify sections and rundown items
    let currentSectionNum = 0;
    let itemInSec = 0;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();
      const indent = line.search(/\S|$/);

      // Section header comment: e.g. "# 1. Johdanto" or "# --- 1. Johdanto ---"
      const sectionMatch = trimmed.match(/^#\s*(?:---+)?\s*(\d+)\.\s*([A-Za-zÅÄÖåäö\s]+)/);
      if (sectionMatch) {
        currentSectionNum = parseInt(sectionMatch[1], 10);
        itemInSec = 0;
      }

      // Check for rundown item: "  - id:" or "  - " at indent 2
      const isRundownItem = indent === 2 && trimmed.startsWith("-");
      if (isRundownItem) {
        itemInSec++;
        const hierNumber = currentSectionNum > 0 ? `${currentSectionNum}.${itemInSec}` : `${itemInSec}`;

        // Find end of this item block: runs until next item at indent 2, or line with indent < 2, or section comment
        let endLine = i;
        for (let j = i + 1; j < rawLines.length; j++) {
          const nextTrimmed = rawLines[j].trim();
          if (nextTrimmed.length === 0) continue;
          const nextIndent = rawLines[j].search(/\S|$/);

          if (nextIndent < 2 || (nextIndent === 2 && nextTrimmed.startsWith("-")) || nextTrimmed.startsWith("# ---")) {
            break;
          }
          endLine = j;
        }

        if (endLine > i) {
          const itemBlock: FoldableBlock = {
            startLine: i,
            endLine,
            indent,
            type: "item",
            hierarchicalNumber: hierNumber,
          };
          blocks.push(itemBlock);
          byStart.set(i, itemBlock);
        }
        continue;
      }

      // Top-level root keys: "preflight:", "connectors:", "rundown:" at indent 0
      if (indent === 0 && trimmed.endsWith(":") && !trimmed.startsWith("#")) {
        let endLine = i;
        for (let j = i + 1; j < rawLines.length; j++) {
          const nextTrimmed = rawLines[j].trim();
          if (nextTrimmed.length === 0) continue;
          const nextIndent = rawLines[j].search(/\S|$/);
          if (nextIndent === 0 && !nextTrimmed.startsWith("#")) {
            break;
          }
          endLine = j;
        }

        if (endLine > i) {
          const rootBlock: FoldableBlock = {
            startLine: i,
            endLine,
            indent: 0,
            type: "root",
            title: trimmed.replace(":", ""),
          };
          blocks.push(rootBlock);
          byStart.set(i, rootBlock);
        }
        continue;
      }

      // Sub-blocks: "cue:", "actions:" at indent 4
      if (indent >= 4 && trimmed.endsWith(":") && !trimmed.startsWith("#") && !trimmed.startsWith("-")) {
        let endLine = i;
        for (let j = i + 1; j < rawLines.length; j++) {
          const nextTrimmed = rawLines[j].trim();
          if (nextTrimmed.length === 0) continue;
          const nextIndent = rawLines[j].search(/\S|$/);
          if (nextIndent <= indent) {
            break;
          }
          endLine = j;
        }

        if (endLine > i) {
          const subBlock: FoldableBlock = {
            startLine: i,
            endLine,
            indent,
            type: "sub",
            title: trimmed.replace(":", ""),
          };
          blocks.push(subBlock);
          byStart.set(i, subBlock);
        }
      }
    }

    return { lines: rawLines, foldableBlocks: blocks, blocksByStart: byStart };
  }, [localText]);

  // Compute hidden lines based on foldedStarts
  const hiddenLines = useMemo(() => {
    const hidden = new Set<number>();
    for (const start of foldedStarts) {
      const block = blocksByStart.get(start);
      if (block) {
        for (let l = block.startLine + 1; l <= block.endLine; l++) {
          hidden.add(l);
        }
      }
    }
    return hidden;
  }, [foldedStarts, blocksByStart]);

  // Toggle fold for a block
  const toggleFold = (startLine: number) => {
    setFoldedStarts((prev) => {
      const next = new Set(prev);
      if (next.has(startLine)) {
        next.delete(startLine);
      } else {
        next.add(startLine);
      }
      return next;
    });
  };

  // Fold all rundown items
  const foldAllItems = () => {
    const next = new Set<number>();
    for (const b of foldableBlocks) {
      if (b.type === "item") {
        next.add(b.startLine);
      }
    }
    setFoldedStarts(next);
  };

  // Unfold all
  const unfoldAll = () => {
    setFoldedStarts(new Set());
  };

  // Fold preflight & connectors
  const foldHeaders = () => {
    const next = new Set(foldedStarts);
    for (const b of foldableBlocks) {
      if (b.type === "root" && (b.title === "preflight" || b.title === "connectors")) {
        next.add(b.startLine);
      }
    }
    setFoldedStarts(next);
  };

  // Format line with syntax highlighting cues
  const formatSyntaxLine = (text: string) => {
    const trimmed = text.trim();

    // Comment
    if (trimmed.startsWith("#")) {
      return <span className="text-outline/70 italic">{text}</span>;
    }

    // Key-value pair: e.g. "title: Messu" or "  - id: alkusoitto"
    const colonIdx = text.indexOf(":");
    if (colonIdx !== -1) {
      const keyPart = text.slice(0, colonIdx + 1);
      const valPart = text.slice(colonIdx + 1);

      return (
        <span>
          <span className="text-violet-300 font-medium">{keyPart}</span>
          <span className="text-on-surface/90">{valPart}</span>
        </span>
      );
    }

    return <span>{text}</span>;
  };

  return (
    <div className="h-full flex flex-col bg-surface-container rounded-xl border border-outline-variant/15 overflow-hidden shadow-sm">
      {/* Top Bar */}
      <div className="h-10 bg-surface-container-high px-3 border-b border-outline-variant/15 flex items-center justify-between select-none shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Code className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold text-on-surface truncate">
            Rundown v2 YAML
          </span>

          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container-highest text-outline shrink-0">
            {lines.length} riviä
          </span>

          {foldedStarts.size > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
              {foldedStarts.size} taitettu
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Fold / Unfold buttons */}
          <button
            type="button"
            onClick={foldAllItems}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Tiivistä kaikki ajolistan kohdat yhteen riviin"
          >
            <ChevronsUp className="w-3 h-3" />
            <span>Tiivistä kohdat</span>
          </button>

          <button
            type="button"
            onClick={unfoldAll}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Laajenna kaikki taitetut lohkot"
          >
            <ChevronsDown className="w-3 h-3" />
            <span>Laajenna</span>
          </button>

          <div className="h-3 w-px bg-outline-variant/20 mx-0.5" />

          {/* Mode switch */}
          <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/15 text-[11px]">
            <button
              type="button"
              onClick={() => setEditorMode("foldable")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                editorMode === "foldable"
                  ? "bg-surface-container-high text-primary font-semibold shadow-2xs"
                  : "text-outline hover:text-on-surface"
              }`}
              title="Taitettava näkymä koodin taitolla ja kohdanumeroilla"
            >
              <Eye className="w-3 h-3" />
              <span>Taitettava</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorMode("raw")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                editorMode === "raw"
                  ? "bg-surface-container-high text-primary font-semibold shadow-2xs"
                  : "text-outline hover:text-on-surface"
              }`}
              title="Vapaa tekstimuokkaus"
            >
              <Edit3 className="w-3 h-3" />
              <span>Muokkaus</span>
            </button>
          </div>

          <div className="h-3 w-px bg-outline-variant/20 mx-0.5" />

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Kopioitu!" : "Kopioi"}</span>
          </button>
        </div>
      </div>

      {/* Errors Banner */}
      {errors.length > 0 && (
        <div className="p-2.5 bg-error/15 border-b border-error/30 flex flex-col gap-1 max-h-32 overflow-y-auto shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-error">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Skeemavirheet:</span>
          </div>
          {errors.map((err, idx) => (
            <div key={idx} className="text-[11px] font-mono text-error/90 pl-5">
              • {err}
            </div>
          ))}
        </div>
      )}

      {/* Editor Body */}
      {editorMode === "foldable" ? (
        /* --- Foldable View with Line Numbers, Fold Chevrons & Hierarchical Numbers --- */
        <div className="flex-1 overflow-auto bg-surface-container-lowest font-mono text-xs select-text">
          <div className="py-3 min-w-full inline-block">
            {lines.map((lineText, lineIdx) => {
              if (hiddenLines.has(lineIdx)) {
                return null;
              }

              const block = blocksByStart.get(lineIdx);
              const isFolded = foldedStarts.has(lineIdx);
              const isItem = block?.type === "item";
              const isRoot = block?.type === "root";
              const hierNum = block?.hierarchicalNumber;
              const hiddenCount = block ? block.endLine - block.startLine : 0;

              return (
                <div
                  key={lineIdx}
                  className={`flex items-center h-[22px] leading-[22px] px-2 hover:bg-surface-container-low/60 transition-colors group ${
                    isFolded ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Line Number Gutter */}
                  <span className="w-10 text-right pr-3 select-none text-outline/35 text-[11px] shrink-0 font-mono">
                    {lineIdx + 1}
                  </span>

                  {/* Fold / Unfold Toggle Button */}
                  <div className="w-5 flex items-center justify-center shrink-0 select-none">
                    {block ? (
                      <button
                        type="button"
                        onClick={() => toggleFold(lineIdx)}
                        className="w-4 h-4 rounded flex items-center justify-center text-outline/60 hover:text-primary hover:bg-primary/10 transition-colors"
                        title={isFolded ? "Laajenna lohko" : "Tiivistä lohko"}
                      >
                        {isFolded ? (
                          <ChevronRight className="w-3 h-3 text-primary" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    ) : null}
                  </div>

                  {/* Hierarchical Number Badge for Rundown Items (e.g. 1.1, 1.2, 2.1) */}
                  {hierNum ? (
                    <span className="select-none inline-flex items-center justify-center min-w-[28px] h-4 px-1 rounded bg-primary/20 text-primary text-[10px] font-bold font-mono mr-2 shrink-0 shadow-2xs">
                      {hierNum}
                    </span>
                  ) : (
                    <span className="w-1 shrink-0" />
                  )}

                  {/* Line Content with Syntax Highlighting */}
                  <div className="whitespace-pre flex-1 overflow-visible">
                    {formatSyntaxLine(lineText)}

                    {/* Folded Pill Indicator */}
                    {isFolded && (
                      <button
                        type="button"
                        onClick={() => toggleFold(lineIdx)}
                        className="ml-3 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface-container-high text-primary hover:bg-primary/20 text-[10px] font-sans border border-primary/25 cursor-pointer select-none transition-colors"
                        title="Klikkaa avataksesi"
                      >
                        <span>... ({hiddenCount} riviä taitettu)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* --- Raw Textarea Edit Mode with Synchronized Line Numbers Gutter --- */
        <div className="flex-1 relative flex overflow-hidden bg-surface-container-lowest font-mono text-xs">
          {/* Line Numbers Gutter */}
          <div
            ref={gutterRef}
            aria-hidden="true"
            className="select-none py-4 px-3 text-right bg-surface-container-low border-r border-outline-variant/15 text-outline/40 overflow-hidden leading-[21px] shrink-0 w-12"
          >
            {Array.from({ length: Math.max(1, lines.length) }).map((_, i) => (
              <div key={i + 1} className="h-[21px] leading-[21px]">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={localText}
            onChange={handleTextareaChange}
            onScroll={handleScroll}
            spellCheck={false}
            className="flex-1 w-full h-full py-4 px-3 font-mono text-xs text-on-surface bg-transparent resize-none focus:outline-none leading-[21px] tracking-wide selection:bg-primary/30 whitespace-pre overflow-auto"
            placeholder="Rundown v2 YAML..."
          />
        </div>
      )}
    </div>
  );
};
