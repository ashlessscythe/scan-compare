import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { ScanCompareVisual } from "@/components/landing/scan-compare-visual";
import { cn } from "@/lib/utils";

type LandingPageProps = {
  isAuthenticated: boolean;
  isPending?: boolean;
};

export function LandingPage({ isAuthenticated, isPending }: LandingPageProps) {
  const primaryHref = isAuthenticated ? (isPending ? "/pending" : "/scan") : "/register";
  const primaryLabel = isAuthenticated
    ? isPending
      ? "Check status"
      : "Go to app"
    : "Get Started";
  const secondaryHref = "/login";

  return (
    <div className="landing-page relative flex min-h-dvh flex-col overflow-x-hidden">
      <div className="landing-hero-glow pointer-events-none absolute inset-0" aria-hidden />

      <header className="relative z-20 flex items-center justify-end gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <ThemeToggle />
        {!isAuthenticated && (
          <Link
            href={secondaryHref}
            className={cn(buttonVariants({ variant: "ghost" }), "h-10 px-4 text-sm sm:h-9")}
          >
            Log in
          </Link>
        )}
        <Link
          href={primaryHref}
          className={cn(
            buttonVariants({ variant: isAuthenticated ? "default" : "outline" }),
            "h-10 px-4 text-sm sm:h-9",
          )}
        >
          {primaryLabel}
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        <section className="landing-hero relative flex min-h-[calc(100dvh-3.5rem)] flex-col justify-center px-4 pb-16 pt-2 sm:min-h-[calc(100dvh-4rem)] sm:px-6 sm:pb-20 lg:px-10">
          {/* Full-bleed product visual as atmospheric plane */}
          <div
            className="landing-hero-visual-plane pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/25 to-transparent sm:from-background/50 sm:via-background/15" />
            <div className="absolute inset-x-[-6%] bottom-[-6%] top-[48%] opacity-45 sm:inset-x-[-4%] sm:top-[30%] sm:opacity-65 lg:left-[38%] lg:right-[-10%] lg:top-[8%] lg:bottom-[-18%] lg:opacity-90">
              <ScanCompareVisual />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/80 to-transparent sm:h-32" />
          </div>

          <div className="relative mx-auto w-full max-w-6xl">
            <div className="landing-hero-copy max-w-xl lg:max-w-lg">
              <p className="landing-brand text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Scan Compare
              </p>
              <h1 className="mt-4 text-xl font-medium leading-snug text-foreground/90 sm:mt-5 sm:text-2xl lg:text-[1.75rem]">
                Scan verification built for corporate warehouse operations
              </h1>
              <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
                Give operators a clear scan-and-compare workflow so every shipment
                label is checked before it leaves the dock.
              </p>
              <div className="mt-7 sm:mt-8">
                <Link
                  href={primaryHref}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "inline-flex h-12 w-full items-center justify-center px-6 text-base sm:w-auto sm:min-w-[11rem]",
                  )}
                >
                  {primaryLabel}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 border-t border-border/60 bg-background/55 px-4 py-12 backdrop-blur-sm sm:px-6 sm:py-16 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Built for enterprise scan teams
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              A focused verification tool for high-volume labeling—compare scans,
              lock work to one operator, and keep audits ready without clutter.
            </p>
            <ul className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
              <li className="landing-feature space-y-2">
                <p className="text-sm font-semibold text-foreground">Scan &amp; compare</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Match pallet labels against shipment requirements in one guided pass.
                </p>
              </li>
              <li className="landing-feature space-y-2">
                <p className="text-sm font-semibold text-foreground">Controlled handoff</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Keep in-progress shipments locked so corporate ops stay consistent.
                </p>
              </li>
              <li className="landing-feature space-y-2">
                <p className="text-sm font-semibold text-foreground">Verification records</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Produce clear verification output your quality and logistics teams can trust.
                </p>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/50 px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        Scan Compare — label scan verification for corporate operations
      </footer>
    </div>
  );
}
