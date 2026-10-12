import { cn } from "@/lib/utils";

const WORDMARK_RATIO = 789 / 195;

export function PulseLogo({
  variant = "icon",
  size = 32,
  className,
  alt = "Pulse",
}: {
  variant?: "icon" | "wordmark";
  size?: number;
  className?: string;
  alt?: string;
}) {
  if (variant === "wordmark") {
    return (
      <img
        src="/pulse-wordmark.png"
        alt={alt}
        height={size}
        width={Math.round(size * WORDMARK_RATIO)}
        className={cn("h-auto select-none", className)}
        style={{ height: size, width: "auto" }}
      />
    );
  }

  return (
    <img
      src="/pulse-icon.png"
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-md select-none", className)}
    />
  );
}
