import React from "react";
import type { VariableWarning } from "../types/index.js";
import { AlertTriangle, Lightbulb } from "lucide-react";

interface VariableWarningsProps {
  warnings: VariableWarning[];
}

export const VariableWarnings: React.FC<VariableWarningsProps> = ({ warnings }) => {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Havaittiin määrittelemättömiä muuttujaviitteitä ({warnings.length} kpl)</span>
      </div>

      <div className="flex flex-col gap-1.5 pl-6">
        {warnings.map((w, idx) => (
          <div key={idx} className="text-xs text-amber-200/90 flex items-baseline gap-2">
            <span>• {w.message}</span>
            {w.suggestion && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-300">
                <Lightbulb className="w-2.5 h-2.5" />
                <span>Tarkoititko: {`{{${w.suggestion}}}`}</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
