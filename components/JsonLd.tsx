/** Renders a JSON-LD structured-data script. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here; no user input reaches it unescaped.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
