"use client";

import { ArrowDown, ArrowUp, ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import type { ProductImage } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SelectedImage = {
  file: File;
  url: string;
};

function fileListFromImages(images: SelectedImage[]) {
  const transfer = new DataTransfer();
  images.forEach((image) => transfer.items.add(image.file));
  return transfer.files;
}

export function ProductImagePicker({
  currentImages = [],
  isEditing,
}: {
  currentImages?: ProductImage[];
  isEditing?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);

  function updateImages(nextImages: SelectedImage[]) {
    setSelectedImages(nextImages);
    if (inputRef.current) inputRef.current.files = fileListFromImages(nextImages);
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= selectedImages.length) return;
    const next = [...selectedImages];
    [next[index], next[target]] = [next[target], next[index]];
    updateImages(next);
  }

  return (
    <div className="grid gap-3">
      <Label htmlFor="images">{isEditing ? "Agregar imagenes" : "Imagenes"}</Label>
      <Input
        ref={inputRef}
        id="images"
        name="images"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files || []);
          selectedImages.forEach((image) => URL.revokeObjectURL(image.url));
          updateImages(files.map((file) => ({ file, url: URL.createObjectURL(file) })));
        }}
      />

      {currentImages.length ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Imagenes actuales</p>
          <div className="grid grid-cols-3 gap-2">
            {currentImages.map((image, index) => (
              <div key={image.id} className="overflow-hidden rounded-md border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt || `Imagen ${index + 1}`} className="aspect-square w-full object-cover" />
                <p className="px-2 py-1 text-xs text-muted-foreground">{index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {selectedImages.length ? (
        <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Orden de nuevas imagenes. La primera sera la imagen principal.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {selectedImages.map((image, index) => (
              <div key={`${image.file.name}-${index}`} className="overflow-hidden rounded-lg border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.file.name} className="aspect-square w-full object-cover" />
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="truncate text-xs font-medium">{index + 1}. {image.file.name}</span>
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
                      disabled={index === selectedImages.length - 1}
                      onClick={() => moveImage(index, 1)}
                      aria-label="Mover imagen abajo"
                    >
                      <ArrowDown className="h-3 w-3" />
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
          Selecciona varias imagenes para ordenar la principal antes de guardar.
        </div>
      )}
    </div>
  );
}
