import { runCli } from "./cli.js";

runCli().catch((err) => {
  console.error("Kriittinen virhe suorituksessa:", err);
  process.exit(1);
});
