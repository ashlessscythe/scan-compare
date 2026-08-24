import { cn } from "@/lib/utils";

/** Horizontal scroll wrapper so wide tables stay usable on small screens. */
export function ResponsiveTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("-mx-1 overflow-x-auto overscroll-x-contain", className)}>
      <div className="min-w-[28rem] px-1">{children}</div>
    </div>
  );
}
