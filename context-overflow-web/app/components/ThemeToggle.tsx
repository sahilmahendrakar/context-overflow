"use client";

export default function ThemeToggle() {
  function toggleTheme() {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.style.colorScheme = nextDark ? "dark" : "light";
    localStorage.setItem("co-theme", nextDark ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      aria-label="Toggle theme"
    >
      Theme
    </button>
  );
}
