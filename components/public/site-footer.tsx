import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-border/60 border-t">
      <div className="text-muted-foreground mx-auto max-w-6xl space-y-2 px-4 py-8 text-sm">
        <p className="text-foreground font-medium">LumenX PH</p>
        <p>123 EDSA, Quezon City, Metro Manila</p>
        <p>Mon-Fri 9:00-18:00, Sat 9:00-15:00, Sun closed</p>
        <p>
          <a
            href="https://www.facebook.com/LumenxPH"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline underline-offset-4"
          >
            facebook.com/LumenxPH
          </a>
        </p>
        <p className="pt-4 text-xs">
          <Link href="/faq" className="hover:text-foreground underline underline-offset-4">
            FAQ
          </Link>
          {" · "}
          <Link href="/contact" className="hover:text-foreground underline underline-offset-4">
            Contact
          </Link>
        </p>
      </div>
    </footer>
  );
}
