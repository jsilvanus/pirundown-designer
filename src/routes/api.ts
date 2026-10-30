import type { FastifyPluginAsync } from "fastify";
import { TEMPLATES } from "../core/template-library.js";
import { yamlToState, stateToYaml, designerStateToRundownV2 } from "../core/yaml-sync.js";
import { formatSpeakerStrap, resolveSpeakerForCue } from "../core/speaker-registry.js";
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
      ecosystem: {
        pirundown: config.pirundownUrl,
        pigraphics: config.pigraphicsUrl,
        piswitch: config.piswitchUrl,
        picam: config.picamUrl,
        pigateway: config.pigatewayUrl,
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

  // Direct Push to pirundown
  fastify.post<{ Body: { yaml: string; targetUrl?: string } }>("/push", async (request, reply) => {
    const { yaml, targetUrl } = request.body;
    if (!yaml) {
      return reply.code(400).send({ success: false, error: "YAML-sisältö puuttuu" });
    }

    // Validate first before pushing
    const validation = yamlToState(yaml);
    if (!validation.valid) {
      return reply.code(400).send({
        success: false,
        error: "Rundown-dokumentti ei läpäise Zod-validointia",
        details: validation.errors,
      });
    }

    const endpoint = targetUrl || `${config.pirundownUrl}/api/v1/rundown/load`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml }),
      });

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
          error: `pirundown virhe (${response.status}): ${response.statusText}`,
          response: responseJson,
        });
      }

      return {
        success: true,
        endpoint,
        target: "pirundown",
        response: responseJson,
        warnings: validation.warnings,
      };
    } catch (err: any) {
      return reply.code(502).send({
        success: false,
        error: `Yhteysvirhe pirundown-palveluun (${endpoint}): ${err.message}`,
      });
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
