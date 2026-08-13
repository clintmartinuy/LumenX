"use client";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        We couldn&apos;t load this page. Please try again in a moment.
      </p>
      <button
        onClick={reset}
        className="border-input hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
      >
        Try again
      </button>
    </main>
  );
}
