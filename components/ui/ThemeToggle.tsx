"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("cantu-theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = stored === "dark" || stored === "light" ? stored : preferred;
    document.documentElement.dataset.theme = initial;
    const frame = window.requestAnimationFrame(() => setTheme(initial));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("cantu-theme", next);
    setTheme(next);
  }

  return (
    <button
      className="themeToggle"
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Világos mód bekapcsolása" : "Sötét mód bekapcsolása"}
      aria-pressed={theme === "dark"}
    />
  );
}
