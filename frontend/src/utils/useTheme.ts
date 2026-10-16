import { useState, useEffect } from "react";

// O hook mantém a escolha de tema sincronizada entre estado, página e próxima visita.
export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const temaSalvo = localStorage.getItem("tema");
    if (temaSalvo) return temaSalvo === "dark";
    // Deteta se o sistema do utilizador já prefere modo escuro por padrão
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
      localStorage.setItem("tema", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("tema", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return { isDark, toggleTheme };
}