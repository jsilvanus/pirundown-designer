import type { FastifyPluginAsync } from "fastify";
import { TEMPLATES } from "../core/template-library.js";
import { yamlToState, stateToYaml } from "../core/yaml-sync.js";
import { formatSpeakerStrap } from "../core/speaker-registry.js";
import { getMockLectionaryDay } from "../core/lectionary.js";
import type { AppConfig } from "../config.js";

export const apiRoutes: FastifyPluginAsync<{ config: AppConfig }> = async (fastify, opts) => {
  const { config } = opts;

  // Health & Ecosystem Status
  fastify.get("/health", async () => {
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

  // Template Library
  fastify.get("/templates", async () => {
    return TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
    }));
  });

  fastify.get<{ Params: { id: string } }>("/templates/:id", async (request, reply) => {
    const template = TEMPLATES.find((t) => t.id === request.params.id);
    if (!template) {
      return reply.code(404).send({ error: `Mallipohjaa ei löydy: ${request.params.id}` });
    }
    return template;
  });

  // YAML Validation & Variable Warning inspection
  fastify.post<{ Body: { yaml?: string; state?: any } }>("/validate", async (request, reply) => {
    let yamlContent = request.body.yaml;
    if (!yamlContent && request.body.state) {
      try {
        yamlContent = stateToYaml(request.body.state);
      } catch (err: any) {
        return reply.code(400).send({ valid: false, errors: [`State muunnos epäonnistui: ${err.message}`], warnings: [] });
      }
    }

    if (typeof yamlContent !== "string") {
      return reply.code(400).send({ valid: false, errors: ["YAML-sisältö puuttuu"], warnings: [] });
    }

    const result = yamlToState(yamlContent);
    return result;
  });

  // Gateway-aware request helper
  const tryWithGatewayFallback = async (
    primaryUrl: string,
    fallbackUrl: string,
    options: RequestInit
  ): Promise<{ response: Response; targetUrl: string }> => {
    if (config.preferGateway) {
      const res = await fetch(fallbackUrl, options);
      return { response: res, targetUrl: fallbackUrl };
    }

    try {
      const res = await fetch(primaryUrl, options);
      return { response: res, targetUrl: primaryUrl };
    } catch (err: any) {
      // Primary direct connection failed (e.g. running over WAN/internet); try gateway
      try {
        const fallbackRes = await fetch(fallbackUrl, options);
        return { response: fallbackRes, targetUrl: fallbackUrl };
      } catch {
        throw err; // Re-throw original error if fallback also fails
      }
    }
  };

  // Direct Push to pirundown (or over gateway)
  fastify.post<{ Body: { yaml: string; targetUrl?: string } }>("/push", async (request, reply) => {
    const { yaml, targetUrl } = request.body;
    if (!yaml) {
      return reply.code(400).send({ success: false, error: "YAML-sisältö puuttuu" });
    }

    const validation = yamlToState(yaml);
    if (!validation.valid) {
      return reply.code(400).send({
        success: false,
        error: "Rundown-dokumentti ei läpäise Zod-validointia",
        details: validation.errors,
      });
    }

    const directEndpoint = `${config.pirundownUrl}/api/v1/rundown/load`;
    const gatewayEndpoint = `${config.pigatewayUrl}/api/v1/rundown/load`;

    try {
      let finalTarget = targetUrl;
      let response: Response;

      if (targetUrl) {
        response = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yaml }),
        });
        finalTarget = targetUrl;
      } else {
        const result = await tryWithGatewayFallback(directEndpoint, gatewayEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yaml }),
        });
        response = result.response;
        finalTarget = result.targetUrl;
      }

      const responseText = await response.text();
      let responseJson: any;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { raw: responseText };
      }

      if (!response.ok) {
        return reply.code(response.status).send({
          success: false,
          error: `Virhe ladattaessa ajolistaa (${response.status}): ${response.statusText}`,
          response: responseJson,
        });
      }

      return {
        success: true,
        endpoint: finalTarget,
        viaGateway: finalTarget?.includes(config.pigatewayUrl),
        response: responseJson,
        warnings: validation.warnings,
      };
    } catch (err: any) {
      return reply.code(502).send({
        success: false,
        error: `Yhteysvirhe (${directEndpoint} tai ${gatewayEndpoint}): ${err.message}`,
      });
    }
  });

  // Storage proxy endpoints: accessing storage directly or over gateway
  fastify.get("/storage", async (request, reply) => {
    const directUrl = `${config.pirundownUrl}/api/v1/storage`;
    const gatewayUrl = `${config.pigatewayUrl}/api/v1/rundown/storage`;

    try {
      const { response } = await tryWithGatewayFallback(directUrl, gatewayUrl, {
        headers: { Accept: "application/json" },
      });
      const text = await response.text();
      reply.type("application/json").status(response.status).send(text);
    } catch (err: any) {
      reply.code(502).send({ ok: false, error: `Ei yhteyttä tallennustilaan (suoraan tai gatewayn kautta): ${err.message}` });
    }
  });

  fastify.get<{ Params: { id: string } }>("/storage/:id", async (request, reply) => {
    const directUrl = `${config.pirundownUrl}/api/v1/storage/${request.params.id}`;
    const gatewayUrl = `${config.pigatewayUrl}/api/v1/rundown/storage/${request.params.id}`;

    try {
      const { response } = await tryWithGatewayFallback(directUrl, gatewayUrl, {
        headers: { ...(request.headers.accept ? { Accept: request.headers.accept } : {}) },
      });
      const text = await response.text();
      reply.type("application/json").status(response.status).send(text);
    } catch (err: any) {
      reply.code(502).send({ ok: false, error: `Ei yhteyttä tallennustilaan: ${err.message}` });
    }
  });

  fastify.post<{ Body: { id?: string; name?: string; yaml?: string; state?: any; load?: boolean } }>(
    "/storage",
    async (request, reply) => {
      let yamlContent = request.body.yaml;
      if (!yamlContent && request.body.state) {
        try {
          yamlContent = stateToYaml(request.body.state);
        } catch (err: any) {
          return reply.code(400).send({ ok: false, error: `State muunnos epäonnistui: ${err.message}` });
        }
      }

      if (!yamlContent) {
        return reply.code(400).send({ ok: false, error: "YAML-sisältö puuttuu tallennuspyynnöstä." });
      }

      const validation = yamlToState(yamlContent);
      if (!validation.valid) {
        return reply.code(400).send({
          ok: false,
          error: "Rundown-dokumentti ei läpäise Zod-validointia",
          details: validation.errors,
        });
      }

      const directUrl = `${config.pirundownUrl}/api/v1/storage`;
      const gatewayUrl = `${config.pigatewayUrl}/api/v1/rundown/storage`;

      try {
        const { response } = await tryWithGatewayFallback(directUrl, gatewayUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: request.body.id,
            name: request.body.name,
            yaml: yamlContent,
            load: request.body.load,
          }),
        });

        const text = await response.text();
        reply.type("application/json").status(response.status).send(text);
      } catch (err: any) {
        reply.code(502).send({ ok: false, error: `Ei yhteyttä tallennustilaan: ${err.message}` });
      }
    }
  );

  fastify.post<{ Params: { id: string } }>("/storage/:id/load", async (request, reply) => {
    const directUrl = `${config.pirundownUrl}/api/v1/storage/${request.params.id}/load`;
    const gatewayUrl = `${config.pigatewayUrl}/api/v1/rundown/storage/${request.params.id}/load`;

    try {
      const { response } = await tryWithGatewayFallback(directUrl, gatewayUrl, {
        method: "POST",
      });
      const text = await response.text();
      reply.type("application/json").status(response.status).send(text);
    } catch (err: any) {
      reply.code(502).send({ ok: false, error: `Ei yhteyttä palveluun: ${err.message}` });
    }
  });

  fastify.delete<{ Params: { id: string } }>("/storage/:id", async (request, reply) => {
    const directUrl = `${config.pirundownUrl}/api/v1/storage/${request.params.id}`;
    const gatewayUrl = `${config.pigatewayUrl}/api/v1/rundown/storage/${request.params.id}`;

    try {
      const { response } = await tryWithGatewayFallback(directUrl, gatewayUrl, {
        method: "DELETE",
      });
      const text = await response.text();
      reply.type("application/json").status(response.status).send(text);
    } catch (err: any) {
      reply.code(502).send({ ok: false, error: `Ei yhteyttä tallennustilaan: ${err.message}` });
    }
  });

  // Lectionary preview
  fastify.get<{ Querystring: { date?: string } }>("/lectionary/today", async (request) => {
    const date = request.query.date || new Date().toISOString().slice(0, 10);
    return getMockLectionaryDay(date);
  });

  // Speaker strap resolver adhering to role-only invariant
  fastify.post<{
    Body: { role: string; name?: string; title?: string; defaultParish?: string };
  }>("/speakers/resolve", async (request) => {
    const { role, name, title, defaultParish } = request.body;
    return formatSpeakerStrap({
      role,
      name,
      title,
      defaultParish: defaultParish || config.defaultParish,
    });
  });
};
