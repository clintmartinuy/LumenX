const SPEC_LABELS: Record<string, string> = {
  wattage: "Wattage",
  lumens: "Lumens",
  color_temp: "Color Temp",
  lens_size: "Lens Size",
  beam_type: "Beam Type",
  voltage: "Voltage",
  ip_rating: "IP Rating",
  housing: "Housing",
  lifespan_hours: "Lifespan (hrs)",
};

// Renders only the spec keys actually present on the product (§5.1 — "all optional,
// render only present keys").
export function SpecChips({
  specs,
  keys,
  className,
}: {
  specs: Record<string, string | number> | null | undefined;
  keys?: string[];
  className?: string;
}) {
  if (!specs) return null;
  const entries = Object.entries(specs).filter(([key]) => !keys || keys.includes(key));
  if (entries.length === 0) return null;

  return (
    <div className={className ? className : "flex flex-wrap gap-1.5"}>
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-mono text-[11px]"
          title={SPEC_LABELS[key] ?? key}
        >
          {value}
        </span>
      ))}
    </div>
  );
}
