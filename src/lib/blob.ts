import { del, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  getPrivateUploadRoot,
  getPublicUploadRoot,
  resolveUploadPath,
} from "@/lib/upload-storage";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 8_000;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_ANIMATION_FRAMES = 100;
const SAFE_IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|avif|heic|heif)$/i;
const PUBLIC_PREFIXES = new Set(["products", "site", "uploads"]);
const PRIVATE_PREFIXES = new Set(["sinpe/pending", "custom-requests"]);
const SAFE_PREFIXES = new Set([...PUBLIC_PREFIXES, ...PRIVATE_PREFIXES]);

type ValidatedImage = {
  bytes: Buffer;
  contentType: string;
};

function detectImageContentType(bytes: Buffer) {
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 6) {
    const signature = bytes.subarray(0, 6).toString("ascii");
    if (signature === "GIF87a" || signature === "GIF89a") return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = bytes.subarray(8, 12).toString("ascii").toLowerCase();
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand)) {
      return "image/heic";
    }
  }
  return null;
}

function extensionMatchesContentType(fileName: string, contentType: string) {
  const extension = path.extname(fileName).toLowerCase();
  const allowedExtensions: Record<string, string[]> = {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    "image/avif": [".avif"],
    "image/heic": [".heic", ".heif"],
  };
  return allowedExtensions[contentType]?.includes(extension) === true;
}

async function validateUpload(file: File, prefix: string): Promise<ValidatedImage> {
  if (!SAFE_PREFIXES.has(prefix)) {
    throw new Error("Tipo de carga no permitido.");
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
    throw new Error("El archivo no puede superar 5 MB.");
  }
  if (
    file.name.length > 180 ||
    !file.type.startsWith("image/") ||
    !SAFE_IMAGE_EXTENSIONS.test(file.name)
  ) {
    throw new Error("Solo se permiten imágenes.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = detectImageContentType(bytes);
  if (!contentType || !extensionMatchesContentType(file.name, contentType)) {
    throw new Error("El contenido del archivo no corresponde a una imagen permitida.");
  }

  try {
    const metadata = await sharp(bytes, {
      animated: true,
      failOn: "error",
      limitInputPixels: MAX_IMAGE_PIXELS,
    }).metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > MAX_IMAGE_DIMENSION ||
      metadata.height > MAX_IMAGE_DIMENSION ||
      (metadata.pages || 1) > MAX_ANIMATION_FRAMES
    ) {
      throw new Error("Dimensiones de imagen no permitidas.");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Dimensiones de imagen no permitidas.") {
      throw error;
    }
    throw new Error("La imagen está dañada o no se puede procesar.");
  }

  return { bytes, contentType };
}

export async function uploadBlobFile(file: File, prefix: string) {
  if (!file || file.size === 0) return null;
  const validated = await validateUpload(file, prefix);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
  const pathname = `${prefix}/${randomUUID()}-${safeName}`;
  const isPrivate = PRIVATE_PREFIXES.has(prefix);

  if (isPrivate || !process.env.BLOB_READ_WRITE_TOKEN) {
    const uploadRoot = isPrivate ? getPrivateUploadRoot() : getPublicUploadRoot();
    const targetDir = path.join(uploadRoot, prefix);
    await mkdir(targetDir, { recursive: true });
    const diskPath = resolveUploadPath(uploadRoot, pathname.split("/"));
    await writeFile(diskPath, validated.bytes);

    return {
      url: isPrivate
        ? `/api/uploads/private/${pathname.replaceAll("\\", "/")}`
        : `/uploads/${pathname.replaceAll("\\", "/")}`,
      path: pathname.replaceAll("\\", "/"),
    };
  }

  const blob = await put(pathname, validated.bytes, {
    access: "public",
    contentType: validated.contentType,
  });

  return {
    url: blob.url,
    path: pathname,
  };
}

export async function deleteUploadedFile(upload: { url: string; path: string } | null | undefined) {
  if (!upload?.path) return;

  const isPrivate = [...PRIVATE_PREFIXES].some((prefix) => upload.path.startsWith(`${prefix}/`));
  const isPublic = [...PUBLIC_PREFIXES].some((prefix) => upload.path.startsWith(`${prefix}/`));
  if (!isPrivate && !isPublic) return;

  if (upload.url.startsWith("/") || !process.env.BLOB_READ_WRITE_TOKEN) {
    const root = isPrivate ? getPrivateUploadRoot() : getPublicUploadRoot();
    const diskPath = resolveUploadPath(root, upload.path.split("/"));
    await unlink(diskPath).catch((error: unknown) => {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : "";
      if (code !== "ENOENT") throw error;
    });
    return;
  }

  if (/^https:\/\/[a-z0-9.-]+\.public\.blob\.vercel-storage\.com\//i.test(upload.url)) {
    await del(upload.url);
  }
}
