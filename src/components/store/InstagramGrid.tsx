const TILE_COLORS = [
  "var(--patch-accent)",
  "var(--patch-accent-2)",
  "var(--patch-accent-3)",
  "var(--patch-ink)",
  "var(--patch-bg-alt)",
  "var(--patch-accent)",
];

export function InstagramGrid() {
  return (
    <section className="py-16">
      <h2 className="font-heading text-center text-2xl font-extrabold tracking-tight text-patch-ink">
        @atpatch on Instagram
      </h2>
      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-3 gap-1 px-1 sm:grid-cols-6 sm:px-6">
        {TILE_COLORS.map((color, i) => (
          <a
            key={i}
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-square transition-opacity hover:opacity-80"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </section>
  );
}
