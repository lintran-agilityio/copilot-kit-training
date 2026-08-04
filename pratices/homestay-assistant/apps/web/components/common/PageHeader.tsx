import { cn } from "@repo/utils";;

type PageHeaderProps = {
  label?: string;
  title?: string;
  className?: string;
};

export const PageHeader = ({
  label = "RESERVE",
  title = "Find your space",
  className,
}: PageHeaderProps) => {
  return (
    <div className={cn("mb-4", className)}>
      <p className="mb-2 text-[11px] font-medium tracking-[0.25em] text-zinc-500">
        {label}
      </p>
      <h1 className="font-serif text-4xl font-normal tracking-tight text-white md:text-5xl">
        {title}
      </h1>
    </div>
  );
}
