import { cn } from "@/lib/utils";

export function PulseLogo({
  size = 32,
  className,
  alt = "Pulse",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
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
