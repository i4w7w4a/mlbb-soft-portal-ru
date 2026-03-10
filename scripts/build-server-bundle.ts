import { promises as fs } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, ".deploy", "standalone");
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const staticRoot = path.join(projectRoot, ".next", "static");
const publicRoot = path.join(projectRoot, "public");
const contentRoot = path.join(projectRoot, "content");
const deployTemplatesRoot = path.join(projectRoot, "deploy");

async function assertExists(targetPath: string, label: string) {
  try {
    await fs.access(targetPath);
  } catch {
    throw new Error(`Missing ${label} at ${targetPath}. Run "npm run build" first.`);
  }
}

async function copyDirectory(sourcePath: string, destinationPath: string) {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.cp(sourcePath, destinationPath, {
    recursive: true,
    force: true,
  });
}

async function main() {
  await Promise.all([
    assertExists(standaloneRoot, "Next standalone output"),
    assertExists(staticRoot, "Next static output"),
    assertExists(publicRoot, "public assets"),
    assertExists(contentRoot, "content graph"),
  ]);

  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });

  await copyDirectory(standaloneRoot, outputRoot);
  await copyDirectory(staticRoot, path.join(outputRoot, ".next", "static"));
  await copyDirectory(publicRoot, path.join(outputRoot, "public"));
  await copyDirectory(contentRoot, path.join(outputRoot, "content"));

  await fs.copyFile(
    path.join(projectRoot, ".env.example"),
    path.join(outputRoot, ".env.example"),
  );

  try {
    await copyDirectory(deployTemplatesRoot, path.join(outputRoot, "deploy"));
  } catch {
    // Deploy templates are optional during local experiments.
  }

  console.log(`Standalone server bundle created at ${outputRoot}`);
  console.log("Upload this directory to your server and follow docs/deploy-self-hosted.md.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
