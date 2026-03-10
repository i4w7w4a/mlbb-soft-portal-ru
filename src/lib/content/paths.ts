import path from "node:path";

const DEFAULT_CONTENT_DIRECTORY = "content";

export function resolveContentRoot(configuredRoot?: string | null) {
  const value = configuredRoot?.trim();

  if (!value) {
    return path.join(process.cwd(), DEFAULT_CONTENT_DIRECTORY);
  }

  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

export function getContentRoot() {
  return resolveContentRoot(process.env.MLBB_CONTENT_ROOT ?? process.env.CONTENT_ROOT);
}

