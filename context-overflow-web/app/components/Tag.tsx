export default function Tag({ name }: { name: string }) {
  return (
    <span className="inline-block rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)]/35 hover:text-[var(--accent)]">
      {name}
    </span>
  );
}
