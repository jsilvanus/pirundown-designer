import React from "react";
import {
  FileText,
  UploadCloud,
  Download,
  Copy,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderArchive,
} from "lucide-react";

interface HeaderProps {
  onLoadTemplate: (templateId: string) => void;
  onPushToPirundown: () => void;
  onOpenStorage: () => void;
  onExportYaml: () => void;
  onCopyYaml: () => void;
  onOpenLectionary: () => void;
  isPushing: boolean;
  pushStatus: { success?: boolean; message?: string } | null;
  isValid: boolean;
  errorCount: number;
  warningCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadTemplate,
  onPushToPirundown,
  onOpenStorage,
  onExportYaml,
  onCopyYaml,
  onOpenLectionary,
  isPushing,
  pushStatus,
  isValid,
  errorCount,
  warningCount,
}) => {
  return (
    <header className="h-14 bg-surface-container border-b border-outline-variant/15 flex items-center justify-between px-4 select-none shrink-0">
      {/* Brand & Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-base shadow-sm">
            π
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-on-surface">pirundown-designer</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-container-highest text-outline">:3410</span>
            </div>
            <p className="text-[10px] text-outline font-medium">Riihimäen Keskuskirkko</p>
          </div>
        </div>

        <div className="h-4 w-px bg-outline-variant/20 mx-1" />

        {/* Template Selector */}
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-outline" />
          <span className="text-xs text-outline font-medium">Pohja:</span>
          <select
            className="text-xs bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-md px-2 py-1 hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            defaultValue="messu"
            onChange={(e) => onLoadTemplate(e.target.value)}
          >
            <option value="messu">Messu (Pääjumalanpalvelus)</option>
            <option value="sanajumalanpalvelus">Sanajumalanpalvelus</option>
            <option value="empty">Tyhjä laadintapohja</option>
          </select>
        </div>

        {/* Storage / Arkisto button */}
        <button
          type="button"
          onClick={onOpenStorage}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/25 transition-colors"
          title="Avaa ja selaa pirundownin (:3400) tallennustilaa ja arkistoa"
        >
          <FolderArchive className="w-3.5 h-3.5 text-primary" />
          <span>Tallennustila (:3400)</span>
        </button>

        {/* Lectionary / Kirkkovuosi button */}
        <button
          type="button"
          onClick={onOpenLectionary}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/25 transition-colors"
          title="Tuo lektionaari ja päivän pyhä Kirkkovuosijärjestelmästä"
        >
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span>Kirkkovuosi (Varfetch)</span>
        </button>
      </div>

      {/* Validation Status & Egress Actions */}
      <div className="flex items-center gap-2.5">
        {/* Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isValid
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
              : "bg-error/10 text-error border-error/30"
          }`}
        >
          {isValid ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Skeema OK</span>
              {warningCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                  {warningCount} varoitusta
                </span>
              )}
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errorCount} skeemavirhettä</span>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-outline-variant/20 mx-1" />

        {/* Copy YAML */}
        <button
          type="button"
          onClick={onCopyYaml}
          className="p-1.5 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
          title="Kopioi YAML leikepöydälle"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Download YAML */}
        <button
          type="button"
          onClick={onExportYaml}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/30 transition-colors"
          title="Lataa .yaml tiedostona"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Tallenna YAML</span>
        </button>

        {/* Direct HTTP Push to pirundown (:3400) */}
        <button
          type="button"
          onClick={onPushToPirundown}
          disabled={isPushing || !isValid}
          className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md font-medium text-white transition-all shadow-sm ${
            !isValid
              ? "bg-surface-container-highest text-outline cursor-not-allowed"
              : isPushing
              ? "bg-primary/70 cursor-wait"
              : "bg-primary hover:bg-primary/90"
          }`}
          title="Lataa suoraan ajossa olevaan pirundown-moottoriin (POST http://localhost:3400/api/v1/rundown/load)"
        >
          {isPushing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UploadCloud className="w-3.5 h-3.5" />
          )}
          <span>Lataa pirundowniin (:3400)</span>
        </button>
      </div>
    </header>
  );
};
