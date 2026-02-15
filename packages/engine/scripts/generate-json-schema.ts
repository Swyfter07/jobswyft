/**
 * Generate JSON Schema from Zod SiteConfigSchema.
 *
 * Usage: tsx scripts/generate-json-schema.ts
 * Output: ../../configs/sites/_schema.json
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import { SiteConfigSchema } from "../src/registry/config-schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = resolve(__dirname, "../../../configs/sites/_schema.json");

mkdirSync(dirname(outputPath), { recursive: true });

const jsonSchema = zodToJsonSchema(SiteConfigSchema, {
  name: "SiteConfig",
  $refStrategy: "none",
});

writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2) + "\n", "utf-8");

console.log(`JSON Schema written to ${outputPath}`);
