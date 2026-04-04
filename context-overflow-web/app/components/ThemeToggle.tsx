"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function useCoThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    const id = window.setTimeout(() => setIsDark(dark), 0);
    return () => clearTimeout(id);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.style.colorScheme = nextDark ? "dark" : "light";
    localStorage.setItem("co-theme", nextDark ? "dark" : "light");
    setIsDark(nextDark);
  }, []);

  return { isDark, toggleTheme };
}

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useCoThemeToggle();

  return (
    <Button
      type="button"
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="rounded-full"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
