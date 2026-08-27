import type { KeyboardEvent } from "react";
import type { InputMode } from "@/lib/input/types";
import styles from "./app.module.css";

const modes: Array<{ mode: InputMode; icon: string; label: string }> = [
  { mode: "listen", icon: "🎧", label: "Hallgasd" },
  { mode: "audio", icon: "🎵", label: "Hangfájl" },
  { mode: "text", icon: "📝", label: "Szöveg" },
];

type InputModeTabsProps = {
  activeMode: InputMode;
  onSelect: (mode: InputMode) => void;
};

export function InputModeTabs({ activeMode, onSelect }: InputModeTabsProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = modes.findIndex(({ mode }) => mode === activeMode);
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? modes.length - 1
          : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + modes.length) % modes.length;
    const nextMode = modes[nextIndex]?.mode ?? "listen";
    onSelect(nextMode);
    requestAnimationFrame(() => {
      document.getElementById(`input-mode-${nextMode}`)?.focus();
    });
  }

  return (
    <div
      className={styles.modeTabs}
      role="tablist"
      aria-label="Forrás típusa"
      onKeyDown={handleKeyDown}
    >
      {modes.map(({ mode, icon, label }) => (
        <button
          id={`input-mode-${mode}`}
          key={mode}
          type="button"
          role="tab"
          aria-selected={activeMode === mode}
          aria-controls={`input-panel-${mode}`}
          tabIndex={activeMode === mode ? 0 : -1}
          className={activeMode === mode ? styles.activeTab : undefined}
          onClick={() => onSelect(mode)}
        >
          <span aria-hidden="true">{icon}</span> {label}
        </button>
      ))}
    </div>
  );
}
