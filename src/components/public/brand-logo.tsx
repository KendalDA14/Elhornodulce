"use client";

import Image from "next/image";

export function BrandLogo({
  compact = false,
  logoSrc,
}: {
  compact?: boolean;
  logoSrc?: string | null;
}) {
  if (!logoSrc) {
    return null;
  }

  const size = compact ? 40 : 44;
  const className = compact ? "h-10 w-10 rounded-full object-cover" : "h-11 w-11 rounded-full object-cover";

  if (logoSrc.startsWith("/")) {
    return (
      <Image
        src={logoSrc}
        alt="El horno dulce"
        width={size}
        height={size}
        sizes={`${size}px`}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt="El horno dulce"
      width={size}
      height={size}
      decoding="async"
      className={className}
    />
  );
}
