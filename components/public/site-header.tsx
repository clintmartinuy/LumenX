import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="border-border/60 bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          LumenX <span className="text-primary">PH</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <Button size="sm" render={<Link href="/book" />}>
          Book Installation
        </Button>
      </div>
    </header>
  );
}
