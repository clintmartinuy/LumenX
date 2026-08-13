import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Installation — LumenX PH",
};

export default function BookPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Book Installation</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        The booking wizard is built in Phase 5 — message us on Facebook in the meantime.
      </p>
    </main>
  );
}
