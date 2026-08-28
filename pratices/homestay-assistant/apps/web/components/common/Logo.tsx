import { cn } from "@repo/utils";

type LogoProps = {
  className?: string;
};

export const Logo = ({ className }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden
        className="flex size-9 items-center justify-center text-gold"
      >
        <svg viewBox="0 0 24 24" className="size-9" fill="none">
          <path
            d="M12 2.5 15 9l6.5 3-6.5 3-3 6.5L9 15l-6.5-3L9 9l3-6.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-lg font-semibold tracking-[0.28em] text-foreground">
          SPACES
        </span>
        <span className="mt-1 text-[10px] font-medium tracking-[0.3em] text-muted-foreground">
          BOUTIQUE HOMESTAY
        </span>
      </span>
    </div>
  );
};
