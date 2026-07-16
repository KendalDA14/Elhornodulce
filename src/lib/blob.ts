import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getPrivateUploadRoot,
  getPublicUploadRoot,
  resolveUploadPath,
} from "@/lib/upload-storage";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const SAFE_IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|avif|heic|heif)$/i;
const PUBLIC_PREFIXES = new Set([
  "products",
  "site",
  "uploads",
]);
const PRIVATE_PREFIXES = new Set(["sinpe/pending", "custom-requests"]);
const SAFE_PREFIXES = new Set([...PUBLIC_PREFIXES, ...PRIVATE_PREFIXES]);

function assertSafeUpload(file: File, prefix: string) {
  if (!SAFE_PREFIXES.has(prefix)) {
    throw new Error("Tipo de carga no permitido.");
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error("El archivo no puede superar 5 MB.");
  }
  if (!file.type.startsWith("image/") || !SAFE_IMAGE_EXTENSIONS.test(file.name)) {
    throw new Error("Solo se permiten imágenes.");
  }
}

export async function uploadBlobFile(file: File, prefix: string) {
  if (!file || file.size === 0) return null;
  assertSafeUpload(file, prefix);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const pathname = `${prefix}/${Date.now()}-${safeName}`;
  const isPrivate = PRIVATE_PREFIXES.has(prefix);

  if (isPrivate || !process.env.BLOB_READ_WRITE_TOKEN) {
    const uploadRoot = isPrivate ? getPrivateUploadRoot() : getPublicUploadRoot();
    const targetDir = path.join(uploadRoot, prefix);
    await mkdir(targetDir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    const diskPath = resolveUploadPath(uploadRoot, pathname.split("/"));
    await writeFile(diskPath, bytes);

    return {
      url: isPrivate
        ? `/api/uploads/private/${pathname.replaceAll("\\", "/")}`
        : `/uploads/${pathname.replaceAll("\\", "/")}`,
      path: pathname.replaceAll("\\", "/"),
    };
  }

  const blob = await put(pathname, file, {
    access: "public",
  });

  return {
    url: blob.url,
    path: pathname,
  };
}
