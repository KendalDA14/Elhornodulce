export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("REQUEST_BODY_TOO_LARGE");
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readRequestBytes(request: Request, maxBytes: number) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestBodyTooLargeError();
  }

  if (!request.body) return Buffer.alloc(0);

  const reader = request.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes);
}

export async function readBoundedText(request: Request, maxBytes: number) {
  return (await readRequestBytes(request, maxBytes)).toString("utf8");
}

export async function readBoundedFormData(request: Request, maxBytes: number) {
  const contentType = request.headers.get("content-type") || "";
  const bytes = await readRequestBytes(request, maxBytes);
  const response = new Response(bytes, {
    headers: { "Content-Type": contentType },
  });
  return response.formData();
}
