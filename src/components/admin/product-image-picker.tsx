"use client";

import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductImage } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ExistingImageItem = {
  kind: "existing";
  id: string;
  url: string;
  alt: string | null;
};

type NewImageItem = {
  kind: "new";
  token: string;
  file: File;
  url: string;
};

type ImageItem = ExistingImageItem | NewImageItem;

function newToken(file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `new-${Date.now()}-${safeName}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;
}

function updateInputFiles(input: HTMLInputElement | null, items: ImageItem[]) {
  if (!input) return;

  try {
    const transfer = new DataTransfer();
    items
      .filter((item): item is NewImageItem => item.kind === "new")
      .forEach((item) => transfer.items.add(item.file));
    input.files = transfer.files;
  } catch {
    // Some older mobile browsers do not allow assigning files programmatically.
    // The hidden order fields still keep existing images ordered correctly.
  }
}

export function ProductImagePicker({
  currentImages = [],
  isEditing,
}: {
  currentImages?: ProductImage[];
  isEditing?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const initialIds = useMemo(() => currentImages.map((image) => image.id), [currentImages]);
  const [items, setItems] = useState<ImageItem[]>(
    currentImages.map((image) => ({
      kind: "existing",
      id: image.id,
      url: image.url,
      alt: image.alt,
    })),
  );

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  const removedImageIds = initialIds.filter(
    (id) => !items.some((item) => item.kind === "existing" && item.id === id),
  );
  const imageOrder = items.map((item) => (item.kind === "existing" ? `existing:${item.id}` : `new:${item.token}`));
  const newImageTokens = items.filter((item): item is NewImageItem => item.kind === "new").map((item) => item.token);

  function setNextItems(nextItems: ImageItem[]) {
    setItems(nextItems);
    updateInputFiles(inputRef.current, nextItems);
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setNextItems(next);
  }

  function removeImage(index: number) {
    const item = items[index];
    if (item?.kind === "new") {
      URL.revokeObjectURL(item.url);
      objectUrlsRef.current.delete(item.url);
    }
    setNextItems(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <Label htmlFor="images">{isEditing ? "Agregar imágenes" : "Imágenes del producto"}</Label>
        <p className="text-xs text-muted-foreground">
          La primera imagen de la lista será la principal. Puedes moverlas antes de guardar.
        </p>
      </div>

      <input type="hidden" name="imageOrder" value={imageOrder.join(",")} />
      <input type="hidden" name="newImageTokens" value={newImageTokens.join(",")} />
      <input type="hidden" name="removedImageIds" value={removedImageIds.join(",")} />

      <Input
        ref={inputRef}
        id="images"
        name="images"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files || []);
          const nextNewImages = files.map((file) => {
            const url = URL.createObjectURL(file);
            objectUrlsRef.current.add(url);
            return {
              kind: "new" as const,
              token: newToken(file),
              file,
              url,
            };
          });
          setNextItems([...items, ...nextNewImages]);
        }}
      />

      {items.length ? (
        <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => (
              <div key={item.kind === "existing" ? item.id : item.token} className="overflow-hidden rounded-lg border bg-background">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.kind === "existing" ? item.alt || `Imagen ${index + 1}` : item.file.name}
                    className="aspect-square w-full object-cover"
                  />
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">
                      <Star className="h-3 w-3" />
                      Principal
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="truncate text-xs font-medium">
                    {index + 1}. {item.kind === "existing" ? "Imagen guardada" : item.file.name}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={() => moveImage(index, -1)}
                      aria-label="Mover imagen arriba"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      disabled={index === items.length - 1}
                      onClick={() => moveImage(index, 1)}
                      aria-label="Mover imagen abajo"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={() => removeImage(index)}
                      aria-label="Quitar imagen"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          <ImagePlus className="h-4 w-4" />
          Selecciona una o varias imágenes para el producto.
        </div>
      )}
    </div>
  );
}
