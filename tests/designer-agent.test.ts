import { test } from "node:test";
import assert from "node:assert";
import { createServer } from "../src/server.js";
import { loadConfig } from "../src/config.js";

test("server: /designer/state returns session state snapshot", async () => {
  const config = loadConfig();
  const app = await createServer(config);

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/designer/state",
  });

  assert.strictEqual(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.strictEqual(data.valid, true);
  assert.ok(data.state);
  assert.ok(data.state.rundown.length > 0);
  assert.ok(data.yaml.includes("version: 2"));
  assert.ok(Array.isArray(data.chatHistory));
});

test("server: /designer/agent/chat compiles liturgical requests and updates items", async () => {
  const config = loadConfig();
  const app = await createServer(config);

  // Ask agent to add graphics to sermon
  const chatRes = await app.inject({
    method: "POST",
    url: "/api/v1/designer/agent/chat",
    payload: {
      message: "Lisää saarnaan pulpit ja grafiikat",
    },
  });

  assert.strictEqual(chatRes.statusCode, 200);
  const data = JSON.parse(chatRes.body);
  assert.strictEqual(data.ok, true);
  assert.ok(data.message.content.includes("pulpit"));
  assert.strictEqual(data.actionsExecuted.length, 1);

  // Check state snapshot after agent turn
  const sermon = data.snapshot.state.rundown.find((i: any) => i.id === "saarna");
  assert.ok(sermon);
  assert.strictEqual(sermon.ai?.targetZone, "pulpit");
  assert.deepStrictEqual(sermon.ai?.graphicsOptions?.lowerThird, ["lower-third-speaker"]);
  assert.deepStrictEqual(sermon.ai?.graphicsOptions?.overlay, ["scripture-reading"]);
});

test("server: /designer/items adds and deletes item", async () => {
  const config = loadConfig();
  const app = await createServer(config);

  // Add item
  const addRes = await app.inject({
    method: "POST",
    url: "/api/v1/designer/items",
    payload: {
      item: {
        id: "test_item_1",
        title: "Testi Alkusoitto",
        section: "Johdanto",
        cue: { type: "manual" },
      },
    },
  });

  assert.strictEqual(addRes.statusCode, 200);
  const addData = JSON.parse(addRes.body);
  assert.strictEqual(addData.item.id, "test_item_1");

  // Delete item
  const delRes = await app.inject({
    method: "DELETE",
    url: "/api/v1/designer/items/test_item_1",
  });

  assert.strictEqual(delRes.statusCode, 200);
  const delData = JSON.parse(delRes.body);
  assert.strictEqual(delData.ok, true);
});
