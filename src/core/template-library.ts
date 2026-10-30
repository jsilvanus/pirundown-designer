import type { RundownV2 } from "../schema/rundown-v2.js";
import { createKirkkovuosiConnector } from "./lectionary.js";

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  rundown: RundownV2;
}

export const TEMPLATE_MESSU: RundownV2 = {
  version: 2,
  title: "Messu (Pääjumalanpalvelus)",
  service: "Pääjumalanpalvelus",
  church: "Riihimäen Keskuskirkko",
  date: "2026-11-01",
  connectors: {
    kirkkovuosi: createKirkkovuosiConnector(),
  },
  preflight: {
    fetch: [
      { connector: "kirkkovuosi", request: "tanaan" },
    ],
    variables: {
      liturgist: "Pastori Matti",
      liturgist_title: "Pastori",
      preacher: "Kirkkoherra Eeva",
      preacher_title: "Kirkkoherra",
      cantor: "Kanttori Liisa",
      cantor_title: "Kanttori",
      reader: "", // Role only! Will display only "Tekstinlukija"
      hymn_1: "332",
      hymn_2: "450",
      hymn_3: "228",
      communion_hymns: "227, 230",
      section: "Valmistelu",
    },
  },
  rundown: [
    // 1. Johdanto
    {
      id: "alkusoitto",
      title: "Alkusoitto (Preludi)",
      section: "Johdanto",
      notes: "Urkuri soittaa alkumusiikin. Seurakunta asettuu paikoilleen.",
      cue: {
        type: "sound",
        event: "music_stop",
      },
      actions: [
        { cam: { id: 1, preset: "organ" } },
        { switch: { cut: 1 } },
        { var: { section: "Johdanto", active_role: "Kanttori" } },
      ],
    },
    {
      id: "alkusiunaus",
      title: "Alkusiunaus & Johdantosanat",
      section: "Johdanto",
      notes: "Liturgi aloittaa alttarilta.",
      cue: {
        type: "fuzzy",
        phrase: "Isän ja Pojan ja Pyhän Hengen nimeen",
        threshold: 0.80,
      },
      actions: [
        { cam: { id: 2, preset: "altar" } },
        { switch: { cut: 2 } },
        { graphic: { template: "speaker_strap", action: "show", role: "Liturgi", name: "{{liturgist}}", title: "{{liturgist_title}}" } },
        { tally: { unit: 1, state: "pgm" } },
        { var: { section: "Alkusiunaus", active_role: "Liturgi" } },
      ],
    },
    {
      id: "alkuvirsi",
      title: "Alkuvirsi",
      section: "Johdanto",
      notes: "Seurakunta veisaa ensimmäisen virren.",
      cue: {
        type: "fuzzy",
        phrase: "Veisaamme virren {{hymn_1}}",
        threshold: 0.75,
      },
      actions: [
        { pipgm: { hymn: "{{hymn_1}}" } },
        { switch: { dsk: 1, state: "on" } },
        { cam: { id: 1, preset: "wide" } },
        { switch: { cut: 1 } },
        { var: { section: "Alkuvirsi" } },
      ],
    },
    {
      id: "synnintunnustus",
      title: "Synnintunnustus & Synninpäästö",
      section: "Johdanto",
      notes: "Liturgi kutsuu seurakunnan synnintunnustukseen.",
      cue: {
        type: "fuzzy",
        phrase: "Tunnustakaamme syntimme",
        threshold: 0.85,
      },
      actions: [
        { cam: { id: 2, preset: "altar" } },
        { switch: { dsk: 1, state: "off" } },
        { switch: { cut: 2 } },
        { var: { section: "Synnintunnustus" } },
      ],
    },

    // 2. Sana
    {
      id: "paivan_rukous",
      title: "Päivän rukous (Kollektarukous)",
      section: "Sana",
      notes: "Liturgi lausuu rukoilkaamme.",
      cue: {
        type: "fuzzy",
        phrase: "Rukoilkaamme",
        threshold: 0.85,
      },
      actions: [
        { cam: { id: 2, preset: "altar" } },
        { switch: { cut: 2 } },
        { var: { section: "Päivän rukous" } },
      ],
    },
    {
      id: "lukukappale",
      title: "Ensimmäinen lukukappale",
      section: "Sana",
      notes: "Tekstinlukija lukee ambolta. Huom: Roolivalinta on Tekstinlukija ilman nimeä.",
      cue: {
        type: "fuzzy",
        phrase: "Kuulkaa Jumalan sanaa",
        threshold: 0.75,
      },
      actions: [
        { cam: { id: 2, preset: "ambo" } },
        { switch: { cut: 2 } },
        { graphic: { template: "speaker_strap", action: "show", role: "Tekstinlukija" } },
        { var: { section: "Lukukappale", active_role: "Tekstinlukija" } },
      ],
    },
    {
      id: "evankeliumi",
      title: "Pyhä evankeliumi",
      section: "Sana",
      notes: "Luetaan päivän evankeliumiteksti.",
      cue: {
        type: "fuzzy",
        phrase: "Nousemme kuulemaan pyhää evankeliumia",
        threshold: 0.80,
      },
      actions: [
        { cam: { id: 2, preset: "ambo" } },
        { switch: { cut: 2 } },
        { var: { section: "Evankeliumi" } },
      ],
    },
    {
      id: "saarna",
      title: "Saarna",
      section: "Sana",
      notes: "Saarnaaja saarnastuolissa.",
      cue: {
        type: "sound",
        event: "speech_start",
      },
      actions: [
        { cam: { id: 3, preset: "pulpit" } },
        { switch: { cut: 3 } },
        { graphic: { template: "speaker_strap", action: "show", role: "Saarnaaja", name: "{{preacher}}", title: "{{preacher_title}}" } },
        { alternate: { interval_sec: 12, during: "speech", cut: [3, 1] } },
        { var: { section: "Saarna", speaker: "{{preacher}}", active_role: "Saarnaaja" } },
      ],
    },
    {
      id: "uskontunnustus",
      title: "Uskontunnustus (Credo)",
      section: "Sana",
      notes: "Seurakunta lausuu uskontunnustuksen.",
      cue: {
        type: "fuzzy",
        phrase: "Tunnustamme yhteisen kristillisen uskomme",
        threshold: 0.80,
      },
      actions: [
        { cam: { id: 1, preset: "wide" } },
        { switch: { cut: 1 } },
        { var: { section: "Uskontunnustus" } },
      ],
    },

    // 3. Rukous
    {
      id: "esirukous",
      title: "Yhteinen esirukous",
      section: "Rukous",
      notes: "Liturgi ja avustajat alttarin äärellä.",
      cue: {
        type: "fuzzy",
        phrase: "Rukoilkaamme yhdessä seurakunnan ja koko maailman puolesta",
        threshold: 0.80,
      },
      actions: [
        { cam: { id: 2, preset: "altar" } },
        { switch: { cut: 2 } },
        { var: { section: "Esirukous" } },
      ],
    },

    // 4. Ehtoollinen
    {
      id: "uhrivirsi",
      title: "Uhrivirsi (Kolehtivirsi)",
      section: "Ehtoollinen",
      notes: "Uhrivirren aikana katetaan ehtoollispöytä.",
      cue: {
        type: "fuzzy",
        phrase: "Veisaamme virren {{hymn_2}}",
        threshold: 0.75,
      },
      actions: [
        { pipgm: { hymn: "{{hymn_2}}" } },
        { switch: { dsk: 1, state: "on" } },
        { cam: { id: 1, preset: "altar-wide" } },
        { switch: { cut: 1 } },
        { var: { section: "Ehtoollinen" } },
      ],
    },
    {
      id: "ehtoollisrukous",
      title: "Ehtoollisrukous ja Asetussanat",
      section: "Ehtoollinen",
      notes: "Liturgi alttarilla kääntyy leivän ja viinin puoleen.",
      cue: {
        type: "fuzzy",
        phrase: "Herra olkoon teidän kanssanne",
        threshold: 0.85,
      },
      actions: [
        { switch: { dsk: 1, state: "off" } },
        { cam: { id: 2, preset: "altar-tight" } },
        { switch: { cut: 2 } },
        { var: { section: "Ehtoollisrukous" } },
      ],
    },
    {
      id: "ehtoollisen_jako",
      title: "Ehtoollisen jako",
      section: "Ehtoollinen",
      notes: "Ehtoollisvirret soivat ja ehtoollista jaetaan.",
      cue: {
        type: "sound",
        event: "music_start",
      },
      actions: [
        { cam: { id: 1, preset: "altar-wide" } },
        { switch: { cut: 1 } },
        { pipgm: { slide: "Ehtoollisvirret: {{communion_hymns}}" } },
        { var: { section: "Ehtoollisen jako" } },
      ],
    },

    // 5. Päätös
    {
      id: "siunaus",
      title: "Herran siunaus",
      section: "Päätös",
      notes: "Liturgi siunaa seurakunnan.",
      cue: {
        type: "fuzzy",
        phrase: "Herra siunatkoon teitä ja varjelkoon teitä",
        threshold: 0.85,
      },
      actions: [
        { cam: { id: 2, preset: "altar" } },
        { switch: { cut: 2 } },
        { graphic: { template: "speaker_strap", action: "show", role: "Liturgi", name: "{{liturgist}}", title: "{{liturgist_title}}" } },
        { var: { section: "Siunaus" } },
      ],
    },
    {
      id: "paatosvirsi",
      title: "Päätösvirsi",
      section: "Päätös",
      notes: "Päätösvirsi virsikirjasta.",
      cue: {
        type: "fuzzy",
        phrase: "Päätösvirtenä veisaamme virren {{hymn_3}}",
        threshold: 0.75,
      },
      actions: [
        { pipgm: { hymn: "{{hymn_3}}" } },
        { switch: { dsk: 1, state: "on" } },
        { cam: { id: 1, preset: "wide" } },
        { switch: { cut: 1 } },
        { var: { section: "Päätösvirsi" } },
      ],
    },
    {
      id: "paatossoitto",
      title: "Päätössoitto (Postludi)",
      section: "Päätös",
      notes: "Urkuri soittaa päätösmusiikin.",
      cue: {
        type: "sound",
        event: "music_stop",
      },
      actions: [
        { cam: { id: 1, preset: "organ" } },
        { switch: { cut: 1 } },
        { switch: { ftb: true } },
        { var: { section: "Päätös" } },
      ],
    },
  ],
};

export const TEMPLATE_SANAJUMALANPALVELUS: RundownV2 = {
  version: 2,
  title: "Sanajumalanpalvelus",
  service: "Sanajumalanpalvelus",
  church: "Riihimäen Keskuskirkko",
  date: "2026-11-01",
  connectors: {
    kirkkovuosi: createKirkkovuosiConnector(),
  },
  preflight: {
    fetch: [
      { connector: "kirkkovuosi", request: "tanaan" },
    ],
    variables: {
      liturgist: "Pastori Matti",
      liturgist_title: "Pastori",
      preacher: "Pastori Matti",
      preacher_title: "Pastori",
      cantor: "Kanttori Liisa",
      cantor_title: "Kanttori",
      hymn_1: "332",
      hymn_2: "450",
      hymn_3: "228",
      section: "Valmistelu",
    },
  },
  rundown: [
    {
      id: "alkusoitto",
      title: "Alkusoitto (Preludi)",
      section: "Johdanto",
      notes: "Urkumusiikki.",
      cue: {
        type: "sound",
        event: "music_stop",
      },
      actions: [
        { cam: { id: 1, preset: "organ" } },
        { switch: { cut: 1 } },
        { var: { section: "Johdanto" } },
      ],
    },
    {
      id: "alkusiunaus",
      title: "Alkusiunaus",
      section: "Johdanto",
      notes: "Liturgi alttarilla.",
      cue: {
        type: "fuzzy",
        phrase: "Isän ja Pojan ja Pyhän Hengen nimeen",
        threshold: 0.80,
      },
      actions: [
        { cam: { id: 2, preset: "altar" } },
        { switch: { cut: 2 } },
        { var: { section: "Alkusiunaus" } },
      ],
    },
    {
      id: "alkuvirsi",
      title: "Alkuvirsi",
      section: "Johdanto",
      notes: "Ensimmäinen virsi.",
      cue: {
        type: "fuzzy",
        phrase: "Veisaamme virren {{hymn_1}}",
        threshold: 0.75,
      },
      actions: [
        { pipgm: { hymn: "{{hymn_1}}" } },
        { switch: { dsk: 1, state: "on" } },
        { var: { section: "Alkuvirsi" } },
      ],
    },
    {
      id: "paivan_rukous",
      title: "Päivän rukous",
      section: "Sana",
      cue: {
        type: "fuzzy",
        phrase: "Rukoilkaamme",
        threshold: 0.85,
      },
      actions: [
        { cam: { id: 2, preset: "altar" } },
        { switch: { dsk: 1, state: "off" } },
        { switch: { cut: 2 } },
        { var: { section: "Päivän rukous" } },
      ],
    },
    {
      id: "evankeliumi",
      title: "Evankeliumi",
      section: "Sana",
      cue: {
        type: "fuzzy",
        phrase: "Nousemme kuulemaan pyhää evankeliumia",
        threshold: 0.80,
      },
      actions: [
        { cam: { id: 2, preset: "ambo" } },
        { switch: { cut: 2 } },
        { var: { section: "Evankeliumi" } },
      ],
    },
    {
      id: "saarna",
      title: "Saarna",
      section: "Sana",
      cue: {
        type: "sound",
        event: "speech_start",
      },
      actions: [
        { cam: { id: 3, preset: "pulpit" } },
        { switch: { cut: 3 } },
        { var: { section: "Saarna", speaker: "{{preacher}}" } },
      ],
    },
    {
      id: "esirukous",
      title: "Yhteinen esirukous ja Isä meidän",
      section: "Rukous",
      cue: {
        type: "fuzzy",
        phrase: "Rukoilkaamme yhdessä",
        threshold: 0.80,
      },
      actions: [
        { cam: { id: 2, preset: "altar" } },
        { switch: { cut: 2 } },
        { var: { section: "Rukous" } },
      ],
    },
    {
      id: "siunaus",
      title: "Herran siunaus",
      section: "Päätös",
      cue: {
        type: "fuzzy",
        phrase: "Herra siunatkoon teitä ja varjelkoon teitä",
        threshold: 0.85,
      },
      actions: [
        { cam: { id: 2, preset: "altar" } },
        { switch: { cut: 2 } },
        { var: { section: "Siunaus" } },
      ],
    },
    {
      id: "paatosvirsi",
      title: "Päätösvirsi",
      section: "Päätös",
      cue: {
        type: "fuzzy",
        phrase: "Päätösvirtenä veisaamme virren {{hymn_3}}",
        threshold: 0.75,
      },
      actions: [
        { pipgm: { hymn: "{{hymn_3}}" } },
        { switch: { dsk: 1, state: "on" } },
        { var: { section: "Päätösvirsi" } },
      ],
    },
  ],
};

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "messu",
    name: "Messu (Pääjumalanpalvelus)",
    description: "Perinteinen luterilainen ehtoollisjumalanpalvelus: Johdanto, Sana, Rukous, Ehtoollinen ja Päätös.",
    rundown: TEMPLATE_MESSU,
  },
  {
    id: "sanajumalanpalvelus",
    name: "Sanajumalanpalvelus",
    description: "Jumalanpalvelus ilman ehtoollista: Johdanto, Sana, Yhteinen esirukous ja Päätös.",
    rundown: TEMPLATE_SANAJUMALANPALVELUS,
  },
];
