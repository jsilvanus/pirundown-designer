import React, { useState } from "react";
import {
  Video,
  MonitorPlay,
  Tv,
  Music2,
  Radio,
  Repeat,
  Variable,
  Clock,
  X,
  Plus,
} from "lucide-react";

interface ActionPaletteModalProps {
  onAddAction: (action: any) => void;
  onClose: () => void;
}

export const ActionPaletteModal: React.FC<ActionPaletteModalProps> = ({
  onAddAction,
  onClose,
}) => {
  const [category, setCategory] = useState<
    "cam" | "switch" | "graphic" | "pipgm" | "tally" | "alternate" | "var" | "delay"
  >("cam");

  // Cam state
  const [camId, setCamId] = useState<number>(1);
  const [camPreset, setCamPreset] = useState<string>("altar");

  // Switch state
  const [switchType, setSwitchType] = useState<"cut" | "dsk" | "auto" | "ftb">("cut");
  const [switchInput, setSwitchInput] = useState<number>(1);
  const [dskIndex, setDskIndex] = useState<number>(1);
  const [dskState, setDskState] = useState<"on" | "off" | "toggle">("on");

  // Graphic state
  const [graphicType, setGraphicType] = useState<"speaker_strap" | "scripture" | "ticker">("speaker_strap");
  const [graphicRole, setGraphicRole] = useState<string>("Liturgi");
  const [graphicScripture, setGraphicScripture] = useState<string>("{{evankeliumi_viite}}");

  // PiPGM state
  const [hymnVar, setHymnVar] = useState<string>("{{hymn_1}}");

  // Tally state
  const [tallyUnit, setTallyUnit] = useState<number>(1);
  const [tallyState, setTallyState] = useState<"pgm" | "prv" | "off">("pgm");

  // Alternate state
  const [altInterval, setAltInterval] = useState<number>(10);
  const [altDuring, setAltDuring] = useState<"speech" | "music" | "any">("speech");
  const [altCuts, setAltCuts] = useState<string>("2, 1");

  // Var state
  const [varKey, setVarKey] = useState<string>("section");
  const [varValue, setVarValue] = useState<string>("Saarna");

  // Delay state
  const [delayMs, setDelayMs] = useState<number>(500);

  const handleAdd = () => {
    switch (category) {
      case "cam":
        onAddAction({ cam: { id: camId, preset: camPreset } });
        break;
      case "switch":
        if (switchType === "cut") {
          onAddAction({ switch: { cut: switchInput } });
        } else if (switchType === "dsk") {
          onAddAction({ switch: { dsk: dskIndex, state: dskState } });
        } else if (switchType === "auto") {
          onAddAction({ switch: { auto: true } });
        } else if (switchType === "ftb") {
          onAddAction({ switch: { ftb: true } });
        }
        break;
      case "graphic":
        if (graphicType === "speaker_strap") {
          const rolePrefix = graphicRole === "Saarnaaja" ? "preacher" : graphicRole === "Liturgi" ? "liturgist" : "cantor";
          onAddAction({
            graphic: {
              template: "speaker_strap",
              action: "show",
              role: graphicRole,
              name: `{{${rolePrefix}}}`,
              title: `{{${rolePrefix}_title}}`,
            },
          });
        } else if (graphicType === "scripture") {
          onAddAction({
            graphic: {
              template: "scripture",
              action: "show",
              scripture: graphicScripture,
            },
          });
        } else {
          onAddAction({
            graphic: {
              template: "ticker",
              action: "show",
              text: "Tervetuloa Riihimäen Keskuskirkkoon",
            },
          });
        }
        break;
      case "pipgm":
        onAddAction({ pipgm: { hymn: hymnVar } });
        break;
      case "tally":
        onAddAction({ tally: { unit: tallyUnit, state: tallyState } });
        break;
      case "alternate":
        const cutsArray = altCuts.split(",").map((c) => parseInt(c.trim(), 10)).filter((n) => !isNaN(n));
        onAddAction({
          alternate: {
            interval_sec: altInterval,
            during: altDuring,
            cut: cutsArray.length > 0 ? cutsArray : [1, 2],
          },
        });
        break;
      case "var":
        onAddAction({ var: { [varKey.trim()]: varValue.trim() } });
        break;
      case "delay":
        onAddAction({ delay: { ms: delayMs } });
        break;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container w-full max-w-lg rounded-2xl border border-outline-variant/20 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-on-surface">Toimintovalikoima / Action Palette</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-surface-container-low border-b border-outline-variant/10 text-xs">
          <button
            type="button"
            onClick={() => setCategory("cam")}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              category === "cam" ? "bg-primary text-white" : "text-outline hover:bg-surface-container-high"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Kamera</span>
          </button>

          <button
            type="button"
            onClick={() => setCategory("switch")}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              category === "switch" ? "bg-primary text-white" : "text-outline hover:bg-surface-container-high"
            }`}
          >
            <MonitorPlay className="w-4 h-4" />
            <span>ATEM-mikseri</span>
          </button>

          <button
            type="button"
            onClick={() => setCategory("graphic")}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              category === "graphic" ? "bg-primary text-white" : "text-outline hover:bg-surface-container-high"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Grafiikka / Strappi</span>
          </button>

          <button
            type="button"
            onClick={() => setCategory("pipgm")}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              category === "pipgm" ? "bg-primary text-white" : "text-outline hover:bg-surface-container-high"
            }`}
          >
            <Music2 className="w-4 h-4" />
            <span>PiPGM Virsi</span>
          </button>

          <button
            type="button"
            onClick={() => setCategory("tally")}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              category === "tally" ? "bg-primary text-white" : "text-outline hover:bg-surface-container-high"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Tally-valo</span>
          </button>

          <button
            type="button"
            onClick={() => setCategory("alternate")}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              category === "alternate" ? "bg-primary text-white" : "text-outline hover:bg-surface-container-high"
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>Autom. vaihto</span>
          </button>

          <button
            type="button"
            onClick={() => setCategory("var")}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              category === "var" ? "bg-primary text-white" : "text-outline hover:bg-surface-container-high"
            }`}
          >
            <Variable className="w-4 h-4" />
            <span>Muuttuja</span>
          </button>

          <button
            type="button"
            onClick={() => setCategory("delay")}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              category === "delay" ? "bg-primary text-white" : "text-outline hover:bg-surface-container-high"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Viive</span>
          </button>
        </div>

        {/* Configuration Body */}
        <div className="p-4 flex flex-col gap-3">
          {category === "cam" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-outline mb-1">PTZ-kamera ID</label>
                <select
                  className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                  value={camId}
                  onChange={(e) => setCamId(parseInt(e.target.value, 10))}
                >
                  <option value={1}>Kamera 1 (Takaparvi / Yleisnäkymä)</option>
                  <option value={2}>Kamera 2 (Alttari & Ambo)</option>
                  <option value={3}>Kamera 3 (Saarnastuoli)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-outline mb-1">Esiasento (Preset)</label>
                <select
                  className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                  value={camPreset}
                  onChange={(e) => setCamPreset(e.target.value)}
                >
                  <option value="altar">Alttari (altar)</option>
                  <option value="altar-wide">Alttari laaja (altar-wide)</option>
                  <option value="altar-tight">Alttari tiivis (altar-tight)</option>
                  <option value="ambo">Ambo / Lukupulpetti (ambo)</option>
                  <option value="pulpit">Saarnastuoli (pulpit)</option>
                  <option value="organ">Urut & Kanttori (organ)</option>
                  <option value="font">Kasteallas (font)</option>
                  <option value="wide">Kirkkosali laaja (wide)</option>
                </select>
              </div>
            </div>
          )}

          {category === "switch" && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSwitchType("cut")}
                  className={`flex-1 py-1 text-xs rounded border ${
                    switchType === "cut" ? "bg-primary/20 border-primary text-primary" : "border-outline-variant/30 text-outline"
                  }`}
                >
                  Suora leikkaus (Cut)
                </button>
                <button
                  type="button"
                  onClick={() => setSwitchType("dsk")}
                  className={`flex-1 py-1 text-xs rounded border ${
                    switchType === "dsk" ? "bg-primary/20 border-primary text-primary" : "border-outline-variant/30 text-outline"
                  }`}
                >
                  DSK Grafiikka-avain
                </button>
                <button
                  type="button"
                  onClick={() => setSwitchType("auto")}
                  className={`flex-1 py-1 text-xs rounded border ${
                    switchType === "auto" ? "bg-primary/20 border-primary text-primary" : "border-outline-variant/30 text-outline"
                  }`}
                >
                  AUTO-siirtymä
                </button>
                <button
                  type="button"
                  onClick={() => setSwitchType("ftb")}
                  className={`flex-1 py-1 text-xs rounded border ${
                    switchType === "ftb" ? "bg-primary/20 border-primary text-primary" : "border-outline-variant/30 text-outline"
                  }`}
                >
                  FTB
                </button>
              </div>

              {switchType === "cut" && (
                <div>
                  <label className="block text-xs font-medium text-outline mb-1">ATEM Ohjelmatulo (Program Cut)</label>
                  <select
                    className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                    value={switchInput}
                    onChange={(e) => setSwitchInput(parseInt(e.target.value, 10))}
                  >
                    <option value={1}>Tulo 1 (Kamera 1)</option>
                    <option value={2}>Tulo 2 (Kamera 2)</option>
                    <option value={3}>Tulo 3 (Kamera 3)</option>
                    <option value={4}>Tulo 4 (PiProgram / Grafiikka)</option>
                  </select>
                </div>
              )}

              {switchType === "dsk" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-outline mb-1">DSK-kanava</label>
                    <select
                      className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                      value={dskIndex}
                      onChange={(e) => setDskIndex(parseInt(e.target.value, 10))}
                    >
                      <option value={1}>DSK 1 (PiProgram virret)</option>
                      <option value={2}>DSK 2 (PiGraphics tekstit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-outline mb-1">Tila</label>
                    <select
                      className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                      value={dskState}
                      onChange={(e) => setDskState(e.target.value as any)}
                    >
                      <option value="on">Päälle (on)</option>
                      <option value="off">Pois (off)</option>
                      <option value="toggle">Vaihda tila (toggle)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {category === "graphic" && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-outline mb-1">Grafiikkatyyppi</label>
                <select
                  className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                  value={graphicType}
                  onChange={(e) => setGraphicType(e.target.value as any)}
                >
                  <option value="speaker_strap">Puhujalaatta / Speaker Strap (Auto-resoluutio rekisteristä)</option>
                  <option value="scripture">Raamatunteksti / Evankeliumi</option>
                  <option value="ticker">Alapalkki / Ticker</option>
                </select>
              </div>

              {graphicType === "speaker_strap" && (
                <div>
                  <label className="block text-xs font-medium text-outline mb-1">Aktiivinen rooli</label>
                  <select
                    className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                    value={graphicRole}
                    onChange={(e) => setGraphicRole(e.target.value)}
                  >
                    <option value="Liturgi">Liturgi (resolvoi muuttujan {'{{liturgist}}'})</option>
                    <option value="Saarnaaja">Saarnaaja (resolvoi muuttujan {'{{preacher}}'})</option>
                    <option value="Kanttori">Kanttori (resolvoi muuttujan {'{{cantor}}'})</option>
                    <option value="Tekstinlukija">Tekstinlukija (Vain rooli, jos nimi puuttuu)</option>
                  </select>
                </div>
              )}

              {graphicType === "scripture" && (
                <div>
                  <label className="block text-xs font-medium text-outline mb-1">Raamattuviite</label>
                  <input
                    type="text"
                    className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                    value={graphicScripture}
                    onChange={(e) => setGraphicScripture(e.target.value)}
                    placeholder="{{evankeliumi_viite}}"
                  />
                </div>
              )}
            </div>
          )}

          {category === "pipgm" && (
            <div>
              <label className="block text-xs font-medium text-outline mb-1">Virsiosoite / Numero</label>
              <input
                type="text"
                className="w-full text-xs font-mono bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                value={hymnVar}
                onChange={(e) => setHymnVar(e.target.value)}
                placeholder="{{hymn_1}}"
              />
              <span className="text-[10px] text-outline mt-1 block">
                Käytä esiasetettuja muuttujia: <code>{"{{hymn_1}}"}</code>, <code>{"{{hymn_2}}"}</code>, <code>{"{{hymn_3}}"}</code> tai numeroa esim. <code>332</code>
              </span>
            </div>
          )}

          {category === "tally" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-outline mb-1">Tally-yksikkö</label>
                <select
                  className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                  value={tallyUnit}
                  onChange={(e) => setTallyUnit(parseInt(e.target.value, 10))}
                >
                  <option value={1}>Ohjaamo / Operaattori</option>
                  <option value={2}>Alttari</option>
                  <option value={3}>Saarnastuoli</option>
                  <option value={4}>Urut</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-outline mb-1">Tila</label>
                <select
                  className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                  value={tallyState}
                  onChange={(e) => setTallyState(e.target.value as any)}
                >
                  <option value="pgm">PGM (Punainen / Lähetyksessä)</option>
                  <option value="prv">PRV (Vihreä / Esikatselussa)</option>
                  <option value="off">Pois päältä</option>
                </select>
              </div>
            </div>
          )}

          {category === "alternate" && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-outline mb-1">Aikaväli (sekuntia)</label>
                  <input
                    type="number"
                    className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                    value={altInterval}
                    onChange={(e) => setAltInterval(parseInt(e.target.value, 10))}
                    min={3}
                    max={60}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-outline mb-1">Milloin aktiivinen</label>
                  <select
                    className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                    value={altDuring}
                    onChange={(e) => setAltDuring(e.target.value as any)}
                  >
                    <option value="speech">Vain puheen aikana (speech)</option>
                    <option value="music">Vain musiikin aikana (music)</option>
                    <option value="any">Aina (any)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-outline mb-1">Kameratulot vuorotteluun</label>
                <input
                  type="text"
                  className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                  value={altCuts}
                  onChange={(e) => setAltCuts(e.target.value)}
                  placeholder="2, 1"
                />
              </div>
            </div>
          )}

          {category === "var" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-outline mb-1">Muuttujan nimi</label>
                <input
                  type="text"
                  className="w-full text-xs font-mono bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                  value={varKey}
                  onChange={(e) => setVarKey(e.target.value)}
                  placeholder="section"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-outline mb-1">Arvo</label>
                <input
                  type="text"
                  className="w-full text-xs font-mono bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                  value={varValue}
                  onChange={(e) => setVarValue(e.target.value)}
                  placeholder="Saarna"
                />
              </div>
            </div>
          )}

          {category === "delay" && (
            <div>
              <label className="block text-xs font-medium text-outline mb-1">Viive (millisekuntia)</label>
              <input
                type="number"
                className="w-full text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                value={delayMs}
                onChange={(e) => setDelayMs(parseInt(e.target.value, 10))}
                min={50}
                step={50}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/15 flex justify-end gap-2 bg-surface-container-low">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-outline hover:text-on-surface hover:bg-surface-container-high"
          >
            Peruuta
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90"
          >
            Lisää toiminto
          </button>
        </div>
      </div>
    </div>
  );
};
