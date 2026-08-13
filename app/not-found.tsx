import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="text-muted-foreground text-sm">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link href="/" className="text-primary text-sm underline underline-offset-4">
        Back to home
      </Link>
    </main>
  );
}
