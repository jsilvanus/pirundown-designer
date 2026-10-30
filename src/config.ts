export interface AppConfig {
  port: number;
  host: string;
  pirundownUrl: string;
  pigraphicsUrl: string;
  piswitchUrl: string;
  picamUrl: string;
  pigatewayUrl: string;
  defaultParish: string;
  preferGateway: boolean;
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || "3410", 10),
    host: process.env.HOST || "0.0.0.0",
    pirundownUrl: (process.env.PIRUNDOWN_URL || "http://localhost:3400").replace(/\/+$/, ""),
    pigraphicsUrl: (process.env.PIGRAPHICS_URL || "http://localhost:3107").replace(/\/+$/, ""),
    piswitchUrl: (process.env.PISWITCH_URL || "http://localhost:3106").replace(/\/+$/, ""),
    picamUrl: (process.env.PICAM_URL || "http://localhost:3300").replace(/\/+$/, ""),
    pigatewayUrl: (process.env.PIGATEWAY_URL || "http://localhost:3100").replace(/\/+$/, ""),
    defaultParish: process.env.DEFAULT_PARISH || "Riihimäen Keskuskirkko",
    preferGateway: process.env.PREFER_GATEWAY === "true" || process.env.USE_GATEWAY === "true",
  };
}
