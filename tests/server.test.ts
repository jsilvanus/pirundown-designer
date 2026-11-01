import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.js";
import { loadConfig } from "../src/config.js";
import Fastify from "fastify";

test("server: /health returns ecosystem urls and port 3410", async () => {
  const config = loadConfig();
  const server = await createServer(config);

  const res = await server.inject({
    method: "GET",
    url: "/health",
  });

  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.service, "pirundown-designer");
  assert.equal(data.port, 3410);
  assert.equal(data.ecosystem.pirundown, "http://localhost:3400");
  assert.equal(data.ecosystem.pigateway, "http://localhost:3100");
});

test("server: /templates returns Messu and Sanajumalanpalvelus", async () => {
  const config = loadConfig();
  const server = await createServer(config);

  const res = await server.inject({
    method: "GET",
    url: "/api/v1/templates",
  });

  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.ok(Array.isArray(data));
  assert.ok(data.some((t: any) => t.id === "messu"));
  assert.ok(data.some((t: any) => t.id === "sanajumalanpalvelus"));
});

test("server: /validate checks schema and outputs variables warnings", async () => {
  const config = loadConfig();
  const server = await createServer(config);

  const validYaml = `
version: 2
title: "Messu"
preflight:
  variables:
    preacher: "Pastori Matti"
rundown:
  - id: "saarna"
    title: "Saarna"
    actions:
      - var: { speaker: "{{preacher}}" }
`;

  const res = await server.inject({
    method: "POST",
    url: "/api/v1/validate",
    payload: { yaml: validYaml },
  });

  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.valid, true);
  assert.equal(data.warnings.length, 0);
});

test("server: /speakers/resolve enforces role-only when name is missing", async () => {
  const config = loadConfig();
  const server = await createServer(config);

  const res = await server.inject({
    method: "POST",
    url: "/api/v1/speakers/resolve",
    payload: { role: "Tekstinlukija", name: "" },
  });

  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.speaker, "Tekstinlukija");
  assert.equal(data.hasName, false);
  assert.equal(data.isRoleOnly, true);
});

test("server: /storage works over gateway when preferGateway is true", async () => {
  // Spin up a mock pigateway server
  const mockGateway = Fastify();
  mockGateway.get("/api/v1/rundown/storage", async () => {
    return { ok: true, count: 1, rundowns: [{ id: "gateway-messu", title: "Gateway Mass" }] };
  });
  await mockGateway.listen({ port: 0 });
  const gatewayPort = (mockGateway.server.address() as any).port;

  try {
    const config = loadConfig();
    config.pirundownUrl = "http://localhost:59998"; // Direct pirundown unreachable
    config.pigatewayUrl = `http://127.0.0.1:${gatewayPort}`;
    config.preferGateway = true;

    const server = await createServer(config);

    const res = await server.inject({
      method: "GET",
      url: "/api/v1/storage",
    });

    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.equal(data.ok, true);
    assert.equal(data.rundowns[0].id, "gateway-messu");
  } finally {
    await mockGateway.close();
  }
});
