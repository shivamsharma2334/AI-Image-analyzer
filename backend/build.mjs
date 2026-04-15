import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm, cp } from "node:fs/promises";
import { existsSync } from "node:fs";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/index.js")],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: path.resolve(distDir, "index.mjs"),
    packages: "external",
    logLevel: "info",
    sourcemap: "linked",
  });

  // If the frontend build exists, copy it into the backend artifact so a single deploy works.
  const frontendDistDir = path.resolve(artifactDir, "..", "frontend", "dist");
  const outPublicDir = path.resolve(distDir, "public");
  if (existsSync(frontendDistDir)) {
    await cp(frontendDistDir, outPublicDir, { recursive: true });
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
