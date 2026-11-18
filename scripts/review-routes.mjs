import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Static exports need real documents for direct entry/refresh as well as client navigation.
export async function writeReviewProductRoutes(output) {
  const { products } = JSON.parse(await readFile(new URL("./fixtures/public-catalog-20261115.json", import.meta.url), "utf8"));
  const shell = await readFile(resolve(output, "index.html"), "utf8");
  if (!shell.includes("<html")) throw new Error("Missing review shell");
  for (const { id } of products) {
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error("Invalid static product route");
    const directory = resolve(output, "products", id);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, "index.html"), shell);
  }
  return products.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error("Provide the static review output directory");
  console.log(`Static product entry routes: ${await writeReviewProductRoutes(resolve(process.argv[2]))}`);
}
