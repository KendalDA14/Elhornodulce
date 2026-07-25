import Image from "next/image";

type ResponsiveImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  dataAttribute?: string;
};

export function ResponsiveImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
  dataAttribute,
}: ResponsiveImageProps) {
  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={82}
        className={className}
        data-star-image={dataAttribute === "star" ? "" : undefined}
      />
    );
  }

  return (
    // External storage URLs are rendered directly so the image optimizer cannot proxy arbitrary hosts.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
      data-star-image={dataAttribute === "star" ? "" : undefined}
    />
  );
}
