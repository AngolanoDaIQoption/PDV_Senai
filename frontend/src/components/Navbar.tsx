import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import type { Usuario } from "../types";

export default function Navbar() {
  const navigate = useNavigate();
  const usuario: Usuario | null = JSON.parse(localStorage.getItem("usuario") ?? "null");

  // Estado e persistência do Modo Escuro
  const [isDark, setIsDark] = useState<boolean>(() => {
    const temaSalvo = localStorage.getItem("tema");
    if (temaSalvo) return temaSalvo === "dark";
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

  const podeVerClientes = ["CAIXA", "GERENTE"].includes(usuario?.perfil ?? "");
  const podeGerenciarProdutos = ["SUPERVISOR", "GERENTE"].includes(usuario?.perfil ?? "");
  const podeVerVendas = usuario?.perfil === "GERENTE";
  const podeGerenciarUsuarios = usuario?.perfil === "GERENTE";

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  }

  return (
    <header className="navbar">
      <span className="navbar-marca">MS² Vestuário</span>

      <nav className="navbar-links">
        <NavLink to="/pdv">PDV</NavLink>
        {podeVerClientes && <NavLink to="/clientes">Clientes</NavLink>}
        {podeGerenciarProdutos && <NavLink to="/produtos">Produtos</NavLink>}
        {podeVerVendas && <NavLink to="/vendas">Vendas</NavLink>}
        {podeGerenciarUsuarios && <NavLink to="/usuarios">Usuários</NavLink>}
      </nav>

      <div className="navbar-usuario">
        <button
          type="button"
          className="btn btn-secundario"
          onClick={toggleTheme}
          title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          style={{ padding: "6px 12px", fontSize: "0.85rem" }}
        >
          {isDark ? "☀️ Claro" : "🌙 Escuro"}
        </button>

        {usuario && (
          <span>
            {usuario.nome} ({usuario.perfil})
          </span>
        )}
        <button className="btn btn-secundario" onClick={sair}>
          Sair
        </button>
      </div>
    </header>
  );
}