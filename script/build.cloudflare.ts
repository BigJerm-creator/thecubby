import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm } from "fs/promises";
import path from "path";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building worker...");
  await esbuild({
    entryPoints: ["worker/index.ts"],
    platform: "browser",
    target: "esnext",
    bundle: true,
    format: "esm",
    outfile: "dist/public/_worker.js",
    conditions: ["worker", "browser"],
    define: { "process.env.NODE_ENV": '"production"' },
    alias: {
      "@shared": path.resolve("shared"),
    },
    minify: true,
    logLevel: "info",
  });

  console.log("done.");
}

buildAll().catch((err) => { console.error(err); process.exit(1); });
