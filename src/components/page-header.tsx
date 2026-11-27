export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      {eyebrow ? (
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {description ? (
        <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>
      ) : null}
    </div>
  );
}
