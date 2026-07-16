import path from "node:path";

function isHostingerDeployment(cwd: string) {
  const normalized = cwd.replaceAll("\\", "/");
  return process.platform !== "win32" && normalized.includes("/domains/") && path.basename(cwd) === "nodejs";
}

export function getUploadStorageRoot() {
  const configuredRoot = process.env.UPLOAD_STORAGE_ROOT?.trim();
  if (configuredRoot) return path.resolve(configuredRoot);

  const cwd = process.cwd();
  return isHostingerDeployment(cwd) ? path.resolve(cwd, "..", "storage") : cwd;
}

export function getPublicUploadRoot() {
  const storageRoot = getUploadStorageRoot();
  return storageRoot === process.cwd()
    ? path.join(storageRoot, "public", "uploads")
    : path.join(storageRoot, "public_uploads");
}

export function getPrivateUploadRoot() {
  return path.join(getUploadStorageRoot(), "private_uploads");
}

export function resolveUploadPath(root: string, parts: string[]) {
  if (!parts.length || parts.some((part) => !/^[a-zA-Z0-9._-]+$/.test(part))) {
    throw new Error("Ruta de archivo inválida.");
  }

  const resolvedRoot = path.resolve(root);
  const filePath = path.resolve(resolvedRoot, ...parts);
  if (filePath !== resolvedRoot && !filePath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("Ruta de archivo inválida.");
  }

  return filePath;
}

export function imageContentType(filePath: string) {
  const contentTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".avif": "image/avif",
    ".heic": "image/heic",
    ".heif": "image/heif",
  };

  return contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}
