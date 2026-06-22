import { cn } from "@/utils";

type LogoProps = {
  className?: string;
};

export const Logo = ({ className }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-8 items-center justify-center rounded-md bg-[#E6C547]">
        <div className="size-3 rounded-sm bg-[#0a0a0a]" />
      </div>
      <span className="text-sm font-semibold tracking-[0.2em] text-white">
        SPACES
      </span>
    </div>
  );
}
