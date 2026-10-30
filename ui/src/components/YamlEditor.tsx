import React, { useState, useEffect } from "react";
import { Code, Copy, Check, AlertCircle } from "lucide-react";

interface YamlEditorProps {
  yamlText: string;
  errors?: string[];
  onChangeYaml: (newYaml: string) => void;
}

export const YamlEditor: React.FC<YamlEditorProps> = ({
  yamlText,
  errors = [],
  onChangeYaml,
}) => {
  const [copied, setCopied] = useState(false);
  const [localText, setLocalText] = useState(yamlText);

  useEffect(() => {
    setLocalText(yamlText);
  }, [yamlText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(localText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setLocalText(next);
    onChangeYaml(next);
  };

  return (
    <div className="h-full flex flex-col bg-surface-container rounded-xl border border-outline-variant/15 overflow-hidden shadow-sm">
      {/* Top Bar */}
      <div className="h-10 bg-surface-container-high px-3 border-b border-outline-variant/15 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-on-surface">Rundown v2 YAML (Live Sync)</span>
        </div>

        <div className="flex items-center gap-1.5">
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
        <div className="p-2.5 bg-error/15 border-b border-error/30 flex flex-col gap-1 max-h-32 overflow-y-auto">
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
      <div className="flex-1 relative overflow-hidden bg-surface-container-lowest">
        <textarea
          value={localText}
          onChange={handleChange}
          spellCheck={false}
          className="w-full h-full p-4 font-mono text-xs text-on-surface bg-transparent resize-none focus:outline-none leading-relaxed tracking-wide selection:bg-primary/30"
          placeholder="Rundown v2 YAML..."
        />
      </div>
    </div>
  );
};
