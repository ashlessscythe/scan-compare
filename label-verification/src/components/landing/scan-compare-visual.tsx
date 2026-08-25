export function ScanCompareVisual() {
  return (
    <div className="landing-scan-stage relative aspect-[4/3] w-full sm:aspect-[16/10]" aria-hidden>
      <div className="landing-scan-panel absolute inset-[8%] overflow-hidden rounded-[calc(var(--radius)*1.2)] border border-border/70 bg-card/55 shadow-[0_24px_60px_-28px_oklch(0.3_0.04_260/35%)] backdrop-blur-md dark:bg-card/40">
        <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5 sm:px-4">
          <span className="size-2 rounded-full bg-chart-1/80" />
          <span className="size-2 rounded-full bg-chart-2/70" />
          <span className="size-2 rounded-full bg-muted-foreground/35" />
          <span className="ml-2 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
            Scan verification
          </span>
        </div>

        <div className="grid h-[calc(100%-2.5rem)] grid-cols-2 gap-2 p-2.5 sm:gap-3 sm:p-3">
          <div className="landing-scan-lane flex flex-col gap-2 rounded-[calc(var(--radius)*0.9)] border border-border/50 bg-background/50 p-2 sm:p-3">
            <p className="text-[0.65rem] font-medium text-muted-foreground sm:text-xs">Expected</p>
            <div className="landing-scan-bar h-2.5 w-[78%] rounded-full bg-primary/25" />
            <div className="landing-scan-bar h-2.5 w-[62%] rounded-full bg-primary/18" style={{ animationDelay: "120ms" }} />
            <div className="landing-scan-bar h-2.5 w-[70%] rounded-full bg-primary/18" style={{ animationDelay: "220ms" }} />
            <div className="mt-auto flex items-end justify-between gap-2 pt-2">
              <div className="h-10 flex-1 rounded-md border border-dashed border-border/70 bg-muted/40" />
              <div className="hidden h-10 w-10 rounded-md border border-border/60 bg-secondary/80 sm:block" />
            </div>
          </div>

          <div className="landing-scan-lane flex flex-col gap-2 rounded-[calc(var(--radius)*0.9)] border border-primary/25 bg-primary/5 p-2 sm:p-3">
            <p className="text-[0.65rem] font-medium text-muted-foreground sm:text-xs">Scanned</p>
            <div className="landing-scan-bar h-2.5 w-[78%] rounded-full bg-chart-1/55" />
            <div className="landing-scan-bar h-2.5 w-[62%] rounded-full bg-chart-1/40" style={{ animationDelay: "160ms" }} />
            <div className="landing-scan-bar h-2.5 w-[70%] rounded-full bg-chart-1/40" style={{ animationDelay: "260ms" }} />
            <div className="mt-auto flex items-end justify-between gap-2 pt-2">
              <div className="relative h-10 flex-1 overflow-hidden rounded-md border border-chart-1/35 bg-background/60">
                <div className="landing-scan-beam absolute inset-y-1 left-0 w-1/3 rounded-sm bg-chart-1/35" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-chart-1 text-[0.65rem] font-semibold text-primary-foreground sm:text-xs">
                OK
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
