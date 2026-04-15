import { Link, useLocation } from "wouter";
import { ScanSearch, History, BarChart3 } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Analyzer", icon: ScanSearch },
    { href: "/history", label: "History", icon: History },
    { href: "/stats", label: "Stats", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1 flex-col md:flex-row min-h-0">
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/50 backdrop-blur shrink-0">
          <div className="p-6">
            <div className="flex items-center gap-3 text-primary font-bold text-xl mb-8">
              <ScanSearch className="w-8 h-8 text-accent" />
              <span>VisionLab</span>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-accent" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="flex-1 p-6 md:p-12 overflow-y-auto relative min-h-0">
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay z-0"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
            }}
          />
          <div className="max-w-6xl mx-auto relative z-10">{children}</div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
