import { useTheme } from "../utils/useTheme";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
      style={{
        background: "transparent",
        border: "1px solid var(--borda)",
        borderRadius: "20px",
        padding: "4px 10px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        color: "var(--texto-principal)",
        transition: "all 0.2s ease",
      }}
    >
      {isDark ? "☀️ Claro" : "🌙 Escuro"}
    </button>
  );
}