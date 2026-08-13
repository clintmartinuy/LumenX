export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="bg-muted h-6 w-40 animate-pulse rounded" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted h-20 animate-pulse rounded-md" />
        ))}
      </div>
      <div className="bg-muted h-64 animate-pulse rounded-md" />
    </div>
  );
}
