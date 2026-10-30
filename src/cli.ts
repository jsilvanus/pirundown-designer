import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";
import { yamlToState, stateToYaml } from "./core/yaml-sync.js";
import { TEMPLATES } from "./core/template-library.js";
import { formatSpeakerStrap } from "./core/speaker-registry.js";

export async function runCli(args: string[] = process.argv.slice(2)): Promise<void> {
  const command = args[0] || "serve";

  switch (command) {
    case "serve": {
      const config = loadConfig();
      const portIdx = args.indexOf("--port");
      if (portIdx !== -1 && args[portIdx + 1]) {
        config.port = parseInt(args[portIdx + 1], 10);
      }

      const server = await createServer(config);
      await server.listen({ port: config.port, host: config.host });
      console.log(`\n======================================================`);
      console.log(`   pirundown-designer käynnistetty porttiin :${config.port}`);
      console.log(`   Palvelee Riihimäen Keskuskirkon Rundown v2 -laadintaa`);
      console.log(`   HTTP API: http://localhost:${config.port}/api/v1/health`);
      console.log(`======================================================\n`);
      break;
    }

    case "validate": {
      const filePath = args[1];
      if (!filePath) {
        console.error("Virhe: Anna validoitava YAML-tiedosto (esim. pirundown-designer validate sunday-mass.yaml)");
        process.exit(1);
      }

      const fullPath = resolve(process.cwd(), filePath);
      const content = readFileSync(fullPath, "utf-8");
      const result = yamlToState(content);

      if (!result.valid) {
        console.error(`\n❌ Rundown v2 -validointi epäonnistui kohteessa ${filePath}:`);
        result.errors?.forEach((e) => console.error(`  - ${e}`));
        process.exit(1);
      }

      console.log(`\n✓ Rundown v2 -skeema kelvollinen (${filePath})`);
      if (result.warnings.length > 0) {
        console.warn(`\n⚠️  Havaittiin ${result.warnings.length} muuttujavaroitusta:`);
        result.warnings.forEach((w) => {
          console.warn(`  - [${w.field}] ${w.message}${w.suggestion ? ` (Ehdokas: {{${w.suggestion}}})` : ""}`);
        });
      } else {
        console.log(`✓ Kaikki {{muuttujat}} ovat määriteltyjä ja kelvollisia.`);
      }
      break;
    }

    case "template": {
      const templateName = (args[1] || "messu").toLowerCase();
      const template = TEMPLATES.find((t) => t.id === templateName);
      if (!template) {
        console.error(`Virhe: Tuntematon mallipohja "${templateName}". Vaihtoehdot: ${TEMPLATES.map((t) => t.id).join(", ")}`);
        process.exit(1);
      }

      const yamlOutput = stateToYaml({
        metadata: {
          title: template.rundown.title,
          service: template.rundown.service || "",
          church: template.rundown.church || "Riihimäen Keskuskirkko",
          date: template.rundown.date || "",
        },
        speakers: [
          { id: "1", role: "Liturgi", name: "Pastori Matti", title: "Pastori", hasName: true, isRoleOnly: false },
          { id: "2", role: "Saarnaaja", name: "Kirkkoherra Eeva", title: "Kirkkoherra", hasName: true, isRoleOnly: false },
          { id: "3", role: "Kanttori", name: "Kanttori Liisa", title: "Kanttori", hasName: true, isRoleOnly: false },
          { id: "4", role: "Tekstinlukija", hasName: false, isRoleOnly: true },
        ],
        hymns: { hymn_1: "332", hymn_2: "450", hymn_3: "228", communion_hymns: "227, 230" },
        connectors: template.rundown.connectors || {},
        preflightFetches: template.rundown.preflight?.fetch || [],
        customVariables: {},
        rundown: template.rundown.rundown,
      });

      const outIdx = args.indexOf("--output");
      if (outIdx !== -1 && args[outIdx + 1]) {
        const outPath = resolve(process.cwd(), args[outIdx + 1]);
        writeFileSync(outPath, yamlOutput, "utf-8");
        console.log(`Tallennettu mallipohja "${template.name}" tiedostoon: ${outPath}`);
      } else {
        console.log(yamlOutput);
      }
      break;
    }

    case "resolve-speaker": {
      const roleIdx = args.indexOf("--role");
      const nameIdx = args.indexOf("--name");
      const titleIdx = args.indexOf("--title");

      const role = roleIdx !== -1 ? args[roleIdx + 1] : "Liturgi";
      const name = nameIdx !== -1 ? args[nameIdx + 1] : undefined;
      const title = titleIdx !== -1 ? args[titleIdx + 1] : undefined;

      const strap = formatSpeakerStrap({ role, name, title });
      console.log(`\nStrap-resoluutio (invariantti: puuttuva nimi -> vain rooli):`);
      console.log(`  Rooli:       ${strap.role}`);
      console.log(`  Teksti 1:    ${strap.speaker}`);
      console.log(`  Teksti 2:    ${strap.title}`);
      console.log(`  Nimi annettu:${strap.hasName}`);
      console.log(`  Vain rooli:  ${strap.isRoleOnly}\n`);
      break;
    }

    case "help":
    default: {
      console.log(`
pirundown-designer - Riihimäen Keskuskirkon Rundown v2 -laadintatyökalu

Komennot:
  serve [--port 3410]                         Käynnistä suunnittelijan HTTP-palvelin
  validate <tiedosto.yaml>                    Validoi YAML Rundown v2 -skeeman ja muuttujat
  template <messu|sanajumalanpalvelus> [--output <tiedosto.yaml>]  Tulosta tai tallenna mallipohja
  resolve-speaker --role <rooli> [--name <nimi>] [--title <titteli>] Testaa puhujalaatan resoluutiota
  help                                        Näytä tämä ohje
      `);
      break;
    }
  }
}
