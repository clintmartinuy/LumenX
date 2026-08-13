"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">This page couldn&apos;t load. Please try again.</p>
      <button onClick={reset} className="border-input hover:bg-muted rounded-md border px-3 py-1.5 text-sm">
        Try again
      </button>
    </div>
  );
}
