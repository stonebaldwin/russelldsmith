import { cn } from "@/lib/cn";
import { categoryLabel } from "@/lib/content";

/**
 * Post thumbnail with graceful fallback. Uses a plain <img> in a fixed
 * aspect-ratio box (no layout shift) — images are pre-sized from the source and
 * served with immutable cache headers, so this stays fast and fully static.
 */
export function Thumb({
  src,
  alt,
  category,
  ratio = "16/10",
  className,
  sizes,
  priority = false,
}: {
  src?: string;
  alt: string;
  category?: string;
  ratio?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn("relative overflow-hidden bg-line-strong", className)}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- static local images, no next/image optimizer dependency at launch
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent to-[#0f2340]">
          <span className="px-4 text-center font-serif text-lg font-medium text-white/85">
            {category ? categoryLabel(category) : "Russell Smith"}
          </span>
        </div>
      )}
    </div>
  );
}
