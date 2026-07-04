"use client";

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

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt="El horno dulce"
      className={compact ? "h-10 w-10 rounded-full object-cover" : "h-11 w-11 rounded-full object-cover"}
    />
  );
}
