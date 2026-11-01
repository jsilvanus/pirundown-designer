import fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { type AppConfig } from "./config.js";
import { apiRoutes } from "./routes/api.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function createServer(config: AppConfig): Promise<FastifyInstance> {
  const app = fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  // Health & Ecosystem Status (Pi ecosystem standard: GET /health)
  app.get("/health", async () => {
    return {
      status: "ok",
      service: "pirundown-designer",
      port: config.port,
      preferGateway: config.preferGateway,
      ecosystem: {
        pirundown: config.pirundownUrl,
        pigateway: config.pigatewayUrl,
        pigraphics: config.pigraphicsUrl,
        piswitch: config.piswitchUrl,
        picam: config.picamUrl,
      },
    };
  });

  // API Routes
  await app.register(apiRoutes, { prefix: "/api/v1", config });
  await app.register(apiRoutes, { prefix: "/api", config });

  // Static UI if built
  const uiDistPath = join(__dirname, "..", "ui", "dist");
  if (existsSync(uiDistPath)) {
    await app.register(fastifyStatic, {
      root: uiDistPath,
      prefix: "/",
    });

    app.setNotFoundHandler((req, reply) => {
      if (req.raw.url && req.raw.url.startsWith("/api")) {
        reply.code(404).send({ error: "Reittiä ei löydy" });
      } else {
        reply.sendFile("index.html");
      }
    });
  } else {
    // Development or headless mode fallback
    app.get("/", async (_req, reply) => {
      reply.type("text/html").send(`
        <!DOCTYPE html>
        <html lang="fi">
        <head>
          <meta charset="UTF-8">
          <title>pirundown-designer | Pi Ecosystem</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #121016; color: #eae1da; padding: 2rem; }
            h1 { color: #d3bbff; }
            a { color: #8455ef; text-decoration: none; }
            code { background: #231f29; padding: 0.2rem 0.4rem; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>pirundown-designer :${config.port}</h1>
          <p>Visuaalinen Rundown v2 -laadintatyökalu ja kirkkovuosiautomaation ohjaus.</p>
          <p>Käynnistä kehityskäyttöliittymä ajamalla: <code>pnpm -C ui run dev</code></p>
          <ul>
            <li><a href="/health">/health</a></li>
            <li><a href="/api/v1/templates">/api/v1/templates</a></li>
            <li><a href="/api/v1/lectionary/today">/api/v1/lectionary/today</a></li>
          </ul>
        </body>
        </html>
      `);
    });
  }

  return app;
}
