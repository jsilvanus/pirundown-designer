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
      console.log(`   HTTP API: http://localhost:${config.port}/health`);
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

    case "storage": {
      const config = loadConfig();
      const subAction = args[1] || "list";

      if (subAction === "list") {
        try {
          const res = await fetch(`${config.pirundownUrl}/api/v1/storage`);
          if (!res.ok) throw new Error(`Status ${res.status}`);
          const data = await res.json() as any;
          console.log(`\nPirundown Storage (${config.pirundownUrl}/api/v1/storage)`);
          console.log(`Tallennuskansio: ${data.storageDirectory || "storage/"}`);
          console.log(`Tiedostoja: ${data.count}\n`);
          console.table(
            (data.rundowns || []).map((r: any) => ({
              ID: r.id,
              Otsikko: r.title || r.name,
              Päivä: r.date || "-",
              Kohtia: r.itemCount,
              Aktiivinen: r.active ? "KYLLÄ" : "Ei",
              Muokattu: r.modifiedAt ? new Date(r.modifiedAt).toLocaleString("fi-FI") : "-",
            }))
          );
        } catch (err: any) {
          console.error(`Virhe haettaessa tallennustilaa: ${err.message}. Onko pirundown (:3400) käynnissä?`);
          process.exit(1);
        }
        break;
      }

      if (subAction === "save") {
        const filePath = args[2];
        if (!filePath) {
          console.error("Virhe: Määritä tallennettava YAML-tiedosto (esim. pirundown-designer storage save mass.yaml)");
          process.exit(1);
        }
        const fullPath = resolve(process.cwd(), filePath);
        const yamlContent = readFileSync(fullPath, "utf-8");
        const idIdx = args.indexOf("--id");
        const id = idIdx !== -1 ? args[idIdx + 1] : undefined;
        const load = args.includes("--load");

        try {
          const res = await fetch(`${config.pirundownUrl}/api/v1/storage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, yaml: yamlContent, load }),
          });
          const data = await res.json() as any;
          if (res.ok && data.ok) {
            console.log(`✓ Ajolista tallennettu pirundown-tallennustilaan: ${data.item.filename}`);
            if (data.loaded) {
              console.log(`✓ Ajolista asetettu aktiiviseksi pirundown-moottoriin (:3400).`);
            }
          } else {
            console.error(`❌ Tallennus epäonnistui: ${data.error}`);
            process.exit(1);
          }
        } catch (err: any) {
          console.error(`Virhe: ${err.message}`);
          process.exit(1);
        }
        break;
      }

      if (subAction === "get") {
        const id = args[2];
        if (!id) {
          console.error("Virhe: Määritä ajolistan ID (esim. pirundown-designer storage get sunday-mass)");
          process.exit(1);
        }
        try {
          const res = await fetch(`${config.pirundownUrl}/api/v1/storage/${id}`);
          if (!res.ok) throw new Error(`Status ${res.status}`);
          const data = await res.json() as any;
          console.log(data.rundown?.yaml || "");
        } catch (err: any) {
          console.error(`Virhe: ${err.message}`);
          process.exit(1);
        }
        break;
      }

      if (subAction === "load") {
        const id = args[2];
        if (!id) {
          console.error("Virhe: Määritä ladattavan ajolistan ID (esim. pirundown-designer storage load sunday-mass)");
          process.exit(1);
        }
        try {
          const res = await fetch(`${config.pirundownUrl}/api/v1/storage/${id}/load`, { method: "POST" });
          const data = await res.json() as any;
          if (res.ok && data.ok) {
            console.log(`✓ Ajolista '${id}' ladattu onnistuneesti pirundown-moottoriin (:3400).`);
          } else {
            console.error(`❌ Lataus epäonnistui: ${data.error}`);
            process.exit(1);
          }
        } catch (err: any) {
          console.error(`Virhe: ${err.message}`);
          process.exit(1);
        }
        break;
      }

      if (subAction === "delete") {
        const id = args[2];
        if (!id) {
          console.error("Virhe: Määritä poistettavan ajolistan ID (esim. pirundown-designer storage delete sunday-mass)");
          process.exit(1);
        }
        try {
          const res = await fetch(`${config.pirundownUrl}/api/v1/storage/${id}`, { method: "DELETE" });
          const data = await res.json() as any;
          if (res.ok && data.ok) {
            console.log(`✓ Ajolista '${id}' poistettu pirundown-tallennustilasta.`);
          } else {
            console.error(`❌ Poisto epäonnistui: ${data.error}`);
            process.exit(1);
          }
        } catch (err: any) {
          console.error(`Virhe: ${err.message}`);
          process.exit(1);
        }
        break;
      }

      console.error(`Tuntematon storage-alentoiminto "${subAction}". Vaihtoehdot: list, save, get, load, delete`);
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
  storage list                                Selaa pirundownin (:3400) tallennettuja ajolistoja
  storage save <tiedosto.yaml> [--id <nimi>]  Tallenna ajolista pirundowniin
  storage get <id>                            Tulosta tallennetun ajolistan YAML
  storage load <id>                           Aseta tallennettu ajolista aktiiviseksi pirundownissa
  storage delete <id>                         Poista ajolista pirundown-tallennustilasta
  help                                        Näytä tämä ohje
      `);
      break;
    }

  }
}
