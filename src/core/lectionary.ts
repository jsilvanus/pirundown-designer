import type { ConnectorDefSchema } from "../schema/rundown-v2.js";
import { z } from "zod";

export interface LectionaryDayData {
  holyDayName: string;
  date: string;
  liturgicalColor: string;
  theme: string;
  readings: {
    gospel: { reference: string; text?: string };
    epistle: { reference: string; text?: string };
    oldTestament?: { reference: string; text?: string };
    psalm?: { reference: string; text?: string };
  };
  prayer: string;
}

export type ConnectorDef = z.infer<typeof ConnectorDefSchema>;

/**
 * Generates the standard Kirkkovuosi liturgical connector definition
 * adhering to the varfetch schema in pirundown.
 */
export function createKirkkovuosiConnector(baseUrl: string = "https://kirkkovuosi.evl.fi/api/v1"): ConnectorDef {
  return {
    baseUrl,
    headers: [
      { key: "Accept-Language", value: "fi" },
      { key: "Content-Type", value: "application/json" },
    ],
    requests: {
      tanaan: {
        method: "GET",
        path: "/liturgy/today",
        responseType: "json",
        timeoutMs: 5000,
        mappings: [
          { jsonPath: "$.holyDay.name", variable: "pyhan_nimi" },
          { jsonPath: "$.holyDay.color", variable: "liturginen_vari" },
          { jsonPath: "$.holyDay.theme", variable: "pyhan_teema" },
          { jsonPath: "$.texts.gospel.reference", variable: "evankeliumi_viite" },
          { jsonPath: "$.texts.epistle.reference", variable: "epistola_viite" },
          { jsonPath: "$.texts.oldTestament.reference", variable: "vt_viite" },
          { jsonPath: "$.prayer.collect", variable: "paivan_rukous" },
        ],
      },
      paiva: {
        method: "GET",
        path: "/liturgy/date/{{date}}",
        responseType: "json",
        timeoutMs: 5000,
        mappings: [
          { jsonPath: "$.holyDay.name", variable: "pyhan_nimi" },
          { jsonPath: "$.texts.gospel.reference", variable: "evankeliumi_viite" },
          { jsonPath: "$.texts.epistle.reference", variable: "epistola_viite" },
        ],
      },
    },
  };
}

/**
 * Returns mock/fallback liturgical data for development & offline previews
 */
export function getMockLectionaryDay(dateStr: string = "2026-11-01"): LectionaryDayData {
  return {
    holyDayName: "22. sunnuntai helluntaista (Uskonpuhdistuksen muistopäivä)",
    date: dateStr,
    liturgicalColor: "vihreä / punainen",
    theme: "Usko ja epäilys / Uskon perustus",
    readings: {
      gospel: {
        reference: "Joh. 6:60-69",
        text: "Monet hänen opetuslapsistaan sanoivat tämän kuultuaan: 'Kovaa puhetta. Kuka voi kuunnella tuollaista?'",
      },
      epistle: {
        reference: "Room. 1:16-17",
        text: "Minä en häpeä evankeliumia, sillä se on Jumalan voima ja se tuo pelastuksen jokaiselle, joka uskoo.",
      },
      oldTestament: {
        reference: "Hab. 2:1-4",
      },
      psalm: {
        reference: "Ps. 46:2-8",
      },
    },
    prayer: "Kaikkivaltias, armollinen Jumala. Anna meille uskoa, joka kestää epäilykset ja koettelemukset.",
  };
}
