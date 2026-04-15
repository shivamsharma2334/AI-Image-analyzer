import { Link } from "wouter";

const footerLinks = [
  { href: "/", label: "Analyzer" },
  { href: "/history", label: "History" },
  { href: "/stats", label: "Stats" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="shrink-0 border-t border-border bg-card/30 backdrop-blur"
    >
      <div className="max-w-6xl mx-auto px-6 py-4 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <p className="text-center sm:text-left">
          © {year}{" "}
          <span className="text-foreground/90 font-medium">VisionLab</span>
          <span className="hidden sm:inline"> · </span>
          <span className="block sm:inline">AI image analysis</span>
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1" aria-label="Footer">
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
