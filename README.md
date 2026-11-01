# pirundown-designer

Visual authoring and cue-sheet designer application for **Rundown v2 YAML**, serving **Riihimäen Keskuskirkko** in the **Pi Ecosystem** (`piecosystem`).

Runs as an HTTP service and visual web editor on port **`3410`**, coordinating with `pirundown` (:3400), `pigraphics` (:3107), `piswitch` (:3106), `piprogram`, `picam` (:3300), and `pigateway` (:3100).

---

## Key Features

1. **Service Metadata & Multi-Speaker Registry**:
   - Title, liturgical event, service date, church name.
   - Support for multiple priests, cantors, and assistants in a single service (*Liturgi*, *Saarnaaja*, *Avustava pappi*, *Kanttori*, *Tekstinlukija*).
   - **Role-Only Invariant Enforcement**: If a person's name is omitted, the system marks the item as role-only so broadcast lower-thirds (`pigraphics`) display only the role and church without blank lines.
   - Built-in live simulation of broadcast lower-thirds.
   - Hymn selection fields (`hymn_1`, `hymn_2`, `hymn_3`, `communion_hymns`).

2. **Visual Section & Cue Item Builder**:
   - Liturgical section grouping: *Johdanto* (Prelude/Intro), *Sana* (Word/Sermon), *Rukous* (Prayers), *Ehtoollinen* (Eucharist), *Päätös* (Postlude/Dismissal).
   - Quick-reorder controls (move up, move down, section filter).
   - **Cue / Trigger Configurator**:
     - Speech Recognition Trigger with fuzzy-match threshold slider (default 0.80).
     - Acoustic / Audio Trigger (`music_stop`, `speech_start`, `music_start`, `silence`).
     - Manual / Wait trigger (operator button cue).
   - **Action Palette**:
     - `cam`: PTZ camera selection (1, 2, 3) & presets (`altar`, `ambo`, `pulpit`, `organ`, `wide`).
     - `switch` / `atem`: Cuts, preview, program, AUTO transitions, DSK 1/2 state (`on`/`off`/`toggle`), FTB.
     - `graphic`: Lower-third straps (auto-resolving active role from the preflight registry), scripture overlays, or ticker banners.
     - `pipgm`: Hymn slide display (`hymn: "{{hymn_1}}"`).
     - `tally`: Tally light cues for operators and participants.
     - `alternate`: Automated camera alternations during speech or music.
     - `var`: Set/update dynamic variables (`section`, `speaker`, `active_role`).

3. **Lectionary & Kirkkovuosi Integration (Varfetch)**:
   - Configurator for external liturgical API connectors fetching the day's Holy Day name, Gospel reference, Epistle, and prayers.
   - 1-click import into active service preflight variables.

4. **Validation & Code/YAML Synchronizer**:
   - Real-time schema validation using `rundown-v2` Zod parser.
   - Dual split-view: Visual drag-and-drop designer on the left, synchronized syntax-highlighted YAML editor on the right.
   - Variable interpolation validator flagging broken or undefined `{{variable}}` references with automatic suggestions.

5. **Finnish Lutheran Template Library**:
   - *Messu (Pääjumalanpalvelus)* — Full communion mass.
   - *Sanajumalanpalvelus* — Service of the Word.

6. **Ecosystem Egress**:
   - Direct HTTP Push: `POST http://localhost:3400/api/v1/rundown/load` directly into running `pirundown` service.
   - YAML export and download.
   - Copy to clipboard.

---

## Getting Started

### Prerequisites
- Node.js >= 22 (recommended Node 24)
- pnpm 11 (pinned via `packageManager`; `corepack enable` or `npm i -g pnpm@11.23.0`)

### Installation & Build
```bash
# Clone repository
git clone https://github.com/jsilvanus/pirundown-designer.git
cd pirundown-designer

# Install dependencies and build both server and web UI
pnpm install
pnpm run build
```

### Starting the Server
```bash
# Run server on port 3410
pnpm start

# Or with CLI
node bin/pirundown-designer.mjs serve --port 3410
```

Open `http://localhost:3410` in your web browser.

### Development Mode
```bash
# Start backend watcher
pnpm run dev

# Start frontend Vite dev server (in another terminal)
pnpm run dev:ui
```

---

## CLI Usage

`pirundown-designer` includes a command-line interface:

```bash
# Start the web UI server
pirundown-designer serve --port 3410

# Validate a Rundown v2 YAML file and check variable interpolations
pirundown-designer validate sunday-mass.yaml

# Export built-in Finnish Lutheran templates
pirundown-designer template messu --output mass.yaml
pirundown-designer template sanajumalanpalvelus --output word-service.yaml

# Test speaker strap resolution with role-only invariant
pirundown-designer resolve-speaker --role "Tekstinlukija"
pirundown-designer resolve-speaker --role "Saarnaaja" --name "Matti Meikäläinen" --title "Pastori"
```

---

## Running Tests

```bash
pnpm test
```

Covers:
- Rundown v2 Zod schema validation
- Variable interpolation checker & undefined variable detection
- Multi-speaker registry and role-only invariant enforcement
- YAML roundtrip serialization / deserialization
- Fastify API endpoints (`/health`, `/api/v1/templates`, `/api/v1/validate`, `/api/v1/speakers/resolve`)

---

## Pi Ecosystem Ports

| Service | Port | Description |
|---|---|---|
| `picontrol` | 3000 | Human operator web UI |
| `pigateway` | 3100 | Central hardware gateway & event bus |
| `piswitch` | 3106 | ATEM / video switcher service |
| `pigraphics` | 3107 | Broadcast graphics engine & Fill/Key streaming |
| `picam` | 3300 | PTZ camera service (VISCA / presets) |
| `pirundown` | 3400 | Service rundown execution engine |
| **`pirundown-designer`** | **3410** | Visual Rundown v2 authoring tool |
