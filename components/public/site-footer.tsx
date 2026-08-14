import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-border/60 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <p className="font-heading text-foreground text-lg font-bold">LumenX PH</p>
        <div className="text-muted-foreground mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <p>Dagupan City, Urdaneta City & Metro Manila</p>
          <p>Ships nationwide · 0923 523 1726</p>
          <a
            href="https://www.facebook.com/LumenxPH"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            facebook.com/LumenxPH
          </a>
        </div>
        <div className="text-muted-foreground mt-8 flex gap-4 border-t pt-6 text-xs">
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
