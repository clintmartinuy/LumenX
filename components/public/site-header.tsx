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
    <header className="bg-background/80 sticky top-0 z-40 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
        <Link href="/" className="font-heading text-lg font-bold tracking-tight sm:text-xl">
          LumenX <span className="text-primary">PH</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full px-3.5 py-2 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Button size="sm" className="rounded-full px-4 font-semibold" render={<Link href="/order" />}>
          Order Now
        </Button>
      </div>
    </header>
  );
}
