import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function UsernameLink({
  username,
  className,
  prefix = true,
}: {
  username: string | null | undefined;
  className?: string;
  prefix?: boolean;
}) {
  const [, navigate] = useLocation();
  if (!username) return null;
  return (
    <button
      type="button"
      className={cn("hover:underline", className)}
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();
        navigate(`/profile/${username}`);
      }}
    >
      {prefix ? `@${username}` : username}
    </button>
  );
}
